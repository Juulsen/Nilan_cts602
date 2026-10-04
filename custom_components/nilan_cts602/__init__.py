# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Nilan Comfort 300 LR with a CTS602 controller."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, CONF_PORT, CONF_TIMEOUT, EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady, HomeAssistantError
from homeassistant.helpers import config_validation as cv, entity_registry as er
import voluptuous as vol

from .const import (
    CONF_CONNECTION,
    CONF_DEVICE_ID,
    CONF_PLANT,
    CONF_REQUEST_DELAY,
    CONF_SCAN_INTERVAL,
    CONF_SERIAL_PORT,
    CONNECTION_SERIAL,
    DEFAULT_CONNECTION,
    DEFAULT_PORT,
    DEFAULT_REQUEST_DELAY,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_TIMEOUT,
    DOMAIN,
    PLATFORMS,
    STATIC_PATH,
    VERSION,
)
from .frontend_resource import pending_resource_updates
from .coordinator import NilanDataUpdateCoordinator
from .modbus_client import NilanModbusClient
from .plant import normalize_plant
from .writes import WriteRejected

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
_LOGGER = logging.getLogger(__name__)

ENABLEABLE_KEYS = ("t2_inlet", "t9_heater", "t10_external")


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Upgrade a stored plant from version 1 to version 2.

    Home Assistant calls this module-level function when the stored entry
    is older than NilanConfigFlow.VERSION / MINOR_VERSION (1.2). A method
    on the config flow is never called.
    """

    if entry.version == 1 and entry.minor_version < 2:
        stored = entry.options.get(CONF_PLANT)
        plant = normalize_plant(stored if isinstance(stored, dict) else None)
        hass.config_entries.async_update_entry(
            entry,
            minor_version=2,
            options={**entry.options, CONF_PLANT: plant},
        )
        _LOGGER.info("Migrated Nilan plant options to version %s", plant["version"])
    return True


@dataclass(slots=True)
class NilanRuntimeData:
    """Runtime objects for one config entry."""

    client: NilanModbusClient
    coordinator: NilanDataUpdateCoordinator


type NilanConfigEntry = ConfigEntry[NilanRuntimeData]


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Serve the card and register websocket commands once."""

    del config
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                STATIC_PATH,
                str(Path(__file__).parent / "frontend"),
                False,
            )
        ]
    )
    if not hass.data.get(f"{DOMAIN}_ws"):
        hass.data[f"{DOMAIN}_ws"] = True
        websocket_api.async_register_command(hass, ws_plant_get)
        websocket_api.async_register_command(hass, ws_plant_set)
        websocket_api.async_register_command(hass, ws_entities_enable)
        if not hass.services.has_service(DOMAIN, "reset_alarm"):
            hass.services.async_register(
                DOMAIN,
                "reset_alarm",
                _async_reset_alarm,
                schema=vol.Schema(
                    {
                        vol.Required("entry_id"): str,
                        vol.Required("code"): vol.All(vol.Coerce(int), vol.Range(min=1, max=99)),
                    }
                ),
            )

    async def _refresh_card(_event=None) -> None:
        await async_refresh_card_resource(hass)

    if hass.is_running:
        hass.async_create_task(_refresh_card())
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _refresh_card)
    return True


async def async_refresh_card_resource(hass: HomeAssistant) -> None:
    """Rewrite ?v= on the existing Nilan card resource. Does not create one."""

    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None)
    if resources is None or not hasattr(resources, "async_update_item"):
        return
    if getattr(resources, "loaded", True) is False and hasattr(resources, "async_load"):
        try:
            await resources.async_load()
        except Exception:
            _LOGGER.debug("Could not load Lovelace resources", exc_info=True)
            return
        resources.loaded = True
    try:
        items = resources.async_items()
    except Exception:
        _LOGGER.debug("Could not list Lovelace resources", exc_info=True)
        return
    for item_id, url in pending_resource_updates(items, VERSION):
        try:
            await resources.async_update_item(item_id, {"url": url})
        except Exception:
            _LOGGER.debug("Could not update Lovelace resource %s", item_id, exc_info=True)
            continue
        _LOGGER.info("Updated Nilan card resource %s to %s", item_id, url)


def _entry_or_error(hass, connection, msg):
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "not_found", "Unknown Nilan CTS602 config entry")
        return None
    return entry


@websocket_api.websocket_command(
    {
        vol.Required("type"): "nilan_cts602/plant/get",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.async_response
async def ws_plant_get(hass, connection, msg) -> None:
    """Return the plant stored on one config entry."""

    entry = _entry_or_error(hass, connection, msg)
    if entry is None:
        return
    stored = entry.options.get(CONF_PLANT)
    connection.send_result(
        msg["id"],
        {"plant": normalize_plant(stored) if isinstance(stored, dict) else normalize_plant({})},
    )


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "nilan_cts602/plant/set",
        vol.Required("entry_id"): str,
        vol.Required("plant"): dict,
    }
)
@websocket_api.async_response
async def ws_plant_set(hass, connection, msg) -> None:
    """Store the plant. Administrators only. Does not write Modbus."""

    entry = _entry_or_error(hass, connection, msg)
    if entry is None:
        return
    plant = normalize_plant(msg["plant"])
    hass.config_entries.async_update_entry(entry, options={**entry.options, CONF_PLANT: plant})
    hass.bus.async_fire(f"{DOMAIN}_plant_updated", {"entry_id": entry.entry_id, "plant": plant})
    connection.send_result(msg["id"], {"plant": plant})


@websocket_api.require_admin
@websocket_api.websocket_command(
    {
        vol.Required("type"): "nilan_cts602/entities/enable",
        vol.Required("entry_id"): str,
        vol.Required("entity_ids"): [str],
    }
)
@websocket_api.async_response
async def ws_entities_enable(hass, connection, msg) -> None:
    """Enable optional sensors an administrator explicitly confirmed."""

    entry = _entry_or_error(hass, connection, msg)
    if entry is None:
        return
    registry = er.async_get(hass)
    enabled: list[str] = []
    for entity_id in msg["entity_ids"]:
        entity = registry.async_get(entity_id)
        if entity is None or entity.config_entry_id != entry.entry_id:
            continue
        if entity.disabled_by is None:
            continue
        unique = entity.unique_id or ""
        if not any(unique.endswith(f"_{key}") for key in ENABLEABLE_KEYS):
            continue
        registry.async_update_entity(entity_id, disabled_by=None)
        enabled.append(entity_id)
    connection.send_result(msg["id"], {"enabled": enabled})


async def _async_reset_alarm(call) -> None:
    """Acknowledge one alarm. The card and automations both use this service."""

    hass = call.hass
    entry = hass.config_entries.async_get_entry(call.data["entry_id"])
    if entry is None or entry.domain != DOMAIN or entry.runtime_data is None:
        raise HomeAssistantError("Unknown Nilan CTS602 config entry")
    actor = "Home Assistant"
    user_id = getattr(call.context, "user_id", None)
    if user_id:
        user = await hass.auth.async_get_user(user_id)
        if user is not None and getattr(user, "name", None):
            actor = user.name
    try:
        await entry.runtime_data.coordinator.async_write_setting(
            "ctrl_reset_alarm",
            int(call.data["code"]),
            actor=actor,
        )
    except (WriteRejected, HomeAssistantError) as err:
        raise HomeAssistantError(str(err)) from err


async def async_setup_entry(hass: HomeAssistant, entry: NilanConfigEntry) -> bool:
    """Connect and start polling. Version 0.1.0 does not write."""

    connection = str(entry.data.get(CONF_CONNECTION, DEFAULT_CONNECTION))
    client = NilanModbusClient(
        connection=connection,
        host=str(entry.data.get(CONF_HOST, "")),
        port=int(entry.data.get(CONF_PORT, DEFAULT_PORT)),
        serial_port=str(entry.data.get(CONF_SERIAL_PORT, "")),
        device_id=int(entry.data[CONF_DEVICE_ID]),
        timeout=float(entry.data.get(CONF_TIMEOUT, DEFAULT_TIMEOUT)),
        request_delay=float(entry.data.get(CONF_REQUEST_DELAY, DEFAULT_REQUEST_DELAY)),
    )
    if connection == CONNECTION_SERIAL and not client.serial_port:
        raise ConfigEntryNotReady("Serial port is missing")

    interval = int(entry.data.get(CONF_SCAN_INTERVAL, int(DEFAULT_SCAN_INTERVAL.total_seconds())))
    coordinator = NilanDataUpdateCoordinator(
        hass,
        entry=entry,
        client=client,
        update_interval=timedelta(seconds=interval),
    )
    try:
        await coordinator.async_config_entry_first_refresh()
    except ConfigEntryNotReady:
        await coordinator.async_shutdown()
        raise

    entry.runtime_data = NilanRuntimeData(client=client, coordinator=coordinator)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    try:
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    except Exception:
        await coordinator.async_shutdown()
        raise
    return True


async def async_unload_entry(hass: HomeAssistant, entry: NilanConfigEntry) -> bool:
    """Stop polling and close the gateway connection."""

    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        await entry.runtime_data.coordinator.async_shutdown()
    return unload_ok


async def _async_update_listener(hass: HomeAssistant, entry: NilanConfigEntry) -> None:
    """Reload after options or reconfigure change."""

    await hass.config_entries.async_reload(entry.entry_id)

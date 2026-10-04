# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Config and options flow for the Nilan CTS602 integration."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.const import CONF_HOST, CONF_PORT, CONF_TIMEOUT
from homeassistant.helpers import selector

from .const import (
    CONF_CONNECTION,
    CONF_DEVICE_ID,
    CONF_MODEL_TYPE,
    CONF_PLANT,
    CONF_PROBES,
    CONF_PROTOCOL,
    CONF_REQUEST_DELAY,
    CONF_SCAN_INTERVAL,
    CONF_SERIAL_PORT,
    CONF_SW_VERSION,
    CONNECTION_SERIAL,
    CONNECTIONS,
    DEFAULT_CONNECTION,
    DEFAULT_DEVICE_ID,
    DEFAULT_PORT,
    DEFAULT_REQUEST_DELAY,
    DEFAULT_SCAN_INTERVAL,
    DEFAULT_SERIAL_PORT,
    DEFAULT_TIMEOUT,
    DOMAIN,
    MIN_REQUEST_DELAY,
    MIN_SCAN_INTERVAL,
    MODEL_NAME_COMFORT,
)
from .identify import UnsupportedModel, read_identity
from .modbus_client import (
    NilanConnectionError,
    NilanModbusClient,
    NilanModbusError,
    NilanReadError,
)
from .plant import REHEATERS, ROOM_SOURCES, normalize_plant

_LOGGER = logging.getLogger(__name__)


def _select(options: tuple[str, ...], translation_key: str):
    """Dropdown whose labels come from strings.json."""

    return selector.SelectSelector(
        selector.SelectSelectorConfig(
            options=list(options),
            translation_key=translation_key,
            mode=selector.SelectSelectorMode.DROPDOWN,
        )
    )


def _connection_schema(defaults: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(
                CONF_CONNECTION,
                default=defaults.get(CONF_CONNECTION, DEFAULT_CONNECTION),
            ): _select(CONNECTIONS, "connection"),
            vol.Optional(CONF_HOST, default=defaults.get(CONF_HOST, "")): str,
            vol.Optional(CONF_PORT, default=defaults.get(CONF_PORT, DEFAULT_PORT)): vol.All(
                vol.Coerce(int), vol.Range(min=1, max=65535)
            ),
            vol.Optional(
                CONF_SERIAL_PORT,
                default=defaults.get(CONF_SERIAL_PORT, DEFAULT_SERIAL_PORT),
            ): str,
            vol.Required(
                CONF_DEVICE_ID,
                default=defaults.get(CONF_DEVICE_ID, DEFAULT_DEVICE_ID),
            ): selector.NumberSelector(
                selector.NumberSelectorConfig(min=1, max=247, step=1, mode=selector.NumberSelectorMode.BOX)
            ),
            vol.Required(
                CONF_SCAN_INTERVAL,
                default=defaults.get(CONF_SCAN_INTERVAL, int(DEFAULT_SCAN_INTERVAL.total_seconds())),
            ): vol.All(vol.Coerce(int), vol.Range(min=MIN_SCAN_INTERVAL, max=3600)),
            vol.Required(
                CONF_TIMEOUT,
                default=defaults.get(CONF_TIMEOUT, DEFAULT_TIMEOUT),
            ): vol.All(vol.Coerce(float), vol.Range(min=1, max=60)),
            vol.Required(
                CONF_REQUEST_DELAY,
                default=defaults.get(CONF_REQUEST_DELAY, DEFAULT_REQUEST_DELAY),
            ): vol.All(vol.Coerce(float), vol.Range(min=MIN_REQUEST_DELAY, max=2)),
        }
    )


def _equipment_schema(plant: dict[str, Any]) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required("preheater", default=bool(plant.get("preheater"))): bool,
            vol.Required("reheater_electric", default=bool(plant.get("reheater_electric"))): bool,
            vol.Required("reheater_water", default=bool(plant.get("reheater_water"))): bool,
            vol.Required("options_board", default=bool(plant.get("options_board"))): bool,
            vol.Required("co2", default=bool(plant.get("co2"))): bool,
            vol.Required("t10", default=bool(plant.get("t10"))): bool,
            vol.Required("experimental", default=bool(plant.get("experimental"))): bool,
        }
    )


def _exclusive_reheater(user_input: dict[str, Any]) -> dict[str, str]:
    if user_input.get("reheater_electric") and user_input.get("reheater_water"):
        return {"base": "reheater_exclusive"}
    return {}


def _room_schema(plant: dict[str, Any]) -> vol.Schema:
    schema: dict[Any, Any] = {
        vol.Required("room_source", default=plant.get("room_source", "entity")): _select(ROOM_SOURCES, "room_source"),
    }
    entity = plant.get("room_entity") or ""
    entity_key = vol.Optional("room_entity", default=entity) if entity else vol.Optional("room_entity")
    schema[entity_key] = selector.EntitySelector(
        selector.EntitySelectorConfig(domain="sensor", device_class="temperature")
    )
    return vol.Schema(schema)


def _unique_id(data: dict[str, Any]) -> str:
    device_id = int(data[CONF_DEVICE_ID])
    if data.get(CONF_CONNECTION) == CONNECTION_SERIAL:
        return f"serial:{str(data.get(CONF_SERIAL_PORT, '')).strip()}:{device_id}"
    host = str(data.get(CONF_HOST, "")).strip().lower()
    return f"{data.get(CONF_CONNECTION)}:{host}:{int(data.get(CONF_PORT, DEFAULT_PORT))}:{device_id}"


def _placeholders(identity: dict[str, Any]) -> dict[str, str]:
    return {
        "software": str(identity.get("sw_version") or "?"),
        "protocol": str(identity.get("protocol_version") or "?"),
        "model": str(identity.get("model_name") or MODEL_NAME_COMFORT),
        "model_type": str(identity.get("model_type") or "?"),
    }


class NilanConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """UI setup. The controller is identified before the entry is created."""

    VERSION = 1
    MINOR_VERSION = 2

    def __init__(self) -> None:
        self._connection: dict[str, Any] = {}
        self._identity: dict[str, Any] = {}
        self._equipment: dict[str, Any] = {}

    def _duplicate(self, data: dict[str, Any], *, current_id: str | None = None):
        uid = _unique_id(data)
        for entry in self._async_current_entries():
            if current_id and entry.entry_id == current_id:
                continue
            if entry.unique_id == uid:
                return entry
        return None

    async def _identify(self, data: dict[str, Any]) -> dict[str, str]:
        client = NilanModbusClient(
            connection=data[CONF_CONNECTION],
            host=str(data.get(CONF_HOST, "")).strip(),
            port=int(data.get(CONF_PORT, DEFAULT_PORT)),
            serial_port=str(data.get(CONF_SERIAL_PORT, "")).strip(),
            device_id=int(data[CONF_DEVICE_ID]),
            timeout=float(data.get(CONF_TIMEOUT, DEFAULT_TIMEOUT)),
            request_delay=float(data.get(CONF_REQUEST_DELAY, DEFAULT_REQUEST_DELAY)),
        )
        try:
            self._identity = await read_identity(client)
        except UnsupportedModel as err:
            self._identity = {"model_type": err.model_type, "model_name": str(err.model_type)}
            return {"base": "unsupported_model"}
        except NilanConnectionError:
            return {"base": "cannot_connect"}
        except NilanReadError:
            return {"base": "cannot_read"}
        except NilanModbusError:
            return {"base": "modbus_error"}
        except Exception:  # noqa: BLE001 - keep the form usable
            _LOGGER.exception("Unexpected error identifying CTS602")
            return {"base": "unknown"}
        finally:
            await client.async_close()
        return {}

    def _normalize_connection(self, user_input: dict[str, Any]) -> dict[str, str]:
        user_input[CONF_HOST] = str(user_input.get(CONF_HOST, "")).strip()
        user_input[CONF_SERIAL_PORT] = str(user_input.get(CONF_SERIAL_PORT, "")).strip()
        user_input[CONF_DEVICE_ID] = int(user_input[CONF_DEVICE_ID])
        user_input[CONF_PORT] = int(user_input.get(CONF_PORT, DEFAULT_PORT))
        user_input[CONF_SCAN_INTERVAL] = int(user_input[CONF_SCAN_INTERVAL])
        if user_input[CONF_CONNECTION] == CONNECTION_SERIAL:
            if not user_input[CONF_SERIAL_PORT]:
                return {"base": "serial_required"}
        elif not user_input[CONF_HOST]:
            return {"base": "host_required"}
        return {}

    def _entry_data(self) -> dict[str, Any]:
        identity = self._identity
        return {
            **self._connection,
            CONF_PROTOCOL: int(identity["protocol_version"]),
            CONF_MODEL_TYPE: int(identity["model_type"]),
            CONF_SW_VERSION: identity.get("sw_version") or "",
            CONF_PROBES: dict(identity.get("probes") or {}),
        }

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Connection settings, then a read-only identification."""

        errors: dict[str, str] = {}
        if user_input is not None:
            errors = self._normalize_connection(user_input)
            if not errors:
                errors = await self._identify(user_input)
            if not errors:
                if self._duplicate(user_input) is not None:
                    return self.async_abort(reason="already_configured")
                self._connection = user_input
                return await self.async_step_equipment()
        return self.async_show_form(
            step_id="user",
            data_schema=_connection_schema(user_input or {}),
            errors=errors,
            description_placeholders=_placeholders(self._identity),
        )

    async def async_step_equipment(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Which heaters and sensors are fitted."""

        errors: dict[str, str] = {}
        if user_input is not None:
            errors = _exclusive_reheater(user_input)
            if not errors:
                self._equipment = user_input
                return await self.async_step_room()
        current = normalize_plant(user_input or self._equipment or None)
        return self.async_show_form(
            step_id="equipment",
            data_schema=_equipment_schema(current),
            errors=errors,
            description_placeholders=_placeholders(self._identity),
        )

    async def async_step_room(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Where the card and the room-temperature sensor should read from."""

        if user_input is not None:
            plant = normalize_plant({**self._equipment, **user_input})
            data = self._entry_data()
            await self.async_set_unique_id(_unique_id(data))
            self._abort_if_unique_id_configured()
            software = data.get(CONF_SW_VERSION) or "CTS602"
            return self.async_create_entry(
                title=f"Nilan Comfort ({software})",
                data=data,
                options={CONF_PLANT: plant},
            )
        current = normalize_plant({**self._equipment})
        return self.async_show_form(
            step_id="room",
            data_schema=_room_schema(current),
            description_placeholders=_placeholders(self._identity),
        )

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Update the connection and identify the controller again."""

        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = self._normalize_connection(user_input)
            if not errors:
                errors = await self._identify(user_input)
            if not errors:
                if self._duplicate(user_input, current_id=entry.entry_id) is not None:
                    return self.async_abort(reason="already_configured")
                self._connection = user_input
                data = self._entry_data()
                await self.async_set_unique_id(_unique_id(data))
                self._abort_if_unique_id_configured()
                return self.async_update_reload_and_abort(
                    entry,
                    data_updates=data,
                    reason="reconfigure_successful",
                )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_connection_schema(user_input or dict(entry.data)),
            errors=errors,
            description_placeholders=_placeholders(
                {
                    "sw_version": entry.data.get(CONF_SW_VERSION),
                    "protocol_version": entry.data.get(CONF_PROTOCOL),
                    "model_name": MODEL_NAME_COMFORT,
                    "model_type": entry.data.get(CONF_MODEL_TYPE),
                }
            ),
        )

    @staticmethod
    def async_get_options_flow(config_entry: config_entries.ConfigEntry) -> config_entries.OptionsFlow:
        return NilanOptionsFlow()


class NilanOptionsFlow(config_entries.OptionsFlow):
    """Change the plant without opening the Modbus connection."""

    def __init__(self) -> None:
        self._equipment: dict[str, Any] = {}

    def _placeholders(self) -> dict[str, str]:
        data = self.config_entry.data
        return _placeholders(
            {
                "sw_version": data.get(CONF_SW_VERSION),
                "protocol_version": data.get(CONF_PROTOCOL),
                "model_name": MODEL_NAME_COMFORT,
                "model_type": data.get(CONF_MODEL_TYPE),
            }
        )

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return await self.async_step_equipment(user_input)

    async def async_step_equipment(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            errors = _exclusive_reheater(user_input)
            if errors:
                current = normalize_plant(self.config_entry.options.get(CONF_PLANT))
                return self.async_show_form(
                    step_id="equipment",
                    data_schema=_equipment_schema({**current, **user_input, "reheater": "none"}),
                    errors=errors,
                    description_placeholders=self._placeholders(),
                )
            self._equipment = user_input
            return await self.async_step_room()
        current = normalize_plant(self.config_entry.options.get(CONF_PLANT))
        return self.async_show_form(
            step_id="equipment",
            data_schema=_equipment_schema(current),
            description_placeholders=self._placeholders(),
        )

    async def async_step_room(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            plant = normalize_plant({**self._equipment, **user_input})
            return self.async_create_entry(data={CONF_PLANT: plant})
        stored = normalize_plant(self.config_entry.options.get(CONF_PLANT))
        current = normalize_plant({**stored, **self._equipment})
        return self.async_show_form(
            step_id="room",
            data_schema=_room_schema(current),
            description_placeholders=self._placeholders(),
        )

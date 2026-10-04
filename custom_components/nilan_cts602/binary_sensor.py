# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Binary sensors for a Nilan Comfort 300 LR."""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.restore_state import RestoreEntity

from .catalog import entity_enabled_default, iter_entities
from .const import CONF_PROBES
from .coordinator import NilanDataUpdateCoordinator
from .entity import NilanEntity, plant_from_entry

PARALLEL_UPDATES = 0

_DEVICE_CLASS = {
    "running": BinarySensorDeviceClass.RUNNING,
    "problem": BinarySensorDeviceClass.PROBLEM,
    "opening": BinarySensorDeviceClass.OPENING,
}


class NilanBinarySensor(NilanEntity, BinarySensorEntity):
    """On/off value from the snapshot."""

    def __init__(self, coordinator, entry, spec) -> None:
        super().__init__(coordinator, entry, spec)
        if spec.device_class:
            self._attr_device_class = _DEVICE_CLASS[spec.device_class]
        if spec.category == "diagnostic":
            self._attr_entity_category = EntityCategory.DIAGNOSTIC
        probes = entry.data.get(CONF_PROBES) or {}
        self._attr_entity_registry_enabled_default = entity_enabled_default(
            spec,
            plant=plant_from_entry(entry),
            probes=probes if isinstance(probes, dict) else {},
        )

    @property
    def is_on(self) -> bool | None:
        point = self._point()
        if not point or not point.get("available"):
            return None
        return bool(point.get("value"))


class NilanBypassSensor(NilanBinarySensor, RestoreEntity):
    """Bypass position that survives a restart until the next motor pulse."""

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        last = await self.async_get_last_state()
        if last is None:
            return
        attributes = last.attributes or {}
        position = attributes.get("position")
        if position not in ("open", "closed"):
            if last.state == "on":
                position = "open"
            elif last.state == "off":
                position = "closed"
            else:
                return
        pulse = attributes.get("last_pulse")
        self.coordinator.restore_bypass(
            position=str(position),
            last_pulse=pulse if isinstance(pulse, dict) else None,
        )


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities) -> None:
    """Create the binary sensors selected for this plant."""

    del hass
    coordinator: NilanDataUpdateCoordinator = entry.runtime_data.coordinator
    protocol = int(coordinator.protocol or entry.data.get("protocol_version") or 0)
    plant = plant_from_entry(entry)
    async_add_entities(
        [
            (NilanBypassSensor if spec.key == "bypass" else NilanBinarySensor)(coordinator, entry, spec)
            for spec in iter_entities(protocol, plant)
            if spec.domain == "binary_sensor"
        ]
    )

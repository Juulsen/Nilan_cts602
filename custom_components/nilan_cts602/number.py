# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Number entities for allowlisted CTS602 settings."""

from __future__ import annotations

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.const import PERCENTAGE, UnitOfTemperature, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory

from .const import CONF_PROTOCOL
from .coordinator import NilanDataUpdateCoordinator
from .entity import NilanEntity, plant_from_entry, write_setting
from .settings import iter_settings

PARALLEL_UPDATES = 1

_UNITS = {
    "°C": UnitOfTemperature.CELSIUS,
    "%": PERCENTAGE,
    "min": UnitOfTime.MINUTES,
    "ppm": "ppm",
}


class NilanNumber(NilanEntity, NumberEntity):
    """One numeric setting. Automations call number.set_value."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_mode = NumberMode.BOX

    def __init__(self, coordinator, entry, spec) -> None:
        super().__init__(coordinator, entry, spec)
        self._attr_native_min_value = spec.minimum
        self._attr_native_max_value = spec.maximum
        self._attr_native_step = spec.step
        if spec.unit in _UNITS:
            self._attr_native_unit_of_measurement = _UNITS[spec.unit]
        elif spec.unit:
            self._attr_native_unit_of_measurement = spec.unit
        self._attr_icon = spec.icon

    @property
    def native_value(self):
        point = self._point()
        if not point or not point.get("available"):
            return None
        value = point.get("value")
        return float(value) if isinstance(value, (int, float)) else None

    async def async_set_native_value(self, value: float) -> None:
        await write_setting(self, value)


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities) -> None:
    """Create a number for every visible numeric setting."""

    del hass
    coordinator: NilanDataUpdateCoordinator = entry.runtime_data.coordinator
    protocol = int(coordinator.protocol or entry.data.get(CONF_PROTOCOL) or 0)
    plant = plant_from_entry(entry)
    async_add_entities(
        [
            NilanNumber(coordinator, entry, spec)
            for spec in iter_settings(plant, protocol=protocol)
            if spec.kind == "number"
        ]
    )

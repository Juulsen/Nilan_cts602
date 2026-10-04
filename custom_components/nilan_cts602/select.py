# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Select entities for allowlisted CTS602 settings."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory

from .const import CONF_PROTOCOL
from .coordinator import NilanDataUpdateCoordinator
from .entity import NilanEntity, plant_from_entry, write_setting
from .settings import choices_for, iter_settings

PARALLEL_UPDATES = 1


class NilanSelect(NilanEntity, SelectEntity):
    """One discrete setting. Automations call select.select_option."""

    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator, entry, spec) -> None:
        super().__init__(coordinator, entry, spec)
        self._attr_options = [choice.slug for choice in choices_for(spec, plant_from_entry(entry))]
        self._attr_icon = spec.icon

    @property
    def current_option(self) -> str | None:
        point = self._point()
        if not point or not point.get("available"):
            return None
        value = point.get("value")
        if value in self._attr_options:
            return str(value)
        return None

    async def async_select_option(self, option: str) -> None:
        await write_setting(self, option)


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities) -> None:
    """Create a select for every visible discrete setting."""

    del hass
    coordinator: NilanDataUpdateCoordinator = entry.runtime_data.coordinator
    protocol = int(coordinator.protocol or entry.data.get(CONF_PROTOCOL) or 0)
    plant = plant_from_entry(entry)
    async_add_entities(
        [
            NilanSelect(coordinator, entry, spec)
            for spec in iter_settings(plant, protocol=protocol)
            if spec.kind == "select"
        ]
    )

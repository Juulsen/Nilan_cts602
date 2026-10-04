# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Button entities for CTS602 actions."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity import EntityCategory
from homeassistant.util import dt as dt_util

from .const import CONF_PROTOCOL
from .coordinator import NilanDataUpdateCoordinator
from .entity import NilanEntity, plant_from_entry, write_setting
from .settings import iter_settings

PARALLEL_UPDATES = 1


def _clock_words(moment) -> list[int]:
    year = int(moment.year) % 100
    return [int(moment.second), int(moment.minute), int(moment.hour), int(moment.day), int(moment.month), year]


class NilanButton(NilanEntity, ButtonEntity):
    """One action. Automations call button.press."""

    _attr_entity_category = EntityCategory.CONFIG

    def __init__(self, coordinator, entry, spec) -> None:
        super().__init__(coordinator, entry, spec)
        self._attr_icon = spec.icon

    async def async_press(self) -> None:
        if self.spec.key == "ctrl_sync_clock":
            value = _clock_words(dt_util.now())
        else:
            value = self.spec.fixed_raw
        await write_setting(self, value)


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities) -> None:
    """Create buttons that do not need an extra parameter."""

    del hass
    coordinator: NilanDataUpdateCoordinator = entry.runtime_data.coordinator
    protocol = int(coordinator.protocol or entry.data.get(CONF_PROTOCOL) or 0)
    plant = plant_from_entry(entry)
    async_add_entities(
        [
            NilanButton(coordinator, entry, spec)
            for spec in iter_settings(plant, protocol=protocol)
            if spec.kind == "button" and (spec.fixed_raw is not None or spec.count > 1)
        ]
    )

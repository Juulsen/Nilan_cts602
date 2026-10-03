"""Shared entity base for one CTS602."""

from __future__ import annotations

from typing import Any

from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import CONF_DEVICE_ID, CONF_PROTOCOL, CONF_SW_VERSION, DOMAIN, MANUFACTURER, MODEL
from .coordinator import NilanDataUpdateCoordinator
from .plant import ROOM_SOURCE_NOTE_DA, ROOM_SOURCE_NOTE_EN, normalize_plant


def plant_from_entry(entry) -> dict:
    """Normalized plant stored on the config entry."""

    stored = entry.options.get("plant")
    return normalize_plant(stored if isinstance(stored, dict) else None)


class NilanEntity(CoordinatorEntity[NilanDataUpdateCoordinator]):
    """A value published in the coordinator snapshot."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: NilanDataUpdateCoordinator, entry, spec) -> None:
        super().__init__(coordinator)
        self._entry = entry
        self.spec = spec
        self._key = spec.key
        self._attr_unique_id = f"{entry.unique_id or entry.entry_id}_{spec.key}"
        self._attr_translation_key = spec.key
        self._attr_name = spec.name_en
        if spec.icon:
            self._attr_icon = spec.icon

    def _point(self) -> dict | None:
        data = self.coordinator.data
        if not isinstance(data, dict):
            return None
        points = data.get("points")
        if not isinstance(points, dict):
            return None
        point = points.get(self._key)
        return point if isinstance(point, dict) else None

    @property
    def available(self) -> bool:
        point = self._point()
        return bool(self.coordinator.last_update_success and point and point.get("available"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        point = self._point() or {}
        data = self.coordinator.data if isinstance(self.coordinator.data, dict) else {}
        attributes = dict(point.get("attributes") or {})
        attributes["nilan_device"] = self._entry.entry_id
        attributes["register_key"] = self._key
        attributes["protocol_version"] = data.get("protocol", self._entry.data.get(CONF_PROTOCOL))
        attributes["sw_version"] = data.get("sw_version", self._entry.data.get(CONF_SW_VERSION))
        attributes["slave_id"] = self._entry.data.get(CONF_DEVICE_ID)
        if self._key == "room_temperature":
            attributes["note_en"] = ROOM_SOURCE_NOTE_EN
            attributes["note_da"] = ROOM_SOURCE_NOTE_DA
            attributes["source"] = plant_from_entry(self._entry).get("room_source")
        if self._key == "t15_panel":
            attributes["note_en"] = (
                "T15 is input register 215, a signed word scaled by 0.01 °C, "
                "the same register and scale as the CTS602 protocol and the veista integration. "
                "It is the user-panel sensor. On this unit the panel is in the loft next to the ventilator, "
                "so a reading around 30 °C is the loft, not the living room."
            )
            attributes["note_da"] = (
                "T15 er inputregister 215, et fortegnsord skaleret med 0,01 °C, "
                "samme register og skala som CTS602-protokollen og veista-integrationen. "
                "Det er føleren i betjeningspanelet. På dette anlæg sidder panelet i loftet ved aggregatet, "
                "så en måling omkring 30 °C er loftet og ikke stuen."
            )
        return attributes

    @property
    def device_info(self) -> DeviceInfo:
        data = self.coordinator.data if isinstance(self.coordinator.data, dict) else {}
        protocol = data.get("protocol", self._entry.data.get(CONF_PROTOCOL))
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry.unique_id or self._entry.entry_id)},
            manufacturer=MANUFACTURER,
            model=MODEL,
            name="Nilan Comfort",
            sw_version=data.get("sw_version") or self._entry.data.get(CONF_SW_VERSION),
            hw_version=f"CTS602 protocol {protocol}",
        )

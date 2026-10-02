"""Sensors for a Nilan Comfort 300 LR."""

from __future__ import annotations

from datetime import datetime

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import PERCENTAGE, UnitOfTemperature, UnitOfTime, UnitOfRatio
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.util import dt as dt_util

from .catalog import OPTION_LISTS, entity_enabled_default, iter_entities
from .const import CONF_PROBES
from .coordinator import NilanDataUpdateCoordinator
from .entity import NilanEntity, plant_from_entry

PARALLEL_UPDATES = 0

_DEVICE_CLASS = {
    "temperature": SensorDeviceClass.TEMPERATURE,
    "humidity": SensorDeviceClass.HUMIDITY,
    "co2": SensorDeviceClass.CO2,
    "enum": SensorDeviceClass.ENUM,
    "timestamp": SensorDeviceClass.TIMESTAMP,
}

_UNITS = {
    "°C": UnitOfTemperature.CELSIUS,
    "%": PERCENTAGE,
    "ppm": UnitOfRatio.PARTS_PER_MILLION,
    "d": UnitOfTime.DAYS,
    "min": UnitOfTime.MINUTES,
}


class NilanSensor(NilanEntity, SensorEntity):
    """One decoded snapshot value."""

    def __init__(self, coordinator, entry, spec) -> None:
        super().__init__(coordinator, entry, spec)
        if spec.device_class:
            self._attr_device_class = _DEVICE_CLASS[spec.device_class]
        if spec.unit:
            self._attr_native_unit_of_measurement = _UNITS[spec.unit]
        if spec.state_class == "measurement" and spec.device_class != "enum":
            self._attr_state_class = SensorStateClass.MEASUREMENT
        if spec.precision is not None and spec.device_class != "enum":
            self._attr_suggested_display_precision = spec.precision
        if spec.options_name:
            self._attr_options = list(OPTION_LISTS[spec.options_name])
        if spec.category == "diagnostic":
            self._attr_entity_category = EntityCategory.DIAGNOSTIC
        probes = entry.data.get(CONF_PROBES) or {}
        self._attr_entity_registry_enabled_default = entity_enabled_default(
            spec,
            plant=plant_from_entry(entry),
            probes=probes if isinstance(probes, dict) else {},
        )

    @property
    def native_value(self):
        point = self._point()
        if not point:
            return None
        value = point.get("value")
        if self.spec.device_class == "timestamp" and isinstance(value, str):
            parsed = datetime.fromisoformat(value)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=dt_util.get_default_time_zone())
            return parsed
        return value


class NilanRoomTemperatureSensor(NilanSensor):
    """Room temperature from T15, T10 or another Home Assistant entity.

    An external entity is not written to the controller. The CTS602 has no
    Modbus register that accepts it.
    """

    def _external_entity_id(self) -> str | None:
        plant = plant_from_entry(self._entry)
        if plant.get("room_source") != "entity":
            return None
        return plant.get("room_entity")

    def _external_temperature(self) -> float | None:
        entity_id = self._external_entity_id()
        if not entity_id or self.hass is None:
            return None
        state = self.hass.states.get(entity_id)
        if state is None or state.state in ("unknown", "unavailable", "", "none"):
            return None
        try:
            return float(str(state.state).replace(",", "."))
        except ValueError:
            return None

    @property
    def available(self) -> bool:
        if self._external_entity_id():
            return self._external_temperature() is not None
        return super().available

    @property
    def native_value(self):
        if self._external_entity_id():
            return self._external_temperature()
        return super().native_value

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        entity_id = self._external_entity_id()
        if not entity_id:
            return
        self.async_on_remove(
            async_track_state_change_event(self.hass, [entity_id], self._external_changed)
        )

    @callback
    def _external_changed(self, event) -> None:
        del event
        self.async_write_ha_state()


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities) -> None:
    """Create the sensors selected for this protocol and plant."""

    del hass
    coordinator: NilanDataUpdateCoordinator = entry.runtime_data.coordinator
    protocol = int(coordinator.protocol or entry.data.get("protocol_version") or 0)
    plant = plant_from_entry(entry)
    entities = []
    for spec in iter_entities(protocol, plant):
        if spec.domain != "sensor":
            continue
        if spec.key == "room_temperature":
            entities.append(NilanRoomTemperatureSensor(coordinator, entry, spec))
        else:
            entities.append(NilanSensor(coordinator, entry, spec))
    async_add_entities(entities)

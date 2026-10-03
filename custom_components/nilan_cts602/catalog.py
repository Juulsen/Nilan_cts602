"""Entity plan and Modbus read blocks.

Blocks stay inside documented, contiguous addresses. Registers that only
exist on a newer protocol are left out of the poll, so an older controller
is not asked for an illegal address.
"""

from __future__ import annotations

from dataclasses import dataclass

from .alarms import alarm_slugs
from .decode import (
    CONTROL_STATES,
    COOLING_SETPOINTS,
    OPERATION_MODES,
    RUN_VALUES,
    USER_FUNCTIONS,
    WEEK_PROGRAMS,
)


@dataclass(frozen=True, slots=True)
class ReadBlock:
    """One FC03 or FC04 request."""

    table: str
    address: int
    count: int
    min_protocol: int = 0
    slow: bool = False

    @property
    def end(self) -> int:
        return self.address + self.count - 1


@dataclass(frozen=True, slots=True)
class EntitySpec:
    """One Home Assistant entity derived from the snapshot."""

    key: str
    domain: str
    name_en: str
    name_da: str
    device_class: str | None = None
    unit: str | None = None
    state_class: str | None = None
    precision: int | None = None
    options_name: str | None = None
    category: str | None = None
    icon: str | None = None
    # always | co2 | preheater | reheater | protocol9 | probe_t2 | probe_t9 | probe_t10
    when: str = "always"
    enabled: str = "yes"


READ_BLOCKS: tuple[ReadBlock, ...] = (
    ReadBlock("input", 0, 4, slow=True),
    ReadBlock("input", 200, 17),
    ReadBlock("input", 221, 2),
    ReadBlock("input", 400, 10),
    ReadBlock("input", 1000, 4),
    ReadBlock("input", 1100, 5, min_protocol=9),
    ReadBlock("input", 1200, 7),
    ReadBlock("input", 2000, 12, slow=True),
    ReadBlock("input", 3000, 1, min_protocol=11),
    ReadBlock("holding", 102, 26),
    ReadBlock("holding", 200, 3),
    ReadBlock("holding", 300, 6, slow=True),
    ReadBlock("holding", 500, 1, slow=True),
    ReadBlock("holding", 600, 6, slow=True),
    ReadBlock("holding", 610, 6, slow=True),
    ReadBlock("holding", 1001, 4, slow=True),
    ReadBlock("holding", 1101, 1, slow=True),
    ReadBlock("holding", 1200, 8, slow=True),
    ReadBlock("holding", 1910, 4, slow=True),
    ReadBlock("holding", 1920, 3, slow=True),
)

OPTION_LISTS = {
    "control_state": tuple(CONTROL_STATES.values()) + ("unknown",),
    "operation_mode": tuple(dict.fromkeys((*OPERATION_MODES.values(), "unknown"))),
    "run": tuple(RUN_VALUES.values()) + ("unknown",),
    "week": tuple(WEEK_PROGRAMS.values()) + ("unknown",),
    "user": tuple(USER_FUNCTIONS.values()) + ("unknown",),
    "cool": tuple(COOLING_SETPOINTS.values()) + ("unknown",),
    "alarm": alarm_slugs(),
}


ENTITIES: tuple[EntitySpec, ...] = (
    EntitySpec("t0_controller", "sensor", "Controller board (T0)", "Styrekort (T0)", "temperature", "°C", "measurement", 1, icon="mdi:chip"),
    EntitySpec("t2_inlet", "sensor", "Inlet before heater (T2)", "Før eftervarme (T2)", "temperature", "°C", "measurement", 1, enabled="probe_t2", icon="mdi:thermometer"),
    EntitySpec("t3_extract", "sensor", "Extract air (T3)", "Udsugning (T3)", "temperature", "°C", "measurement", 1, icon="mdi:thermometer"),
    EntitySpec("t4_exhaust", "sensor", "Exhaust air (T4)", "Afkast (T4)", "temperature", "°C", "measurement", 1, icon="mdi:thermometer"),
    EntitySpec("t7_supply", "sensor", "Supply air (T7)", "Indblæsning (T7)", "temperature", "°C", "measurement", 1, icon="mdi:thermometer"),
    EntitySpec("t8_outdoor", "sensor", "Outdoor air (T8)", "Udeluft (T8)", "temperature", "°C", "measurement", 1, icon="mdi:thermometer"),
    EntitySpec("t9_heater", "sensor", "Heating surface (T9)", "Varmeflade (T9)", "temperature", "°C", "measurement", 1, enabled="probe_t9", icon="mdi:thermometer"),
    EntitySpec("t10_external", "sensor", "External sensor (T10)", "Ekstern føler (T10)", "temperature", "°C", "measurement", 1, enabled="probe_t10", icon="mdi:thermometer"),
    EntitySpec("t15_panel", "sensor", "Loft panel (T15)", "Panel i loftet (T15)", "temperature", "°C", "measurement", 1, icon="mdi:thermometer"),
    EntitySpec("humidity", "sensor", "Humidity", "Fugtighed", "humidity", "%", "measurement", 1, icon="mdi:water-percent"),
    EntitySpec("co2", "sensor", "CO₂", "CO₂", "co2", "ppm", "measurement", 0, when="co2", icon="mdi:molecule-co2"),
    EntitySpec("control_state", "sensor", "Control state", "Driftstilstand", "enum", options_name="control_state", icon="mdi:state-machine"),
    EntitySpec("operation_mode", "sensor", "Operation mode", "Driftform", "enum", options_name="operation_mode", icon="mdi:tune"),
    EntitySpec("supply_setpoint", "sensor", "Supply setpoint", "Indblæsningssetpunkt", "temperature", "°C", "measurement", 1),
    EntitySpec("supply_fan_speed", "sensor", "Supply fan", "Indblæsning ventilator", None, "%", "measurement", 0, icon="mdi:fan"),
    EntitySpec("extract_fan_speed", "sensor", "Extract fan", "Udsugning ventilator", None, "%", "measurement", 0, icon="mdi:fan"),
    EntitySpec("fan_step", "sensor", "Actual fan step", "Aktuelt ventilatortrin", None, None, "measurement", 0, when="protocol9", icon="mdi:fan"),
    EntitySpec("supply_fan_step", "sensor", "Supply fan step", "Indblæsningstrin", None, None, "measurement", 0, when="protocol9", icon="mdi:fan"),
    EntitySpec("extract_fan_step", "sensor", "Extract fan step", "Udsugningstrin", None, None, "measurement", 0, when="protocol9", icon="mdi:fan"),
    EntitySpec("filter_days_since", "sensor", "Days since filter change", "Dage siden filterskift", None, "d", "measurement", 0, when="protocol9", icon="mdi:calendar"),
    EntitySpec("filter_days_left", "sensor", "Days to filter change", "Dage til filterskift", None, "d", "measurement", 0, when="protocol9", icon="mdi:calendar-clock"),
    EntitySpec("alarm_count", "sensor", "Alarm count", "Antal alarmer", None, None, "measurement", 0, icon="mdi:bell-badge"),
    EntitySpec("alarm_1", "sensor", "Alarm 1", "Alarm 1", "enum", options_name="alarm", icon="mdi:bell"),
    EntitySpec("alarm_2", "sensor", "Alarm 2", "Alarm 2", "enum", options_name="alarm", icon="mdi:bell"),
    EntitySpec("alarm_3", "sensor", "Alarm 3", "Alarm 3", "enum", options_name="alarm", icon="mdi:bell"),
    EntitySpec("controller_time", "sensor", "Controller clock", "Ur i regulatoren", "timestamp", category="diagnostic", icon="mdi:clock-outline"),
    EntitySpec("display_text", "sensor", "Panel display", "Display", category="diagnostic", icon="mdi:lcd"),
    EntitySpec("efficiency", "sensor", "Heat recovery (exhaust side)", "Varmegenvinding (afkastside)", None, "%", "measurement", 1, icon="mdi:heat-wave"),
    EntitySpec("efficiency_controller", "sensor", "Heat recovery (controller)", "Varmegenvinding (regulator)", None, "%", "measurement", 1, icon="mdi:heat-wave"),
    EntitySpec("room_temperature", "sensor", "Room temperature", "Rumtemperatur", "temperature", "°C", "measurement", 1, icon="mdi:home-thermometer"),
    EntitySpec("controlled_temperature", "sensor", "Controlled temperature", "Styret temperatur", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("controller_room_temperature", "sensor", "Controller room temperature", "Regulatorens rumtemperatur", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("protocol_version", "sensor", "Protocol version", "Protokolversion", category="diagnostic", icon="mdi:numeric"),
    EntitySpec("sw_version", "sensor", "Software version", "Softwareversion", category="diagnostic", icon="mdi:chip"),
    EntitySpec("reheater_capacity", "sensor", "Reheater capacity", "Eftervarme ydelse", None, "%", "measurement", 0, when="reheater", icon="mdi:radiator"),
    EntitySpec("set_run", "sensor", "Run setting", "Drift til/fra", "enum", options_name="run", category="diagnostic"),
    EntitySpec("set_mode", "sensor", "Mode setting", "Driftform (indstilling)", "enum", options_name="operation_mode", category="diagnostic"),
    EntitySpec("set_fan_step", "sensor", "Fan step setting", "Ventilatortrin (indstilling)", None, None, "measurement", 0, category="diagnostic"),
    EntitySpec("set_temperature", "sensor", "Temperature setpoint", "Temperatursetpunkt", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("supply_min_summer", "sensor", "Min supply summer", "Min. indblæsning sommer", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("supply_min_winter", "sensor", "Min supply winter", "Min. indblæsning vinter", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("supply_max_summer", "sensor", "Max supply summer", "Maks. indblæsning sommer", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("supply_max_winter", "sensor", "Max supply winter", "Maks. indblæsning vinter", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("summer_limit", "sensor", "Summer limit", "Sommer/vinter-grænse", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("night_cool_day_limit", "sensor", "Night cooling day limit", "Natkøling, daggrænse", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("night_cool_setpoint", "sensor", "Night cooling setpoint", "Natkøling, rumsetpunkt", "temperature", "°C", "measurement", 1, category="diagnostic"),
    EntitySpec("humidity_low_step", "sensor", "Low humidity fan step", "Fugt, lavt trin", None, None, "measurement", 0, category="diagnostic"),
    EntitySpec("humidity_high_step", "sensor", "High humidity fan step", "Fugt, højt trin", None, None, "measurement", 0, category="diagnostic"),
    EntitySpec("humidity_limit", "sensor", "Humidity limit", "Fugtegrænse", None, "%", "measurement", 1, category="diagnostic"),
    EntitySpec("humidity_high_time", "sensor", "Max high-humidity time", "Maks. tid høj fugt", None, "min", "measurement", 0, category="diagnostic"),
    EntitySpec("week_program", "sensor", "Week program", "Ugeprogram", "enum", options_name="week", category="diagnostic"),
    EntitySpec("cooling_setpoint", "sensor", "Cooling setpoint", "Kølesætpunkt", "enum", options_name="cool", category="diagnostic"),
    EntitySpec("cooling_fan_step", "sensor", "Cooling fan step", "Køletrin", None, None, "measurement", 0, category="diagnostic"),
    EntitySpec("user_function_1_type", "sensor", "User function 1", "Brugerfunktion 1", "enum", options_name="user", category="diagnostic"),
    EntitySpec("user_function_2_type", "sensor", "User function 2", "Brugerfunktion 2", "enum", options_name="user", category="diagnostic"),
    EntitySpec("co2_high_step", "sensor", "CO₂ fan step", "CO₂ ventilatortrin", None, None, "measurement", 0, when="co2", category="diagnostic"),
    EntitySpec("co2_limit_low", "sensor", "CO₂ normal limit", "CO₂ normalgrænse", None, "ppm", "measurement", 0, when="co2", category="diagnostic"),
    EntitySpec("co2_limit_high", "sensor", "CO₂ high limit", "CO₂ høj grænse", None, "ppm", "measurement", 0, when="co2", category="diagnostic"),
    EntitySpec("running", "binary_sensor", "Running", "Kører", "running", icon="mdi:fan"),
    EntitySpec("summer", "binary_sensor", "Summer", "Sommer", icon="mdi:weather-sunny"),
    EntitySpec("alarm_active", "binary_sensor", "Alarm active", "Alarm aktiv", "problem", icon="mdi:bell-alert"),
    EntitySpec("filter", "binary_sensor", "Filter alarm", "Filteralarm", "problem", icon="mdi:air-filter"),
    EntitySpec("bypass", "binary_sensor", "Bypass open", "Bypass åben", "opening", icon="mdi:swap-horizontal"),
    EntitySpec("bypass_open_relay", "binary_sensor", "Bypass motor opening", "Bypass motor åbner", "running", icon="mdi:valve-open", category="diagnostic"),
    EntitySpec("bypass_close_relay", "binary_sensor", "Bypass motor closing", "Bypass motor lukker", "running", icon="mdi:valve-closed", category="diagnostic"),
    EntitySpec("defrost", "binary_sensor", "Defrost", "Afrimning", icon="mdi:snowflake"),
    EntitySpec("user_function", "binary_sensor", "User function active", "Brugerfunktion aktiv", icon="mdi:timer-outline"),
    EntitySpec("preheater", "binary_sensor", "Preheater active", "Forvarme aktiv", when="preheater", icon="mdi:heating-coil"),
    EntitySpec("reheater", "binary_sensor", "Reheater active", "Eftervarme aktiv", when="reheater", icon="mdi:radiator"),
)

ENTITIES_BY_KEY = {spec.key: spec for spec in ENTITIES}


def read_blocks(protocol: int, *, include_slow: bool) -> tuple[ReadBlock, ...]:
    """Blocks to poll for this protocol version."""

    selected = []
    for block in READ_BLOCKS:
        if protocol < block.min_protocol:
            continue
        if block.slow and not include_slow:
            continue
        selected.append(block)
    return tuple(selected)


def entity_included(spec: EntitySpec, *, protocol: int, plant: dict) -> bool:
    """False when the hardware or protocol cannot provide the entity."""

    if spec.when == "co2":
        return bool(plant.get("co2"))
    if spec.when == "preheater":
        return bool(plant.get("preheater"))
    if spec.when == "reheater":
        return plant.get("reheater") not in (None, "none")
    if spec.when == "protocol9":
        return protocol >= 9
    return True


def entity_enabled_default(spec: EntitySpec, *, plant: dict, probes: dict) -> bool:
    """Disabled optional sensors stay in the registry so they can be enabled."""

    if spec.enabled == "probe_t2":
        return bool(probes.get("t2"))
    if spec.enabled == "probe_t9":
        return bool(probes.get("t9")) or plant.get("reheater") == "water"
    if spec.enabled == "probe_t10":
        return bool(probes.get("t10")) or bool(plant.get("t10"))
    return True


def iter_entities(protocol: int, plant: dict) -> list[EntitySpec]:
    """Entities created for this controller and protocol."""

    return [spec for spec in ENTITIES if entity_included(spec, protocol=protocol, plant=plant)]

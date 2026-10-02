"""Pure CTS602 decoding.

No Home Assistant imports. Temperatures are signed 16-bit values scaled by
0.01 °C. Text registers are two ASCII characters, low byte first, and 0xDF
is the degree sign. Addresses in this module are the 0-based PDU addresses
from Nilan's Modbus table.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, time

from .alarms import alarm_for_code

EFFICIENCY_MIN_DELTA_C = 3.0
TEMP_PLAUSIBLE_MIN = -35.0
TEMP_PLAUSIBLE_MAX = 90.0
FILTER_ALARM_CODE = 19
BYPASS_POSITION_PROTOCOL = 11
FAN_STEP_PROTOCOL = 9

CONTROL_STATES = {
    0: "off",
    1: "shift",
    2: "stop",
    3: "start",
    4: "standby",
    5: "ventilation_stop",
    6: "ventilation",
    7: "heating",
    8: "cooling",
    9: "hot_water",
    10: "legionella",
    11: "cooling_hot_water",
    12: "central_heating",
    13: "defrost",
    14: "frost_secure",
    15: "service",
    16: "alarm",
}

OPERATION_MODES = {
    0: "off",
    1: "heat",
    2: "cool",
    3: "auto",
    4: "service",
}

RUN_VALUES = {0: "off", 1: "on"}

WEEK_PROGRAMS = {
    0: "none",
    1: "program_1",
    2: "program_2",
    3: "program_3",
    4: "erase",
}

USER_FUNCTIONS = {
    0: "none",
    1: "extend",
    2: "inlet",
    3: "exhaust",
    4: "external_heater_offset",
    5: "ventilate",
    6: "cooker_hood",
}

COOLING_SETPOINTS = {
    0: "off",
    1: "plus_0",
    2: "plus_1",
    3: "plus_2",
    4: "plus_3",
    5: "plus_4",
    6: "plus_5",
    7: "plus_7",
    8: "plus_10",
}


def signed_int16(raw: int) -> int:
    """Interpret an unsigned Modbus word as a signed 16-bit integer."""

    word = int(raw) & 0xFFFF
    if word >= 0x8000:
        return word - 0x10000
    return word


def scale_temperature(raw: int) -> float:
    """CTS602 temperature: signed word, 0.01 °C per count."""

    return signed_int16(raw) / 100.0


def scale_unsigned(raw: int, divisor: int = 100) -> float:
    """Unsigned word divided by a documented scale."""

    return (int(raw) & 0xFFFF) / divisor


def temperature_plausible(value: float | None) -> bool:
    """False for the open-circuit readings an unused NTC usually produces."""

    if value is None:
        return False
    return TEMP_PLAUSIBLE_MIN <= float(value) <= TEMP_PLAUSIBLE_MAX


def decode_ascii(words: list[int] | tuple[int, ...]) -> str:
    """Join text registers. Each word is two characters, low byte first."""

    chars: list[str] = []
    for word in words:
        for byte in (int(word) & 0xFF, (int(word) >> 8) & 0xFF):
            if byte == 0xDF:
                chars.append("°")
            elif byte in (0, 0xFF):
                continue
            elif 32 <= byte <= 126:
                chars.append(chr(byte))
    return "".join(chars).strip()


def decode_software(words: list[int] | tuple[int, ...]) -> str:
    """Software version from the three ASCII input registers."""

    return decode_ascii(words)


def enum_value(mapping: dict[int, str], raw: int | None) -> str:
    """Map a raw code to a stable slug. Unknown codes stay visible."""

    if raw is None:
        return "unknown"
    return mapping.get(int(raw) & 0xFFFF, "unknown")


def exhaust_efficiency(
    t3: float | None,
    t4: float | None,
    t8: float | None,
    *,
    min_delta: float = EFFICIENCY_MIN_DELTA_C,
) -> float | None:
    """Exhaust-side temperature efficiency, (T3−T4)/(T3−T8)·100.

    The result is clamped to 0..100. It is None when any temperature is
    missing or when T3−T8 is below ``min_delta`` (default 3 K), where the
    ratio stops meaning anything useful.
    """

    if t3 is None or t4 is None or t8 is None:
        return None
    delta = t3 - t8
    if delta < min_delta:
        return None
    value = (t3 - t4) / delta * 100.0
    if value < 0.0:
        return 0.0
    if value > 100.0:
        return 100.0
    return value


def filter_alarm(
    alarm_status: int | None,
    codes: list[int],
    days_left: int | None,
) -> bool:
    """Filter warning from alarm 19 or a due filter timer.

    The pressure-switch input is intentionally not used. Stale alarm slots
    outside the active count are ignored, so a cleared filter alarm does not
    stay on.
    """

    if days_left is not None and int(days_left) <= 0:
        return True
    if alarm_status is None:
        return False
    count = int(alarm_status) & 0x03
    active = [int(code) for code in codes[:count]]
    return FILTER_ALARM_CODE in active


def alarm_active(alarm_status: int | None) -> bool:
    """Bit 7 of input 400."""

    if alarm_status is None:
        return False
    return bool(int(alarm_status) & 0x80)


def alarm_count(alarm_status: int | None) -> int:
    """Bits 0..1 of input 400, the number of alarms in the list."""

    if alarm_status is None:
        return 0
    return int(alarm_status) & 0x03


def decode_alarm_date(raw: int | None) -> date | None:
    """Best-effort date: day in bits 0..4, month in 5..8, year-2000 in 9..15.

    The PDF does not document the encoding. Invalid combinations return None
    and the raw word is kept beside the alarm.
    """

    if raw is None:
        return None
    word = int(raw) & 0xFFFF
    if word in (0, 0xFFFF):
        return None
    day = word & 0x1F
    month = (word >> 5) & 0x0F
    year = 2000 + ((word >> 9) & 0x7F)
    if not (1 <= day <= 31 and 1 <= month <= 12 and 2000 <= year <= 2099):
        return None
    try:
        return date(year, month, day)
    except ValueError:
        return None


def decode_alarm_time(raw: int | None) -> time | None:
    """Best-effort time: hour in the high byte, minute in the low byte."""

    if raw is None:
        return None
    word = int(raw) & 0xFFFF
    if word in (0, 0xFFFF):
        return None
    minute = word & 0xFF
    hour = (word >> 8) & 0xFF
    if hour <= 23 and minute <= 59:
        return time(hour, minute)
    return None


def decode_clock(
    second: int | None,
    minute: int | None,
    hour: int | None,
    day: int | None,
    month: int | None,
    year: int | None,
) -> datetime | None:
    """Controller clock from holding registers 300..305. Local, naive."""

    if None in (second, minute, hour, day, month, year):
        return None
    full_year = int(year)
    if full_year < 100:
        full_year += 2000
    try:
        return datetime(full_year, int(month), int(day), int(hour), int(minute), int(second))
    except (TypeError, ValueError):
        return None


@dataclass(slots=True)
class BypassState:
    """Latched bypass flap position.

    Holding 102 (Modbus 40103, H102 BypassOpen) and holding 103 (40104, H103
    BypassClose) are motor relays. On protocol 9 they are 1 only while the
    flap is travelling and then return to 0. The position follows the last
    finished pulse: open stays open until a close pulse completes, and the
    other way around. `moving` is set while a relay is still on.
    """

    position: str = "unknown"
    pending_open: bool = False
    pending_close: bool = False
    moving: str | None = None
    restored: bool = False
    last_pulse: dict | None = None

    def copy(self) -> BypassState:
        pulse = dict(self.last_pulse) if isinstance(self.last_pulse, dict) else self.last_pulse
        return BypassState(
            self.position,
            self.pending_open,
            self.pending_close,
            self.moving,
            self.restored,
            pulse,
        )


def _pulse(relay: str, now: datetime | None) -> dict:
    stamp = now or datetime.now(UTC)
    return {"relay": relay, "at": stamp.isoformat()}


def restore_bypass(state: BypassState, *, position: str, last_pulse: dict | None) -> BypassState:
    """Keep a position saved before restart, until a live pulse is seen.

    A pulse that already happened in this process is not replaced.
    """

    if state.moving or state.pending_open or state.pending_close:
        return state
    if state.position in ("open", "closed") and not state.restored:
        return state
    if position not in ("open", "closed"):
        return state
    pulse = dict(last_pulse) if isinstance(last_pulse, dict) else None
    return BypassState(position, False, False, None, True, pulse)


def next_bypass(
    state: BypassState,
    *,
    open_relay: bool | None,
    close_relay: bool | None,
    position_register: int | None,
    use_position_register: bool,
    now: datetime | None = None,
) -> BypassState:
    """Advance the latched bypass position by one poll."""

    if use_position_register and position_register is not None:
        position = "open" if int(position_register) else "closed"
        return BypassState(position, False, False, None, False, state.last_pulse)

    if open_relay is None or close_relay is None:
        return state.copy()

    if open_relay and close_relay:
        return state.copy()
    if open_relay:
        return BypassState(state.position, True, False, "opening", False, state.last_pulse)
    if close_relay:
        return BypassState(state.position, False, True, "closing", False, state.last_pulse)

    position = state.position
    last_pulse = state.last_pulse
    restored = state.restored
    if state.pending_open:
        position = "open"
        restored = False
        last_pulse = _pulse("H102", now)
    elif state.pending_close:
        position = "closed"
        restored = False
        last_pulse = _pulse("H103", now)
    return BypassState(position, False, False, None, restored, last_pulse)


def _point(value: object, *, available: bool | None = None, **attributes: object) -> dict:
    if available is None:
        available = value is not None
    return {"value": value, "available": available, "attributes": dict(attributes)}


def _temp(raw: int | None) -> float | None:
    if raw is None:
        return None
    return scale_temperature(raw)


def _get(table: dict[int, int], address: int) -> int | None:
    value = table.get(address)
    return None if value is None else int(value)


def _alarm_point(code_raw: int | None, date_raw: int | None, time_raw: int | None, *, active: bool) -> dict:
    alarm = alarm_for_code(0 if code_raw in (None, 0) else code_raw)
    decoded_date = decode_alarm_date(date_raw)
    decoded_time = decode_alarm_time(time_raw)
    return _point(
        alarm.slug,
        available=code_raw is not None,
        code=None if code_raw is None else int(code_raw),
        active_slot=active,
        severity=alarm.severity,
        name_en=alarm.name_en,
        name_da=alarm.name_da,
        description_en=alarm.description_en,
        description_da=alarm.description_da,
        alarm_date=None if decoded_date is None else decoded_date.isoformat(),
        alarm_time=None if decoded_time is None else decoded_time.strftime("%H:%M"),
        raw_date=date_raw,
        raw_time=time_raw,
        date_decoded=decoded_date is not None,
        time_decoded=decoded_time is not None,
    )


def build_snapshot(
    *,
    inputs: dict[int, int],
    holdings: dict[int, int],
    protocol: int,
    bypass_position: str,
    plant: dict,
    external_room: float | None = None,
    bypass: BypassState | None = None,
) -> dict:
    """Decode a register image into entity points. Missing keys are omitted."""

    points: dict[str, dict] = {}
    t_values = {address: _temp(_get(inputs, address)) for address in range(200, 217)}

    def add_temp(key: str, address: int) -> None:
        value = t_values.get(address)
        points[key] = _point(value, available=value is not None, plausible=temperature_plausible(value))

    add_temp("t0_controller", 200)
    add_temp("t2_inlet", 202)
    add_temp("t3_extract", 203)
    add_temp("t4_exhaust", 204)
    add_temp("t7_supply", 207)
    add_temp("t8_outdoor", 208)
    add_temp("t9_heater", 209)
    add_temp("t10_external", 210)
    add_temp("t15_panel", 215)

    humidity = _get(inputs, 221)
    points["humidity"] = _point(None if humidity is None else scale_unsigned(humidity))
    if plant.get("co2"):
        co2 = _get(inputs, 222)
        points["co2"] = _point(None if co2 is None else int(co2))

    status = _get(inputs, 400)
    count = alarm_count(status)
    points["alarm_count"] = _point(count, available=status is not None, raw_status=status)
    points["alarm_active"] = _point(alarm_active(status), available=status is not None)
    for index, base in enumerate((401, 404, 407), start=1):
        points[f"alarm_{index}"] = _alarm_point(
            _get(inputs, base),
            _get(inputs, base + 1),
            _get(inputs, base + 2),
            active=index <= count and (_get(inputs, base) not in (None, 0)),
        )

    run = _get(inputs, 1000)
    points["running"] = _point(bool(run) if run is not None else None, available=run is not None)
    mode = _get(inputs, 1001)
    points["operation_mode"] = _point(
        enum_value(OPERATION_MODES, mode),
        available=mode is not None,
        raw_value=mode,
    )
    state = _get(inputs, 1002)
    points["control_state"] = _point(
        enum_value(CONTROL_STATES, state),
        available=state is not None,
        raw_value=state,
    )

    summer = _get(inputs, 1200)
    points["summer"] = _point(bool(summer) if summer is not None else None, available=summer is not None)
    setpoint = _temp(_get(inputs, 1201))
    points["supply_setpoint"] = _point(setpoint)
    controlled = _temp(_get(inputs, 1202))
    points["controlled_temperature"] = _point(controlled)
    controller_room = _temp(_get(inputs, 1203))
    points["controller_room_temperature"] = _point(controller_room)

    t3 = t_values.get(203)
    t4 = t_values.get(204)
    t8 = t_values.get(208)
    efficiency = exhaust_efficiency(t3, t4, t8)
    delta = None if t3 is None or t8 is None else t3 - t8
    if t3 is None or t4 is None or t8 is None:
        efficiency_reason = "missing_temperature"
    elif efficiency is None:
        efficiency_reason = "delta_below_3k"
    else:
        efficiency_reason = None
    points["efficiency"] = _point(
        efficiency,
        available=efficiency is not None,
        formula="(T3-T4)/(T3-T8)*100",
        minimum_delta_c=EFFICIENCY_MIN_DELTA_C,
        delta_c=None if delta is None else round(delta, 2),
        reason=efficiency_reason,
        label_en="Exhaust-side temperature efficiency",
        label_da="Temperaturafgivelse på afkastsiden",
    )
    controller_eff = _get(inputs, 1204)
    points["efficiency_controller"] = _point(
        None if controller_eff is None else scale_unsigned(controller_eff),
        label_en="Controller heat-exchanger efficiency",
        label_da="Regulatorens vekslereffektivitet",
        source="input_1204",
    )

    if protocol >= FAN_STEP_PROTOCOL:
        for key, address in (
            ("fan_step", 1100),
            ("supply_fan_step", 1101),
            ("extract_fan_step", 1102),
            ("filter_days_since", 1103),
            ("filter_days_left", 1104),
        ):
            raw = _get(inputs, address)
            points[key] = _point(None if raw is None else int(raw), min_protocol=FAN_STEP_PROTOCOL)

    days_left = None if protocol < FAN_STEP_PROTOCOL else _get(inputs, 1104)
    codes = [_get(inputs, 401), _get(inputs, 404), _get(inputs, 407)]
    present_codes = [0 if code is None else code for code in codes]
    points["filter"] = _point(
        filter_alarm(status, present_codes, days_left),
        available=status is not None or days_left is not None,
        source="alarm_19_or_days_left",
        days_left=days_left,
    )

    supply_fan = _get(holdings, 201)
    extract_fan = _get(holdings, 200)
    points["supply_fan_speed"] = _point(None if supply_fan is None else scale_unsigned(supply_fan))
    points["extract_fan_speed"] = _point(None if extract_fan is None else scale_unsigned(extract_fan))
    if plant.get("reheater") not in (None, "none"):
        capacity = _get(holdings, 202)
        points["reheater_capacity"] = _point(None if capacity is None else scale_unsigned(capacity))
        points["reheater"] = _point(
            bool(capacity) if capacity is not None else None,
            available=capacity is not None,
        )

    flap = bypass if bypass is not None else BypassState(position=bypass_position)
    points["bypass"] = _point(
        flap.position == "open" if flap.position in ("open", "closed") else None,
        available=flap.position in ("open", "closed"),
        position=flap.position,
        moving=flap.moving,
        restored=flap.restored,
        last_pulse=flap.last_pulse,
        source="position_register" if protocol >= BYPASS_POSITION_PROTOCOL else "relay_pulse",
    )
    points["bypass_open_relay"] = _point(
        bool(holdings[102]) if 102 in holdings else None,
        available=102 in holdings,
        register="holding_102",
        modbus="40103",
    )
    points["bypass_close_relay"] = _point(
        bool(holdings[103]) if 103 in holdings else None,
        available=103 in holdings,
        register="holding_103",
        modbus="40104",
    )
    defrost = _get(holdings, 125)
    points["defrost"] = _point(bool(defrost) if defrost is not None else None, available=defrost is not None)
    user_1 = _get(holdings, 123)
    user_2 = _get(holdings, 124)
    if user_1 is None and user_2 is None:
        points["user_function"] = _point(None, available=False)
    else:
        points["user_function"] = _point(
            bool(user_1) or bool(user_2),
            available=True,
            user_function_1=bool(user_1),
            user_function_2=bool(user_2),
        )
    if plant.get("preheater"):
        preheat = _get(holdings, 127)
        points["preheater"] = _point(bool(preheat) if preheat is not None else None, available=preheat is not None)

    _add_settings(points, holdings, plant)

    line_1 = decode_ascii([inputs[addr] for addr in range(2002, 2006) if addr in inputs]) if any(addr in inputs for addr in range(2002, 2006)) else None
    line_2 = decode_ascii([inputs[addr] for addr in range(2007, 2011) if addr in inputs]) if any(addr in inputs for addr in range(2007, 2011)) else None
    if line_1 is not None or line_2 is not None:
        points["display_text"] = _point(line_1 or "", available=True, line_1=line_1 or "", line_2=line_2 or "")

    clock = decode_clock(
        _get(holdings, 300),
        _get(holdings, 301),
        _get(holdings, 302),
        _get(holdings, 303),
        _get(holdings, 304),
        _get(holdings, 305),
    )
    if any(addr in holdings for addr in range(300, 306)):
        points["controller_time"] = _point(
            None if clock is None else clock.isoformat(timespec="seconds"),
            available=clock is not None,
        )

    protocol_raw = _get(inputs, 0)
    points["protocol_version"] = _point(int(protocol_raw) if protocol_raw is not None else int(protocol))
    if all(addr in inputs for addr in (1, 2, 3)):
        points["sw_version"] = _point(decode_software([inputs[1], inputs[2], inputs[3]]) or None)

    room_source = plant.get("room_source", "entity")
    room_value: float | None
    if room_source == "t15":
        room_value = t_values.get(215)
    elif room_source == "t10":
        room_value = t_values.get(210)
    else:
        room_value = external_room
    points["room_temperature"] = _point(
        room_value,
        available=room_value is not None,
        source=room_source,
        room_entity=plant.get("room_entity"),
        controller_cannot_use_external_sensor=True,
    )

    return {
        "protocol": int(protocol),
        "sw_version": points.get("sw_version", {}).get("value"),
        "model": "COMFORT",
        "points": points,
        "bypass_position": flap.position,
    }


def _add_settings(points: dict[str, dict], holdings: dict[int, int], plant: dict) -> None:
    """Read-only copies of user settings. Nothing here is written in v0.1.0."""

    specs: list[tuple[str, int, str]] = [
        ("set_run", 1001, "run"),
        ("set_mode", 1002, "mode"),
        ("set_fan_step", 1003, "step"),
        ("set_temperature", 1004, "temp"),
        ("cooling_fan_step", 1101, "step"),
        ("cooling_setpoint", 1200, "cool"),
        ("supply_min_summer", 1201, "temp"),
        ("supply_min_winter", 1202, "temp"),
        ("supply_max_summer", 1203, "temp"),
        ("supply_max_winter", 1204, "temp"),
        ("summer_limit", 1205, "temp"),
        ("night_cool_day_limit", 1206, "temp_assumed"),
        ("night_cool_setpoint", 1207, "temp_assumed"),
        ("humidity_low_step", 1910, "step"),
        ("humidity_high_step", 1911, "step"),
        ("humidity_limit", 1912, "percent"),
        ("humidity_high_time", 1913, "minutes"),
        ("week_program", 500, "week"),
        ("user_function_1_type", 601, "user"),
        ("user_function_2_type", 611, "user"),
    ]
    if plant.get("co2"):
        specs.extend(
            [
                ("co2_high_step", 1920, "step"),
                ("co2_limit_low", 1921, "ppm"),
                ("co2_limit_high", 1922, "ppm"),
            ]
        )
    for key, address, kind in specs:
        raw = _get(holdings, address)
        if kind == "run":
            points[key] = _point(enum_value(RUN_VALUES, raw), available=raw is not None, raw_value=raw, read_only=True)
        elif kind == "mode":
            points[key] = _point(enum_value(OPERATION_MODES, raw), available=raw is not None, raw_value=raw, read_only=True)
        elif kind == "week":
            points[key] = _point(enum_value(WEEK_PROGRAMS, raw), available=raw is not None, raw_value=raw, read_only=True)
        elif kind == "user":
            points[key] = _point(enum_value(USER_FUNCTIONS, raw), available=raw is not None, raw_value=raw, read_only=True)
        elif kind == "cool":
            points[key] = _point(enum_value(COOLING_SETPOINTS, raw), available=raw is not None, raw_value=raw, read_only=True)
        elif kind == "temp":
            points[key] = _point(_temp(raw), read_only=True)
        elif kind == "temp_assumed":
            points[key] = _point(_temp(raw), read_only=True, scale_assumed=True, scale=0.01)
        elif kind == "percent":
            points[key] = _point(None if raw is None else scale_unsigned(raw), read_only=True)
        elif kind == "minutes":
            points[key] = _point(None if raw is None else int(raw), read_only=True)
        elif kind == "ppm":
            points[key] = _point(None if raw is None else int(raw), read_only=True)
        else:
            points[key] = _point(None if raw is None else int(raw), read_only=True)

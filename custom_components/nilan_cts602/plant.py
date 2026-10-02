"""Plant options for one Comfort 300 LR.

The plant describes hardware the Modbus map cannot detect reliably: preheater,
reheater, CO2, T10 and which temperature Home Assistant should treat as the
room. It is stored on the config entry and may be replaced from the card.
Unknown keys are ignored so older cards keep working.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

PLANT_VERSION = 1

REHEATER_NONE = "none"
REHEATER_ELECTRIC = "electric"
REHEATER_WATER = "water"
REHEATERS = (REHEATER_NONE, REHEATER_ELECTRIC, REHEATER_WATER)

ROOM_T15 = "t15"
ROOM_T10 = "t10"
ROOM_ENTITY = "entity"
ROOM_SOURCES = (ROOM_T15, ROOM_T10, ROOM_ENTITY)

# The controller has no Modbus register for an external room sensor.
# T15 is the user panel. T10 is on the control board. Both sit in the unit
# on the installation this integration was built for.
ROOM_SOURCE_NOTE_EN = (
    "The CTS602 cannot use an external temperature sensor over Modbus. "
    "T15 is the user panel and T10 is the sensor on the control board. "
    "On this unit both are in the loft next to the ventilator, so neither "
    "is the living-room temperature. A Home Assistant entity is used for "
    "display and later Home Assistant logic only."
)
ROOM_SOURCE_NOTE_DA = (
    "CTS602 kan ikke bruge en ekstern temperaturføler over Modbus. "
    "T15 er betjeningspanelet, og T10 sidder på styrekortet. "
    "På dette anlæg sidder begge på loftet ved aggregatet, så ingen af dem "
    "er stuetemperaturen. En Home Assistant-entitet bruges kun til visning "
    "og senere logik i Home Assistant."
)


def _flag(value: Any) -> bool:
    """True only for real boolean true values coming from JSON or the UI."""

    return value is True or value == 1 or value == "true" or value == "on"


def _entity_id(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = " ".join(value.split())
    if not cleaned or len(cleaned) > 255:
        return None
    return cleaned


def normalize_plant(raw: Mapping[str, Any] | None) -> dict[str, Any]:
    """Return a forward-compatible plant description."""

    source = raw if isinstance(raw, Mapping) else {}
    reheater = source.get("reheater", REHEATER_NONE)
    if reheater not in REHEATERS:
        reheater = REHEATER_NONE
    room_source = source.get("room_source", ROOM_ENTITY)
    if room_source not in ROOM_SOURCES:
        room_source = ROOM_ENTITY
    return {
        "version": PLANT_VERSION,
        "preheater": _flag(source.get("preheater")),
        "reheater": reheater,
        "co2": _flag(source.get("co2")),
        "t10": _flag(source.get("t10")),
        "room_source": room_source,
        "room_entity": _entity_id(source.get("room_entity")),
    }


def default_plant() -> dict[str, Any]:
    """Plant used until the owner answers the wizard."""

    return normalize_plant({})

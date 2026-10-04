# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Allowlist for CTS602 writes.

Version 0.5.0 writes function code 16. Function code 06 is not used.
Forbidden addresses stay forbidden even when writes are enabled, so a caller
cannot factory-reset the controller or drive the fan relays.
"""

from __future__ import annotations

# Relay and analog outputs. Fan speeds are read from 200/201, never written.
_OUTPUT_ADDRESSES = frozenset(range(100, 206))

# Bus address, model type, service mode, service capacity, factory preset,
# virtual keypress. Holding 1007 = 1 is a factory reset.
NEVER_WRITE_ADDRESSES = _OUTPUT_ADDRESSES | frozenset({0, 1000, 1005, 1006, 1007, 2000})

WEEK_PROGRAM_ADDRESS = 500
WEEK_PROGRAM_ERASE = 4
MODE_SET_ADDRESS = 1002
MODE_SERVICE = 4
ALARM_RESET_ADDRESS = 400
CLOCK_ADDRESS = 300

WRITES_ENABLED = True
PROTOCOL_WRITES = 9


class WriteRejected(Exception):
    """A write must not reach the bus."""


class ForbiddenWrite(WriteRejected):
    """The address or value is permanently excluded."""


class WriteDisabled(WriteRejected):
    """Writes are switched off."""


class RangeError(WriteRejected):
    """The value is outside the allowlisted range or step."""


class DependencyError(WriteRejected):
    """The value breaks a relation the controller expects."""


class ReadbackMismatch(WriteRejected):
    """The controller stored a different word than the one requested."""

    def __init__(self, asked: list[int], stored: list[int]) -> None:
        self.asked = list(asked)
        self.stored = list(stored)
        super().__init__(f"Anlægget gemte {stored} (du bad om {asked})")


def _settings():
    from .settings import SETTINGS

    return SETTINGS


def _raw_accepted(spec, word: int) -> bool:
    from .settings import decode_raw

    if spec.kind == "button" and spec.key == "ctrl_reset_alarm":
        return 101 <= word <= 199
    if spec.kind == "button":
        return spec.fixed_raw == word
    if spec.kind == "select":
        return any(choice.raw == word for choice in spec.choices)
    if spec.minimum is None or spec.maximum is None or spec.step is None:
        return False
    decoded = decode_raw(spec, word)
    if not isinstance(decoded, (int, float)):
        return False
    if decoded < spec.minimum - 1e-6 or decoded > spec.maximum + 1e-6:
        return False
    steps = (float(decoded) - spec.minimum) / spec.step
    if abs(steps - round(steps)) > 0.02:
        return False
    return True


def assert_write_allowed(
    address: int,
    values: list[int],
    *,
    experimental_enabled: bool = False,
    protocol: int = PROTOCOL_WRITES,
) -> None:
    """Reject anything outside the protocol 9 allowlist."""

    if address < 0 or address > 0xFFFF:
        raise ForbiddenWrite(f"Address {address} is outside the Modbus range")
    if not values:
        raise ForbiddenWrite("Refusing an empty write")

    clock = address == CLOCK_ADDRESS and len(values) == 6
    if not clock and len(values) != 1:
        raise ForbiddenWrite("CTS602 writes must be FC16 with count 1")

    spanned = range(address, address + len(values))
    if any(item in NEVER_WRITE_ADDRESSES for item in spanned):
        raise ForbiddenWrite(f"Address {address} is never written")

    if not WRITES_ENABLED:
        raise WriteDisabled("Modbus writes are disabled")
    if int(protocol) != PROTOCOL_WRITES:
        raise WriteRejected("Skrivning er kun tilladt på Modbus-protokol 9")

    if clock:
        second, minute, hour, day, month, year = [int(item) & 0xFFFF for item in values]
        if not (0 <= second <= 59 and 0 <= minute <= 59 and 0 <= hour <= 23):
            raise RangeError("Klokkeslættet er ugyldigt")
        if not (1 <= day <= 31 and 1 <= month <= 12 and 0 <= year <= 99):
            raise RangeError("Datoen er ugyldig")
        return

    value = int(values[0]) & 0xFFFF
    if address == WEEK_PROGRAM_ADDRESS and value == WEEK_PROGRAM_ERASE:
        raise ForbiddenWrite("Week program value 4 erases the program")
    if address == MODE_SET_ADDRESS and value == MODE_SERVICE:
        raise ForbiddenWrite("Operation mode 4 is service mode")
    if address == MODE_SET_ADDRESS and value == 0:
        raise ForbiddenWrite("Operation mode 0 is hidden")
    if address == ALARM_RESET_ADDRESS and 1 <= value <= 99:
        raise ForbiddenWrite("Alarm reset values 1..99 are reserved")

    matches = [item for item in _settings() if item.address == address or (clock and item.address == CLOCK_ADDRESS)]
    if not matches:
        raise ForbiddenWrite(f"Address {address} is not on the write allowlist")
    if all(item.experimental for item in matches) and not experimental_enabled:
        raise WriteRejected("Eksperimentelle registre er slået fra")
    if not any(_raw_accepted(item, value) for item in matches):
        raise RangeError(f"Value {value} is outside the allowlist for address {address}")


def verify_readback(asked: list[int], stored: list[int]) -> None:
    """Raise when the controller did not keep the requested words."""

    asked_words = [int(item) & 0xFFFF for item in asked]
    stored_words = [int(item) & 0xFFFF for item in stored]
    if asked_words != stored_words:
        raise ReadbackMismatch(asked_words, stored_words)

"""Write policy for a later version.

Version 0.1.0 never writes. The checks below are the extension point for
0.2: flip WRITES_ENABLED, keep the forbidden list, and send one FC16 request
with count 1. Function code 06 is not used, because the CTS602 does not
implement it.

Even then, writes must be admin-only and confirmed in the card before this
function is called.
"""

from __future__ import annotations

# Relay and analog outputs. Fan speeds are read from 200/201, never written.
_OUTPUT_ADDRESSES = frozenset(range(100, 206))

# Bus address, model type, service mode, service capacity, factory preset,
# virtual keypress. Holding 1007 = 1 is a factory reset.
NEVER_WRITE_ADDRESSES = _OUTPUT_ADDRESSES | frozenset({0, 1000, 1005, 1006, 1007, 2000})

# Week program 4 erases the program. Mode 4 is service. Alarm reset 1..99
# is reserved by the controller.
WEEK_PROGRAM_ADDRESS = 500
WEEK_PROGRAM_ERASE = 4
MODE_SET_ADDRESS = 1002
MODE_SERVICE = 4
ALARM_RESET_ADDRESS = 400

WRITES_ENABLED = False


class WriteRejected(Exception):
    """A write must not reach the bus."""


class ForbiddenWrite(WriteRejected):
    """The address or value is permanently excluded."""


class WriteDisabled(WriteRejected):
    """Writes are switched off in this version."""


def assert_write_allowed(address: int, values: list[int]) -> None:
    """Reject every write in v0.1.0, and reject dangerous writes permanently.

    Forbidden addresses raise ForbiddenWrite even when writes are enabled,
    so a future caller cannot factory-reset the controller by mistake.
    """

    if address < 0 or address > 0xFFFF:
        raise ForbiddenWrite(f"Address {address} is outside the Modbus range")
    if not values:
        raise ForbiddenWrite("Refusing an empty write")
    if len(values) != 1:
        raise ForbiddenWrite("CTS602 writes must be FC16 with count 1")

    spanned = range(address, address + len(values))
    if any(item in NEVER_WRITE_ADDRESSES for item in spanned):
        raise ForbiddenWrite(f"Address {address} is never written")

    value = int(values[0]) & 0xFFFF
    if address == WEEK_PROGRAM_ADDRESS and value == WEEK_PROGRAM_ERASE:
        raise ForbiddenWrite("Week program value 4 erases the program")
    if address == MODE_SET_ADDRESS and value == MODE_SERVICE:
        raise ForbiddenWrite("Operation mode 4 is service mode")
    if address == ALARM_RESET_ADDRESS and 1 <= value <= 99:
        raise ForbiddenWrite("Alarm reset values 1..99 are reserved")

    if not WRITES_ENABLED:
        raise WriteDisabled("Modbus writes are disabled in version 0.1.0")

"""Modbus client for a CTS602 behind a shared RS485 gateway.

The Comfort on this installation shares the gateway with another controller.
Every request takes the gateway lock, waits a short inter-frame gap, and
retries with backoff. Function codes are only 03 (read holding), 04 (read
input) and, from a later version, 16 (write multiple, count 1). Function
code 06 is not implemented.

PyModbus' own retry counter is left at 0 so a timeout cannot turn into a
burst of frames.
"""

from __future__ import annotations

import asyncio
from time import monotonic
from typing import Any

from pymodbus import FramerType
from pymodbus.client import AsyncModbusSerialClient, AsyncModbusTcpClient
from pymodbus.exceptions import ModbusException

from .const import (
    CONNECTION_RTU_TCP,
    CONNECTION_SERIAL,
    DEFAULT_RECONNECT_DELAY,
    DEFAULT_RECONNECT_DELAY_MAX,
    DEFAULT_REQUEST_DELAY,
    DEFAULT_RETRIES,
    DEFAULT_RETRY_BACKOFF,
    DEFAULT_TIMEOUT,
    SERIAL_BAUDRATE,
    SERIAL_BYTESIZE,
    SERIAL_PARITY,
    SERIAL_STOPBITS,
)
from .writes import assert_write_allowed

class _Gateway:
    """Lock and inter-frame clock shared by every client on one bus."""

    def __init__(self) -> None:
        self.lock = asyncio.Lock()
        self.last_finished = 0.0


_GATEWAYS: dict[str, _Gateway] = {}


def gateway_for(key: str) -> _Gateway:
    """One gate per TCP endpoint or serial port."""

    gate = _GATEWAYS.get(key)
    if gate is None:
        gate = _Gateway()
        _GATEWAYS[key] = gate
    return gate


class NilanModbusError(Exception):
    """Base error for CTS602 communication."""


class NilanConnectionError(NilanModbusError):
    """The gateway or serial port could not be opened."""


class NilanReadError(NilanModbusError):
    """A read failed after the configured retries."""


class NilanWriteError(NilanModbusError):
    """A write was refused or the controller rejected it."""


class NilanModbusClient:
    """Serialized FC03/FC04 client. FC16 exists but is refused in v0.1.0."""

    def __init__(
        self,
        *,
        connection: str,
        device_id: int,
        host: str = "",
        port: int = 502,
        serial_port: str = "",
        timeout: float = DEFAULT_TIMEOUT,
        retries: int = DEFAULT_RETRIES,
        retry_backoff: float = DEFAULT_RETRY_BACKOFF,
        request_delay: float = DEFAULT_REQUEST_DELAY,
        transport: Any | None = None,
    ) -> None:
        """Create the client without opening the socket."""

        if not 1 <= int(device_id) <= 247:
            raise ValueError("device_id must be between 1 and 247")
        if request_delay < 0:
            raise ValueError("request_delay cannot be negative")
        if retries < 1:
            raise ValueError("retries must be at least 1")

        self.connection = connection
        self.device_id = int(device_id)
        self.host = host
        self.port = int(port)
        self.serial_port = serial_port
        self.request_delay = float(request_delay)
        self.retries = int(retries)
        self.retry_backoff = float(retry_backoff)
        self._timeout = float(timeout)
        self._transport = transport
        if connection == CONNECTION_SERIAL:
            gateway_key = f"serial:{serial_port}"
        else:
            gateway_key = f"tcp:{host.strip().lower()}:{int(port)}"
        self._gateway = gateway_for(gateway_key)

    def _build_transport(self) -> Any:
        name = f"Nilan CTS602 {self.device_id}"
        if self.connection == CONNECTION_SERIAL:
            return AsyncModbusSerialClient(
                self.serial_port,
                baudrate=SERIAL_BAUDRATE,
                bytesize=SERIAL_BYTESIZE,
                parity=SERIAL_PARITY,
                stopbits=SERIAL_STOPBITS,
                timeout=self._timeout,
                retries=0,
                framer=FramerType.RTU,
                name=name,
            )
        framer = FramerType.RTU if self.connection == CONNECTION_RTU_TCP else FramerType.SOCKET
        return AsyncModbusTcpClient(
            self.host,
            port=self.port,
            framer=framer,
            timeout=self._timeout,
            retries=0,
            reconnect_delay=DEFAULT_RECONNECT_DELAY,
            reconnect_delay_max=DEFAULT_RECONNECT_DELAY_MAX,
            name=name,
        )

    @property
    def transport(self) -> Any:
        if self._transport is None:
            self._transport = self._build_transport()
        return self._transport

    async def async_connect(self) -> None:
        """Open the connection if it is not already open."""

        if getattr(self.transport, "connected", False):
            return
        try:
            connected = await self.transport.connect()
        except (ModbusException, OSError, asyncio.TimeoutError) as err:
            raise NilanConnectionError("Could not connect to the CTS602 gateway") from err
        if not connected:
            raise NilanConnectionError("Could not connect to the CTS602 gateway")

    async def async_close(self) -> None:
        """Close the connection. PyModbus close() is synchronous."""

        close = getattr(self.transport, "close", None)
        if close is not None:
            close()

    async def _pause(self) -> None:
        last = self._gateway.last_finished
        if last <= 0:
            return
        remaining = self.request_delay - (monotonic() - last)
        if remaining > 0:
            await asyncio.sleep(remaining)

    def _mark_finished(self) -> None:
        self._gateway.last_finished = monotonic()

    async def _read_once(self, table: str, address: int, count: int) -> list[int]:
        await self.async_connect()
        method = (
            self.transport.read_input_registers
            if table == "input"
            else self.transport.read_holding_registers
        )
        response = await method(address, count=count, device_id=self.device_id)
        if response.isError():
            raise NilanReadError(
                f"{table} {address}..{address + count - 1} returned {response!s}"
            )
        registers = getattr(response, "registers", None)
        if not isinstance(registers, list) or len(registers) != count:
            received = 0 if not isinstance(registers, list) else len(registers)
            raise NilanReadError(
                f"Expected {count} registers from {table} {address}, received {received}"
            )
        return [int(value) & 0xFFFF for value in registers]

    async def async_read(self, table: str, address: int, count: int) -> list[int]:
        """Read a contiguous input (FC04) or holding (FC03) block."""

        if table not in ("input", "holding"):
            raise ValueError("table must be input or holding")
        if not 0 <= address <= 0xFFFF:
            raise ValueError("address must be between 0 and 65535")
        if not 1 <= count <= 125:
            raise ValueError("count must be between 1 and 125")
        if address + count - 1 > 0xFFFF:
            raise ValueError("register block exceeds address 65535")

        async with self._gateway.lock:
            last_error: Exception | None = None
            for attempt in range(self.retries):
                await self._pause()
                try:
                    values = await self._read_once(table, address, count)
                except (NilanModbusError, ModbusException, OSError, asyncio.TimeoutError) as err:
                    last_error = err
                    self._mark_finished()
                    close = getattr(self.transport, "close", None)
                    if close is not None:
                        close()
                    if attempt + 1 >= self.retries:
                        break
                    await asyncio.sleep(min(2.0, self.retry_backoff * (2**attempt)))
                    continue
                self._mark_finished()
                return values
        if isinstance(last_error, NilanConnectionError):
            raise last_error
        raise NilanReadError(
            f"Read failed for {table} {address}..{address + count - 1} "
            f"on slave {self.device_id}"
        ) from last_error

    async def async_write_holding_register(self, address: int, value: int) -> None:
        """FC16 with count 1. Refused entirely in version 0.1.0.

        The policy check runs before the gateway lock, so a refused write
        never occupies the shared bus.
        """

        assert_write_allowed(address, [int(value) & 0xFFFF])
        async with self._gateway.lock:
            await self._pause()
            try:
                await self.async_connect()
                response = await self.transport.write_registers(
                    address,
                    [int(value) & 0xFFFF],
                    device_id=self.device_id,
                )
            except (ModbusException, OSError, asyncio.TimeoutError) as err:
                raise NilanWriteError(f"Write failed for holding {address}") from err
            finally:
                self._mark_finished()
            if response.isError():
                raise NilanWriteError(f"Controller rejected the write to {address}")

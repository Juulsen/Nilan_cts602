"""Serialized reads, retries and the disabled write path."""

from __future__ import annotations

import asyncio
import sys
import types
import unittest
from pathlib import Path

COMPONENT = Path(__file__).resolve().parents[1] / "custom_components" / "nilan_cts602"
pkg = types.ModuleType("nilan_cts602")
pkg.__path__ = [str(COMPONENT)]
pkg.__package__ = "nilan_cts602"
sys.modules.setdefault("nilan_cts602", pkg)

ha = types.ModuleType("homeassistant")
const = types.ModuleType("homeassistant.const")


class _Platform:
    SENSOR = "sensor"
    BINARY_SENSOR = "binary_sensor"


const.Platform = _Platform
ha.const = const
sys.modules.setdefault("homeassistant", ha)
sys.modules.setdefault("homeassistant.const", const)

from nilan_cts602.modbus_client import NilanModbusClient, NilanReadError
from nilan_cts602.writes import WriteDisabled


class _Response:
    def __init__(self, registers=None, error=False):
        self.registers = registers
        self._error = error

    def isError(self):
        return self._error


class FakeTransport:
    def __init__(self, failures=0):
        self.failures = failures
        self.connected = False
        self.reads = 0
        self.writes = 0

    async def connect(self):
        self.connected = True
        return True

    def close(self):
        self.connected = False

    async def read_input_registers(self, address, count, device_id):
        del address, device_id
        self.reads += 1
        if self.reads <= self.failures:
            raise TimeoutError("gateway busy")
        return _Response([13] * count)

    async def read_holding_registers(self, address, count, device_id):
        return await self.read_input_registers(address, count, device_id)

    async def write_registers(self, address, values, device_id):
        del address, values, device_id
        self.writes += 1
        return _Response([0])


class ModbusClientTests(unittest.TestCase):
    def test_retry_then_success_and_no_function_code_06(self):
        source = (PathClient()).read_text(encoding="utf-8")
        self.assertNotIn(".write_register(", source)
        self.assertIn("write_registers", source)
        transport = FakeTransport(failures=1)
        client = NilanModbusClient(
            connection="modbus_tcp",
            host="10.0.0.30",
            port=502,
            device_id=10,
            request_delay=0,
            retries=3,
            retry_backoff=0,
            transport=transport,
        )
        values = asyncio.run(client.async_read("input", 0, 1))
        self.assertEqual(values, [13])
        self.assertEqual(transport.reads, 2)
        self.assertEqual(transport.writes, 0)

    def test_shared_gateway_gap(self):
        first = FakeTransport()
        second = FakeTransport()
        left = NilanModbusClient(
            connection="modbus_tcp", host="10.0.0.30", port=502, device_id=10,
            request_delay=0.05, retries=1, transport=first,
        )
        right = NilanModbusClient(
            connection="modbus_tcp", host="10.0.0.30", port=502, device_id=5,
            request_delay=0.05, retries=1, transport=second,
        )

        async def both():
            started = asyncio.get_running_loop().time()
            await left.async_read("holding", 1001, 1)
            await right.async_read("holding", 1001, 1)
            return asyncio.get_running_loop().time() - started

        elapsed = asyncio.run(both())
        self.assertGreaterEqual(elapsed, 0.05)
        self.assertIs(left._gateway, right._gateway)

    def test_write_never_reaches_the_transport(self):
        transport = FakeTransport()
        client = NilanModbusClient(
            connection="rtu_over_tcp", host="10.0.0.30", port=502, device_id=10,
            request_delay=0, transport=transport,
        )
        with self.assertRaises(WriteDisabled):
            asyncio.run(client.async_write_holding_register(1004, 2200))
        self.assertEqual(transport.writes, 0)

    def test_exhausted_retries_raise(self):
        transport = FakeTransport(failures=5)
        client = NilanModbusClient(
            connection="modbus_tcp", host="10.0.0.30", port=502, device_id=10,
            request_delay=0, retries=2, retry_backoff=0, transport=transport,
        )
        with self.assertRaises(NilanReadError):
            asyncio.run(client.async_read("input", 200, 2))
        self.assertEqual(transport.reads, 2)


def PathClient():
    return COMPONENT / "modbus_client.py"


if __name__ == "__main__":
    unittest.main()

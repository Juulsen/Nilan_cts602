# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Read model, protocol and software before a config entry is created."""

from __future__ import annotations

from .const import MODEL_NAME_COMFORT, MODEL_TYPE_COMFORT
from .decode import decode_software, scale_temperature, temperature_plausible
from .modbus_client import NilanModbusClient, NilanModbusError, NilanReadError


class UnsupportedModel(Exception):
    """The device answered, but it is not a Comfort (type 13)."""

    def __init__(self, model_type: int) -> None:
        self.model_type = int(model_type)
        super().__init__(f"Unsupported CTS602 model type {model_type}")


async def read_identity(client: NilanModbusClient) -> dict:
    """Read holding 1000 and input 0..3, then probe the optional temperatures.

    Model type is only read. It is never written.
    """

    model_words = await client.async_read("holding", 1000, 1)
    version_words = await client.async_read("input", 0, 4)
    model_type = int(model_words[0])
    protocol = int(version_words[0])
    if model_type in (0, 0xFFFF) or not 1 <= protocol <= 64:
        raise NilanReadError(
            "The device did not return a CTS602 model type and protocol version"
        )
    if model_type != MODEL_TYPE_COMFORT:
        raise UnsupportedModel(model_type)

    software = decode_software(version_words[1:4])
    probes = {"t2": False, "t9": False, "t10": False, "t15": False}
    try:
        temps = await client.async_read("input", 200, 17)
    except NilanModbusError:
        temps = []
    if len(temps) == 17:
        decoded = {
            "t2": scale_temperature(temps[2]),
            "t9": scale_temperature(temps[9]),
            "t10": scale_temperature(temps[10]),
            "t15": scale_temperature(temps[15]),
        }
        probes = {key: temperature_plausible(value) for key, value in decoded.items()}

    return {
        "model_type": model_type,
        "model_name": MODEL_NAME_COMFORT,
        "protocol_version": protocol,
        "sw_version": software,
        "probes": probes,
    }

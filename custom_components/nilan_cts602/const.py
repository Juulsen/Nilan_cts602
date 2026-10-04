# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Constants for the Nilan CTS602 integration."""

from __future__ import annotations

from datetime import timedelta
from typing import Final

from homeassistant.const import Platform

DOMAIN: Final = "nilan_cts602"
NAME: Final = "Nilan CTS602"
VERSION: Final = "0.5.1"
MANUFACTURER: Final = "Nilan"
MODEL: Final = "Comfort 300 LR"
INTEGRATION_AUTHOR: Final = "Juulsen"

# Comfort 300 LR reports this value in holding register 1000 (Control.Type).
MODEL_TYPE_COMFORT: Final = 13
MODEL_NAME_COMFORT: Final = "COMFORT"

PLATFORMS: Final = (
    Platform.SENSOR,
    Platform.BINARY_SENSOR,
    Platform.NUMBER,
    Platform.SELECT,
    Platform.BUTTON,
)

CONF_DEVICE_ID: Final = "device_id"
CONF_CONNECTION: Final = "connection"
CONF_SERIAL_PORT: Final = "serial_port"
CONF_SCAN_INTERVAL: Final = "scan_interval"
CONF_REQUEST_DELAY: Final = "request_delay"
CONF_PLANT: Final = "plant"
CONF_PROTOCOL: Final = "protocol_version"
CONF_MODEL_TYPE: Final = "model_type"
CONF_SW_VERSION: Final = "sw_version"
CONF_PROBES: Final = "probes"

CONNECTION_TCP: Final = "modbus_tcp"
CONNECTION_RTU_TCP: Final = "rtu_over_tcp"
CONNECTION_SERIAL: Final = "serial"
CONNECTIONS: Final = (
    CONNECTION_TCP,
    CONNECTION_RTU_TCP,
    CONNECTION_SERIAL,
)

# The Comfort shares an RS485 gateway with other controllers. Modbus TCP
# matches the gateway the ECL110 integration already uses. Transparent
# RTU-over-TCP gateways and a direct 19200 8E1 serial port are also supported.
DEFAULT_CONNECTION: Final = CONNECTION_TCP
DEFAULT_PORT: Final = 502
DEFAULT_DEVICE_ID: Final = 10
DEFAULT_SERIAL_PORT: Final = "/dev/ttyUSB0"
DEFAULT_SCAN_INTERVAL: Final = timedelta(seconds=30)
MIN_SCAN_INTERVAL: Final = 10
DEFAULT_TIMEOUT: Final = 5.0
DEFAULT_RETRIES: Final = 3
DEFAULT_RETRY_BACKOFF: Final = 0.3

# Pause after every frame so a shared 19200 baud gateway is not flooded.
DEFAULT_REQUEST_DELAY: Final = 0.15
MIN_REQUEST_DELAY: Final = 0.05
DEFAULT_RECONNECT_DELAY: Final = 1.0
DEFAULT_RECONNECT_DELAY_MAX: Final = 30.0

# Documented CTS602 link settings. They are fixed on the controller.
SERIAL_BAUDRATE: Final = 19200
SERIAL_BYTESIZE: Final = 8
SERIAL_PARITY: Final = "E"
SERIAL_STOPBITS: Final = 1

# Adjacent documented addresses only. Holes can raise illegal-data-address.
MAX_READ_BLOCK_SIZE: Final = 32

# Exhaust-side efficiency is hidden when the extract/outdoor span is smaller
# than this. Below 3 K the ratio is mostly sensor noise.
EFFICIENCY_MIN_DELTA_C: Final = 3.0

# Unconnected NTC inputs typically fall outside this window.
TEMP_PLAUSIBLE_MIN: Final = -35.0
TEMP_PLAUSIBLE_MAX: Final = 90.0

# Static frontend is served at /<domain>-static/<file>?v=<version>.
STATIC_PATH: Final = f"/{DOMAIN}-static"
CARD_FILENAME: Final = "nilan-card.js"

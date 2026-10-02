"""Polling coordinator.

Fast blocks (temperatures, fans, alarms, bypass) run every cycle. Settings,
the panel text and the clock run on the first cycle and then every third
cycle, so the shared gateway is not polled harder than it needs to be.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .catalog import read_blocks
from .const import CONF_PLANT, CONF_PROTOCOL, CONF_SW_VERSION, DEFAULT_SCAN_INTERVAL, DOMAIN
from .decode import BypassState, build_snapshot, next_bypass
from .modbus_client import NilanModbusClient, NilanModbusError
from .plant import normalize_plant

_LOGGER = logging.getLogger(__name__)


class NilanDataUpdateCoordinator(DataUpdateCoordinator[dict]):
    """One Comfort, one Modbus client, one poll at a time."""

    def __init__(
        self,
        hass: HomeAssistant,
        *,
        entry,
        client: NilanModbusClient,
        update_interval: timedelta = DEFAULT_SCAN_INTERVAL,
    ) -> None:
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN}_{entry.entry_id}",
            update_interval=update_interval,
            always_update=True,
        )
        self.client = client
        self.entry = entry
        self._inputs: dict[int, int] = {}
        self._holdings: dict[int, int] = {}
        self._bypass = BypassState()
        self._cycle = 0

    async def _async_setup(self) -> None:
        try:
            await self.client.async_connect()
        except NilanModbusError as err:
            raise UpdateFailed(str(err)) from err

    @property
    def protocol(self) -> int:
        raw = self._inputs.get(0, self.entry.data.get(CONF_PROTOCOL, 0))
        return int(raw or 0)

    def _plant(self) -> dict:
        stored = self.entry.options.get(CONF_PLANT)
        return normalize_plant(stored if isinstance(stored, dict) else None)

    async def _async_update_data(self) -> dict:
        self._cycle += 1
        include_slow = self._cycle == 1 or self._cycle % 3 == 0
        fresh_input: set[int] = set()
        fresh_holding: set[int] = set()
        failures = 0
        successes = 0
        for block in read_blocks(self.protocol, include_slow=include_slow):
            try:
                values = await self.client.async_read(block.table, block.address, block.count)
            except NilanModbusError as err:
                failures += 1
                _LOGGER.debug(
                    "Skipped %s %s..%s on slave %s: %s",
                    block.table,
                    block.address,
                    block.end,
                    self.client.device_id,
                    err,
                )
                continue
            successes += 1
            target = self._inputs if block.table == "input" else self._holdings
            fresh = fresh_input if block.table == "input" else fresh_holding
            for offset, value in enumerate(values):
                address = block.address + offset
                target[address] = value
                fresh.add(address)

        if successes == 0:
            raise UpdateFailed(
                f"No reply from CTS602 slave {self.client.device_id} "
                f"({failures} requests failed)"
            )

        protocol = self.protocol
        if 102 in fresh_holding and 103 in fresh_holding:
            use_position = protocol >= 11 and 3000 in fresh_input
            self._bypass = next_bypass(
                self._bypass,
                open_relay=bool(self._holdings.get(102)),
                close_relay=bool(self._holdings.get(103)),
                position_register=self._inputs.get(3000) if use_position else None,
                use_position_register=use_position,
            )

        snapshot = build_snapshot(
            inputs=self._inputs,
            holdings=self._holdings,
            protocol=protocol,
            bypass_position=self._bypass.position,
            plant=self._plant(),
        )
        if not snapshot.get("sw_version"):
            snapshot["sw_version"] = self.entry.data.get(CONF_SW_VERSION)
        return snapshot

    async def async_shutdown(self) -> None:
        await super().async_shutdown()
        await self.client.async_close()

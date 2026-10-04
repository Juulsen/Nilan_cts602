# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Config-entry migration runs from the component module.

The test job does not install homeassistant. The stubs below are only enough
to import the component and call async_migrate_entry.
"""

from __future__ import annotations

import asyncio
import importlib.util
import sys
import types
import unittest
from pathlib import Path

COMPONENT = Path(__file__).resolve().parents[1] / "custom_components" / "nilan_cts602"
ROOT = COMPONENT.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _module(name: str) -> types.ModuleType:
    module = sys.modules.get(name)
    if module is None:
        module = types.ModuleType(name)
        sys.modules[name] = module
    return module


def _identity(fn):
    return fn


def _passthrough(*args, **kwargs):
    if len(args) == 1 and callable(args[0]) and not kwargs:
        return args[0]

    def _wrap(fn):
        return fn

    return _wrap


ha = _module("homeassistant")
const = _module("homeassistant.const")
ha.const = const
const.CONF_HOST = "host"
const.CONF_PORT = "port"
const.CONF_TIMEOUT = "timeout"
const.EVENT_HOMEASSISTANT_STARTED = "homeassistant_started"
if not hasattr(const, "Platform"):

    class _Platform:
        SENSOR = "sensor"
        BINARY_SENSOR = "binary_sensor"
        NUMBER = "number"
        SELECT = "select"
        BUTTON = "button"

    const.Platform = _Platform

components = _module("homeassistant.components")
components.__path__ = []
ha.components = components
websocket_api = _module("homeassistant.components.websocket_api")
components.websocket_api = websocket_api
websocket_api.websocket_command = _passthrough
websocket_api.async_response = _identity
websocket_api.require_admin = _identity
websocket_api.async_register_command = lambda *args, **kwargs: None

http = _module("homeassistant.components.http")
components.http = http
http.StaticPathConfig = lambda *args, **kwargs: None

config_entries = _module("homeassistant.config_entries")
ha.config_entries = config_entries
if not hasattr(config_entries, "ConfigEntry"):

    class ConfigEntry:
        """Placeholder so the component can import ConfigEntry."""

    config_entries.ConfigEntry = ConfigEntry

core = _module("homeassistant.core")
ha.core = core
if not hasattr(core, "HomeAssistant"):

    class HomeAssistant:
        """Placeholder so the component can import HomeAssistant."""

    core.HomeAssistant = HomeAssistant

exceptions = _module("homeassistant.exceptions")
ha.exceptions = exceptions
if not hasattr(exceptions, "ConfigEntryNotReady"):

    class ConfigEntryNotReady(Exception):
        """Placeholder."""

    exceptions.ConfigEntryNotReady = ConfigEntryNotReady
if not hasattr(exceptions, "HomeAssistantError"):

    class HomeAssistantError(Exception):
        """Placeholder."""

    exceptions.HomeAssistantError = HomeAssistantError

helpers = _module("homeassistant.helpers")
helpers.__path__ = []
ha.helpers = helpers
cv = _module("homeassistant.helpers.config_validation")
helpers.config_validation = cv
cv.config_entry_only_config_schema = lambda domain: object()
er = _module("homeassistant.helpers.entity_registry")
helpers.entity_registry = er
er.async_get = lambda hass: None
update_coordinator = _module("homeassistant.helpers.update_coordinator")
helpers.update_coordinator = update_coordinator
if not hasattr(update_coordinator, "DataUpdateCoordinator"):

    class DataUpdateCoordinator:
        def __class_getitem__(cls, item):
            return cls

        def __init__(
            self,
            hass,
            logger,
            *,
            config_entry,
            name,
            update_interval,
            always_update=True,
        ) -> None:
            del logger, name, update_interval, always_update
            self.hass = hass
            self.config_entry = config_entry

    update_coordinator.DataUpdateCoordinator = DataUpdateCoordinator
if not hasattr(update_coordinator, "UpdateFailed"):

    class UpdateFailed(Exception):
        """Placeholder."""

    update_coordinator.UpdateFailed = UpdateFailed

def _load_component():
    """Execute __init__.py even when an earlier test registered a path-only package."""

    existing = sys.modules.get("nilan_cts602")
    if existing is not None and hasattr(existing, "async_migrate_entry"):
        return existing
    spec = importlib.util.spec_from_file_location(
        "nilan_cts602",
        COMPONENT / "__init__.py",
        submodule_search_locations=[str(COMPONENT)],
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules["nilan_cts602"] = module
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


async_migrate_entry = _load_component().async_migrate_entry
from nilan_cts602.const import CONF_PLANT
from nilan_cts602.plant import PLANT_VERSION

LIVE_PLANT = {
    "co2": False,
    "preheater": False,
    "reheater": "none",
    "room_entity": "sensor.temperatur_kokken_stue",
    "room_source": "entity",
    "t10": False,
    "version": 1,
}


class _Entry:
    def __init__(self, *, version: int, minor_version: int, options: dict) -> None:
        self.version = version
        self.minor_version = minor_version
        self.options = options


class _ConfigEntries:
    def __init__(self) -> None:
        self.updates: list[dict] = []

    def async_update_entry(self, entry, *, minor_version, options) -> None:
        entry.minor_version = minor_version
        entry.options = options
        self.updates.append({"minor_version": minor_version, "options": options})


class _Hass:
    def __init__(self) -> None:
        self.config_entries = _ConfigEntries()


class MigrateEntryTests(unittest.TestCase):
    def test_version_one_entry_is_stored_as_minor_two(self) -> None:
        hass = _Hass()
        entry = _Entry(
            version=1,
            minor_version=1,
            options={CONF_PLANT: dict(LIVE_PLANT), "scan_interval": 30},
        )

        migrated = asyncio.run(async_migrate_entry(hass, entry))

        self.assertTrue(migrated)
        self.assertEqual(entry.version, 1)
        self.assertEqual(entry.minor_version, 2)
        plant = entry.options[CONF_PLANT]
        self.assertEqual(plant["version"], 2)
        self.assertEqual(plant["version"], PLANT_VERSION)
        self.assertFalse(plant["reheater_electric"])
        self.assertFalse(plant["reheater_water"])
        self.assertFalse(plant["options_board"])
        self.assertFalse(plant["experimental"])
        self.assertEqual(plant["room_entity"], "sensor.temperatur_kokken_stue")
        self.assertEqual(plant["room_source"], "entity")
        self.assertEqual(plant["reheater"], "none")
        self.assertEqual(entry.options["scan_interval"], 30)
        self.assertEqual(len(hass.config_entries.updates), 1)

    def test_current_minor_version_is_left_unchanged(self) -> None:
        hass = _Hass()
        stored = dict(LIVE_PLANT)
        entry = _Entry(version=1, minor_version=2, options={CONF_PLANT: stored})

        migrated = asyncio.run(async_migrate_entry(hass, entry))

        self.assertTrue(migrated)
        self.assertEqual(entry.minor_version, 2)
        self.assertEqual(entry.options[CONF_PLANT], stored)
        self.assertEqual(hass.config_entries.updates, [])

    def test_flow_class_does_not_own_the_migrator(self) -> None:
        source = (COMPONENT / "config_flow.py").read_text(encoding="utf-8")
        self.assertNotIn("async def async_migrate_entry", source)
        self.assertIn("MINOR_VERSION = 2", source)


if __name__ == "__main__":
    unittest.main()

# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Options flow without a Home Assistant install.

The test job does not install homeassistant. The stubs below are only enough
to construct the equipment and room steps and read their voluptuous defaults.
"""

from __future__ import annotations

import sys
import types
import unittest
from pathlib import Path

import voluptuous as vol

COMPONENT = Path(__file__).resolve().parents[1] / "custom_components" / "nilan_cts602"
pkg = sys.modules.get("nilan_cts602")
if pkg is None:
    pkg = types.ModuleType("nilan_cts602")
    pkg.__path__ = [str(COMPONENT)]
    pkg.__package__ = "nilan_cts602"
    sys.modules["nilan_cts602"] = pkg

ha = sys.modules.setdefault("homeassistant", types.ModuleType("homeassistant"))
const = sys.modules.setdefault("homeassistant.const", types.ModuleType("homeassistant.const"))
ha.const = const
const.CONF_HOST = "host"
const.CONF_PORT = "port"
const.CONF_TIMEOUT = "timeout"
if not hasattr(const, "Platform"):

    class _Platform:
        SENSOR = "sensor"
        BINARY_SENSOR = "binary_sensor"
        NUMBER = "number"
        SELECT = "select"
        BUTTON = "button"

    const.Platform = _Platform

config_entries = sys.modules.setdefault(
    "homeassistant.config_entries",
    types.ModuleType("homeassistant.config_entries"),
)
ha.config_entries = config_entries


class _ConfigFlow:
    def __init_subclass__(cls, domain=None, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.domain = domain


class _OptionsFlow:
    def async_show_form(self, *, step_id, data_schema, description_placeholders=None, errors=None):
        return {
            "type": "form",
            "step_id": step_id,
            "data_schema": data_schema,
            "description_placeholders": description_placeholders,
            "errors": errors,
        }

    def async_create_entry(self, *, title="", data):
        return {"type": "create_entry", "title": title, "data": data}


config_entries.ConfigFlow = _ConfigFlow
config_entries.OptionsFlow = _OptionsFlow
config_entries.ConfigFlowResult = dict

helpers = sys.modules.setdefault("homeassistant.helpers", types.ModuleType("homeassistant.helpers"))
helpers.__path__ = []
selector = sys.modules.setdefault(
    "homeassistant.helpers.selector",
    types.ModuleType("homeassistant.helpers.selector"),
)
ha.helpers = helpers
helpers.selector = selector


class _Selector:
    def __init__(self, config=None):
        self.config = config

    def __call__(self, value):
        return value


class _Mode:
    DROPDOWN = "dropdown"
    BOX = "box"


selector.SelectSelector = _Selector
selector.SelectSelectorConfig = dict
selector.SelectSelectorMode = _Mode
selector.NumberSelector = _Selector
selector.NumberSelectorConfig = dict
selector.NumberSelectorMode = _Mode
selector.EntitySelector = _Selector
selector.EntitySelectorConfig = dict

from nilan_cts602.config_flow import NilanOptionsFlow
from nilan_cts602.const import CONF_PLANT


def _defaults(schema: vol.Schema) -> dict:
    found = {}
    for marker in schema.schema:
        default = getattr(marker, "default", vol.UNDEFINED)
        if not callable(default):
            continue
        found[marker.schema] = default()
    return found


class _Entry:
    def __init__(self, plant: dict):
        self.data = {"sw_version": "2.35.a", "protocol_version": 9, "model_type": 13}
        self.options = {CONF_PLANT: plant}


class OptionsFlowTests(unittest.IsolatedAsyncioTestCase):
    def _flow(self, plant: dict) -> NilanOptionsFlow:
        flow = NilanOptionsFlow()
        flow.config_entry = _Entry(plant)
        return flow

    async def test_equipment_step_keeps_cleared_flags(self):
        stored = {
            "preheater": True,
            "reheater": "electric",
            "co2": True,
            "t10": True,
            "room_source": "t15",
            "room_entity": "sensor.loft",
        }
        flow = self._flow(stored)
        opened = await flow.async_step_init()
        self.assertEqual(opened["step_id"], "equipment")
        self.assertTrue(_defaults(opened["data_schema"])["preheater"])
        self.assertTrue(_defaults(opened["data_schema"])["t10"])

        equipment = {"preheater": False, "reheater": "none", "co2": False, "t10": False, "room_source": "entity"}
        room = await flow.async_step_equipment(equipment)
        self.assertEqual(room["step_id"], "room")
        self.assertEqual(_defaults(room["data_schema"])["room_source"], "entity")
        self.assertEqual(_defaults(room["data_schema"])["room_entity"], "sensor.loft")

        created = await flow.async_step_room({"room_source": "entity", "room_entity": "sensor.stue"})
        self.assertEqual(created["type"], "create_entry")
        plant = created["data"][CONF_PLANT]
        self.assertFalse(plant["preheater"])
        self.assertFalse(plant["t10"])
        self.assertFalse(plant["co2"])
        self.assertEqual(plant["reheater"], "none")
        self.assertEqual(plant["room_source"], "entity")
        self.assertEqual(plant["room_entity"], "sensor.stue")

        again = self._flow(plant)
        form = await again.async_step_init(None)
        self.assertFalse(_defaults(form["data_schema"])["preheater"])
        self.assertFalse(_defaults(form["data_schema"])["t10"])

    async def test_init_forwards_a_submitted_equipment_step(self):
        flow = self._flow({"preheater": True, "t10": True, "room_source": "t15"})
        room = await flow.async_step_init({"preheater": False, "reheater": "none", "co2": False, "t10": False})
        self.assertEqual(room["step_id"], "room")
        self.assertEqual(_defaults(room["data_schema"])["room_source"], "t15")

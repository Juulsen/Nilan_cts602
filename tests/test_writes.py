# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Allowlist, ranges, read-back, options gating and plant migration."""

from __future__ import annotations

import sys
import types
import unittest
from pathlib import Path

COMPONENT = Path(__file__).resolve().parents[1] / "custom_components" / "nilan_cts602"
pkg = sys.modules.get("nilan_cts602")
if pkg is None:
    pkg = types.ModuleType("nilan_cts602")
    pkg.__path__ = [str(COMPONENT)]
    pkg.__package__ = "nilan_cts602"
    sys.modules["nilan_cts602"] = pkg

from nilan_cts602.plant import PLANT_VERSION, normalize_plant
from nilan_cts602.settings import (
    EXPERIMENTAL_KEYS,
    OWNER_POINT_KEYS,
    iter_settings,
    plan_write,
)
from nilan_cts602.writes import DependencyError, RangeError, ReadbackMismatch, WriteRejected, verify_readback


class WriteAllowlistTests(unittest.TestCase):
    def setUp(self):
        self.plant = normalize_plant({})
        self.holdings = {1203: 2500, 1204: 2400, 1921: 600, 1922: 800}

    def test_owner_points_and_experimental_gate(self):
        self.assertEqual(len(OWNER_POINT_KEYS), 24)
        self.assertGreaterEqual(len(EXPERIMENTAL_KEYS), 6)
        visible = {item.key for item in iter_settings(self.plant, protocol=9)}
        for key in ("ctrl_temperature", "ctrl_run", "ctrl_week", "ctrl_reset_all", "ctrl_sync_clock"):
            self.assertIn(key, visible)
        for key in ("ctrl_user1_temp", "ctrl_user1_start", "ctrl_cool_vent", "ctrl_cool_set", "ctrl_night_day", "ctrl_night_set"):
            self.assertNotIn(key, visible)
            self.assertIn(key, EXPERIMENTAL_KEYS)
        opened = {item.key for item in iter_settings(normalize_plant({"experimental": True}), protocol=9)}
        self.assertIn("ctrl_cool_set", opened)
        self.assertNotIn("ctrl_supply_max_summer", opened)
        self.assertNotIn("ctrl_co2_high", opened)
        self.assertNotIn("ctrl_user2_function", opened)

    def test_options_gating(self):
        fitted = normalize_plant({
            "reheater_electric": True,
            "options_board": True,
            "co2": True,
            "experimental": True,
        })
        keys = {item.key for item in iter_settings(fitted, protocol=9)}
        self.assertIn("ctrl_supply_max_summer", keys)
        self.assertIn("ctrl_supply_max_winter", keys)
        self.assertIn("ctrl_user2_function", keys)
        self.assertIn("ctrl_co2_low", keys)
        self.assertNotIn("ctrl_supply_max_summer", {item.key for item in iter_settings(normalize_plant({"reheater_water": True}), protocol=9)} - {item.key for item in iter_settings(normalize_plant({"reheater_water": True}), protocol=9)})
        water = {item.key for item in iter_settings(normalize_plant({"reheater": "water"}), protocol=9)}
        self.assertIn("ctrl_supply_max_winter", water)
        self.assertEqual(len(iter_settings(self.plant, protocol=8)), 0)

    def test_setpoint_step_and_ranges(self):
        spec, words = plan_write("ctrl_temperature", 21.5, plant=self.plant, protocol=9, holdings={})
        self.assertEqual(words, [2150])
        self.assertEqual(spec.address, 1004)
        with self.assertRaises(RangeError):
            plan_write("ctrl_temperature", 21.3, plant=self.plant, protocol=9, holdings={})
        with self.assertRaises(RangeError):
            plan_write("ctrl_temperature", 31, plant=self.plant, protocol=9, holdings={})
        with self.assertRaises(RangeError):
            plan_write("ctrl_user1_time", 10, plant=self.plant, protocol=9, holdings={})
        spec, words = plan_write("ctrl_user1_time", 0, plant=self.plant, protocol=9, holdings={})
        self.assertEqual(words, [0])
        with self.assertRaises(WriteRejected):
            plan_write("ctrl_cool_set", "off", plant=self.plant, protocol=9, holdings={})
        experimental = normalize_plant({"experimental": True})
        spec, words = plan_write("ctrl_cool_set", "plus_2", plant=experimental, protocol=9, holdings={})
        self.assertEqual(words, [3])

    def test_dependencies_and_readback(self):
        with self.assertRaises(DependencyError):
            plan_write("ctrl_supply_min_summer", 16, plant=self.plant, protocol=9, holdings={1203: 1500})
        with self.assertRaises(DependencyError):
            plan_write("ctrl_co2_low", 700, plant=normalize_plant({"co2": True}), protocol=9, holdings={1922: 700})
        verify_readback([2150], [2150])
        with self.assertRaises(ReadbackMismatch) as caught:
            verify_readback([2150], [2100])
        self.assertIn("2100", str(caught.exception))
        self.assertIn("2150", str(caught.exception))

    def test_alarm_and_forbidden_values(self):
        spec, words = plan_write("ctrl_reset_alarm", 19, plant=self.plant, protocol=9, holdings={})
        self.assertEqual((spec.address, words), (400, [119]))
        with self.assertRaises(RangeError):
            plan_write("ctrl_reset_alarm", 0, plant=self.plant, protocol=9, holdings={})
        with self.assertRaises(WriteRejected):
            plan_write("ctrl_week", "erase", plant=self.plant, protocol=9, holdings={})
        with self.assertRaises(WriteRejected):
            plan_write("not_a_setting", 1, plant=self.plant, protocol=9, holdings={})


class PlantMigrationTests(unittest.TestCase):
    def test_version_two_defaults_and_mutual_exclusion(self):
        fresh = normalize_plant({})
        self.assertEqual(fresh["version"], PLANT_VERSION)
        self.assertFalse(fresh["preheater"])
        self.assertFalse(fresh["options_board"])
        self.assertFalse(fresh["experimental"])
        self.assertEqual(fresh["reheater"], "none")
        migrated = normalize_plant({"version": 1, "reheater": "water", "preheater": True})
        self.assertEqual(migrated["version"], 2)
        self.assertTrue(migrated["reheater_water"])
        self.assertFalse(migrated["reheater_electric"])
        self.assertEqual(migrated["reheater"], "water")
        both = normalize_plant({"reheater_electric": True, "reheater_water": True})
        self.assertEqual(both["reheater"], "electric")
        self.assertFalse(both["reheater_water"])
        fitted = normalize_plant({"preheater": True, "reheater_water": True, "co2": True, "options_board": True})
        cleared = normalize_plant({**fitted, "preheater": False, "reheater_water": False, "co2": False, "options_board": False})
        self.assertFalse(cleared["preheater"])
        self.assertFalse(cleared["reheater_water"])
        self.assertFalse(cleared["reheater_electric"])
        self.assertEqual(cleared["reheater"], "none")
        self.assertFalse(cleared["co2"])
        self.assertFalse(cleared["options_board"])
        switched = normalize_plant({**fitted, "reheater_electric": True, "reheater_water": False})
        self.assertEqual(switched["reheater"], "electric")
        self.assertFalse(switched["reheater_water"])
        note = Path(COMPONENT, "plant.py").read_text(encoding="utf-8")
        self.assertIn("T0 er føleren på styrekortet", note)
        self.assertIn("T10 er en ekstern rumføler", note)
        self.assertNotIn("T10 sidder på styrekortet", note)

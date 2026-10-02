"""Register decoding, efficiency, bypass and protocol gating."""

from __future__ import annotations

import sys
import types
import unittest
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / "custom_components" / "nilan_cts602"
pkg = types.ModuleType("nilan_cts602")
pkg.__path__ = [str(COMPONENT)]
pkg.__package__ = "nilan_cts602"
sys.modules.setdefault("nilan_cts602", pkg)

from nilan_cts602.alarms import ALARMS, alarm_slugs
from nilan_cts602.catalog import READ_BLOCKS, iter_entities, read_blocks
from nilan_cts602.decode import (
    BypassState,
    alarm_count,
    build_snapshot,
    decode_alarm_date,
    decode_alarm_time,
    decode_ascii,
    decode_clock,
    decode_software,
    exhaust_efficiency,
    filter_alarm,
    next_bypass,
    restore_bypass,
    scale_temperature,
    scale_unsigned,
    signed_int16,
    temperature_plausible,
)
from nilan_cts602.frontend_resource import pending_resource_updates
from nilan_cts602.plant import normalize_plant
from nilan_cts602.writes import (
    NEVER_WRITE_ADDRESSES,
    ForbiddenWrite,
    WriteDisabled,
    assert_write_allowed,
)


def _words(text: str) -> list[int]:
    raw = text.encode("latin1")
    if len(raw) % 2:
        raw += b"\x00"
    return [raw[index] | (raw[index + 1] << 8) for index in range(0, len(raw), 2)]


class DecodingTests(unittest.TestCase):
    def test_signed_temperature_scale(self):
        self.assertEqual(signed_int16(0xFFFF), -1)
        self.assertEqual(scale_temperature(0xFC18), -10.0)
        self.assertEqual(scale_temperature(2150), 21.5)
        self.assertEqual(scale_temperature(0), 0.0)
        self.assertEqual(scale_unsigned(4500), 45.0)
        self.assertEqual(scale_unsigned(1390), 13.9)

    def test_ascii_degree_and_software(self):
        self.assertEqual(decode_ascii(_words("2.35.a")), "2.35.a")
        degree = decode_ascii([0x43DF])
        self.assertEqual(degree, "°C")
        self.assertEqual(decode_software(_words("2.") + _words("35") + _words(".a")), "2.35.a")

    def test_clock_and_alarm_timestamp_best_effort(self):
        self.assertEqual(decode_clock(5, 30, 14, 2, 10, 2026).isoformat(), "2026-10-02T14:30:05")
        self.assertIsNone(decode_clock(5, 30, 14, 31, 2, 2026))
        packed = 2 | (10 << 5) | (26 << 9)
        self.assertEqual(decode_alarm_date(packed).isoformat(), "2026-10-02")
        self.assertEqual(decode_alarm_time((14 << 8) | 30).strftime("%H:%M"), "14:30")
        self.assertIsNone(decode_alarm_date(0))
        self.assertIsNone(decode_alarm_date(0xFFFF))
        self.assertIsNone(decode_alarm_time(0xFFFF))
        self.assertIsNone(decode_alarm_date(32))

    def test_implausible_temperature(self):
        self.assertTrue(temperature_plausible(39.0))
        self.assertFalse(temperature_plausible(-40.0))
        self.assertFalse(temperature_plausible(120.0))
        self.assertFalse(temperature_plausible(None))


class EfficiencyTests(unittest.TestCase):
    def test_exhaust_side_formula_and_guard(self):
        value = exhaust_efficiency(24.5, 23.2, 19.4)
        self.assertAlmostEqual(value, 1.3 / 5.1 * 100.0)
        self.assertIsNone(exhaust_efficiency(22.0, 20.0, 20.0))
        self.assertIsNone(exhaust_efficiency(22.0, 20.0, 19.1))
        self.assertEqual(exhaust_efficiency(22.0, 10.0, 19.0), 100.0)
        self.assertEqual(exhaust_efficiency(20.0, 25.0, 10.0), 0.0)
        self.assertIsNone(exhaust_efficiency(None, 10.0, 0.0))

    def test_snapshot_marks_low_delta_unavailable(self):
        snapshot = build_snapshot(
            inputs={203: 2200, 204: 2100, 208: 2000, 1204: 1390},
            holdings={},
            protocol=9,
            bypass_position="unknown",
            plant=normalize_plant({}),
        )
        efficiency = snapshot["points"]["efficiency"]
        self.assertFalse(efficiency["available"])
        self.assertEqual(efficiency["attributes"]["reason"], "delta_below_3k")
        self.assertEqual(efficiency["attributes"]["formula"], "(T3-T4)/(T3-T8)*100")
        controller = snapshot["points"]["efficiency_controller"]
        self.assertEqual(controller["value"], 13.9)
        self.assertIn("controller", controller["attributes"]["label_en"].lower())


class FilterTests(unittest.TestCase):
    def test_alarm_19_and_days_left_not_the_pressure_switch(self):
        self.assertTrue(filter_alarm(0x81, [19, 0, 0], 153))
        self.assertFalse(filter_alarm(0x00, [19, 0, 0], 153))
        self.assertTrue(filter_alarm(0x00, [0, 0, 0], 0))
        self.assertFalse(filter_alarm(0x00, [0, 0, 0], 153))
        self.assertEqual(alarm_count(0x82), 2)
        snapshot = build_snapshot(
            inputs={400: 0x00, 401: 19, 1104: 153},
            holdings={},
            protocol=9,
            bypass_position="closed",
            plant=normalize_plant({}),
        )
        self.assertFalse(snapshot["points"]["filter"]["value"])
        due = build_snapshot(
            inputs={400: 0x00, 1104: 0},
            holdings={},
            protocol=9,
            bypass_position="closed",
            plant=normalize_plant({}),
        )
        self.assertTrue(due["points"]["filter"]["value"])


class BypassTests(unittest.TestCase):
    def test_relay_pulse_does_not_flicker(self):
        state = BypassState("closed")
        pulsed = next_bypass(state, open_relay=True, close_relay=False, position_register=None, use_position_register=False)
        self.assertEqual(pulsed.position, "closed")
        still = next_bypass(pulsed, open_relay=True, close_relay=False, position_register=None, use_position_register=False)
        self.assertEqual(still.position, "closed")
        opened = next_bypass(still, open_relay=False, close_relay=False, position_register=None, use_position_register=False)
        self.assertEqual(opened.position, "open")
        closing = next_bypass(opened, open_relay=False, close_relay=True, position_register=None, use_position_register=False)
        self.assertEqual(closing.position, "open")
        closed = next_bypass(closing, open_relay=False, close_relay=False, position_register=None, use_position_register=False)
        self.assertEqual(closed.position, "closed")

    def test_position_register_from_protocol_11(self):
        state = BypassState("closed", True, False)
        opened = next_bypass(state, open_relay=False, close_relay=True, position_register=1, use_position_register=True)
        self.assertEqual(opened.position, "open")
        self.assertFalse(opened.pending_open)
        closed = next_bypass(opened, open_relay=True, close_relay=False, position_register=0, use_position_register=True)
        self.assertEqual(closed.position, "closed")

    def test_missing_sample_keeps_latched_position(self):
        state = BypassState("open")
        kept = next_bypass(state, open_relay=None, close_relay=None, position_register=None, use_position_register=False)
        self.assertEqual(kept.position, "open")

    def test_open_stays_open_until_close_pulse(self):
        stamp = datetime(2026, 10, 2, 18, 0, tzinfo=UTC)
        state = BypassState()
        opening = next_bypass(
            state,
            open_relay=True,
            close_relay=False,
            position_register=None,
            use_position_register=False,
            now=stamp,
        )
        self.assertEqual(opening.position, "unknown")
        self.assertEqual(opening.moving, "opening")
        self.assertFalse(opening.restored)
        opened = next_bypass(
            opening,
            open_relay=False,
            close_relay=False,
            position_register=None,
            use_position_register=False,
            now=stamp,
        )
        self.assertEqual(opened.position, "open")
        self.assertIsNone(opened.moving)
        self.assertEqual(opened.last_pulse["relay"], "H102")
        self.assertIn("2026-10-02", opened.last_pulse["at"])
        idle = next_bypass(
            opened,
            open_relay=False,
            close_relay=False,
            position_register=None,
            use_position_register=False,
            now=stamp,
        )
        self.assertEqual(idle.position, "open")
        self.assertEqual(idle.last_pulse["relay"], "H102")
        closing = next_bypass(
            idle,
            open_relay=False,
            close_relay=True,
            position_register=None,
            use_position_register=False,
            now=stamp,
        )
        self.assertEqual(closing.position, "open")
        self.assertEqual(closing.moving, "closing")
        closed = next_bypass(
            closing,
            open_relay=False,
            close_relay=False,
            position_register=None,
            use_position_register=False,
            now=stamp,
        )
        self.assertEqual(closed.position, "closed")
        self.assertEqual(closed.last_pulse["relay"], "H103")
        self.assertFalse(closed.restored)

    def test_restore_keeps_position_until_a_live_pulse(self):
        pulse = {"relay": "H102", "at": "2026-10-01T00:00:00+00:00"}
        restored = restore_bypass(BypassState(), position="open", last_pulse=pulse)
        self.assertTrue(restored.restored)
        self.assertEqual(restored.position, "open")
        self.assertEqual(restored.last_pulse["relay"], "H102")
        idle = next_bypass(
            restored,
            open_relay=False,
            close_relay=False,
            position_register=None,
            use_position_register=False,
        )
        self.assertTrue(idle.restored)
        self.assertEqual(idle.position, "open")
        live = BypassState("closed")
        self.assertIs(restore_bypass(live, position="open", last_pulse=pulse), live)
        opening = next_bypass(
            restored,
            open_relay=True,
            close_relay=False,
            position_register=None,
            use_position_register=False,
        )
        self.assertEqual(opening.moving, "opening")
        self.assertFalse(opening.restored)
        self.assertEqual(opening.position, "open")

    def test_snapshot_exposes_relays_and_restore_attributes(self):
        flap = BypassState("open", False, False, None, True, {"relay": "H102", "at": "2026-10-01T00:00:00+00:00"})
        snapshot = build_snapshot(
            inputs={},
            holdings={102: 0, 103: 1},
            protocol=9,
            bypass_position="unknown",
            plant=normalize_plant({}),
            bypass=flap,
        )
        bypass = snapshot["points"]["bypass"]
        self.assertTrue(bypass["available"])
        self.assertTrue(bypass["value"])
        self.assertTrue(bypass["attributes"]["restored"])
        self.assertEqual(bypass["attributes"]["position"], "open")
        self.assertEqual(bypass["attributes"]["last_pulse"]["relay"], "H102")
        self.assertEqual(bypass["attributes"]["source"], "relay_pulse")
        self.assertFalse(snapshot["points"]["bypass_open_relay"]["value"])
        self.assertTrue(snapshot["points"]["bypass_close_relay"]["value"])
        self.assertEqual(snapshot["points"]["bypass_open_relay"]["attributes"]["modbus"], "40103")
        self.assertEqual(snapshot["points"]["bypass_close_relay"]["attributes"]["modbus"], "40104")
        missing = build_snapshot(
            inputs={},
            holdings={},
            protocol=9,
            bypass_position="unknown",
            plant=normalize_plant({}),
            bypass=BypassState(),
        )
        self.assertFalse(missing["points"]["bypass"]["available"])
        self.assertFalse(missing["points"]["bypass_open_relay"]["available"])
        self.assertIsNone(missing["points"]["bypass_open_relay"]["value"])


class ResourceTests(unittest.TestCase):
    def test_only_the_nilan_card_url_is_rewritten(self):
        items = [
            {"id": "76e93f47e5344082b69d7c95bdd17373", "url": "/nilan_cts602-static/nilan-card.js?v=0.2.0"},
            {"id": "other", "url": "/local/other.js?v=1"},
            {"id": "same", "url": "/nilan_cts602-static/nilan-card.js?v=0.2.1"},
            "skip",
        ]
        self.assertEqual(
            pending_resource_updates(items, "0.2.1"),
            [("76e93f47e5344082b69d7c95bdd17373", "/nilan_cts602-static/nilan-card.js?v=0.2.1")],
        )
        known = [{"id": "76e93f47e5344082b69d7c95bdd17373", "url": "/local/renamed.js"}]
        self.assertEqual(
            pending_resource_updates(known, "0.2.1"),
            [("76e93f47e5344082b69d7c95bdd17373", "/nilan_cts602-static/nilan-card.js?v=0.2.1")],
        )


class ProtocolTests(unittest.TestCase):
    def test_blocks_follow_protocol(self):
        def addresses(protocol, table):
            found = []
            for block in read_blocks(protocol, include_slow=True):
                if block.table == table:
                    found.extend(range(block.address, block.address + block.count))
            return found

        self.assertIn(1100, addresses(9, "input"))
        self.assertNotIn(3000, addresses(9, "input"))
        self.assertIn(3000, addresses(11, "input"))
        self.assertNotIn(1100, addresses(8, "input"))
        holding = addresses(9, "holding")
        for forbidden in (0, 1000, 1005, 1006, 1007, 2000):
            self.assertNotIn(forbidden, holding)
        self.assertIn(201, holding)
        self.assertIn(102, holding)

    def test_fast_poll_skips_slow_blocks(self):
        fast = read_blocks(9, include_slow=False)
        self.assertTrue(all(not block.slow for block in fast))
        self.assertTrue(any(block.address == 200 and block.table == "input" for block in fast))
        self.assertFalse(any(block.address == 300 and block.table == "holding" for block in fast))

    def test_entities_follow_plant_and_protocol(self):
        plain = {spec.key for spec in iter_entities(9, normalize_plant({}))}
        self.assertNotIn("co2", plain)
        self.assertNotIn("preheater", plain)
        self.assertNotIn("reheater", plain)
        self.assertIn("filter_days_left", plain)
        self.assertIn("efficiency", plain)
        self.assertIn("bypass_open_relay", plain)
        self.assertIn("bypass_close_relay", plain)
        self.assertIn("t15_panel", plain)
        fitted = {spec.key for spec in iter_entities(9, normalize_plant({"co2": True, "preheater": True, "reheater": "water"}))}
        self.assertIn("co2", fitted)
        self.assertIn("preheater", fitted)
        self.assertIn("reheater", fitted)
        self.assertIn("reheater_capacity", fitted)
        old = {spec.key for spec in iter_entities(8, normalize_plant({}))}
        self.assertNotIn("fan_step", old)
        self.assertNotIn("filter_days_left", old)

    def test_documented_blocks_have_no_holes_inside_the_request(self):
        for block in READ_BLOCKS:
            self.assertGreaterEqual(block.count, 1)
            self.assertLessEqual(block.address + block.count - 1, 0xFFFF)


class WritePolicyTests(unittest.TestCase):
    def test_dangerous_and_all_writes_are_refused(self):
        for address in (0, 100, 205, 1000, 1005, 1006, 1007, 2000):
            with self.subTest(address=address):
                self.assertIn(address, NEVER_WRITE_ADDRESSES)
                with self.assertRaises(ForbiddenWrite):
                    assert_write_allowed(address, [1])
        with self.assertRaises(ForbiddenWrite):
            assert_write_allowed(500, [4])
        with self.assertRaises(ForbiddenWrite):
            assert_write_allowed(1002, [4])
        with self.assertRaises(ForbiddenWrite):
            assert_write_allowed(400, [19])
        with self.assertRaises(WriteDisabled):
            assert_write_allowed(1004, [2200])

    def test_alarm_catalog_covers_the_pdf_list(self):
        self.assertEqual(len(ALARMS), 65)
        self.assertEqual(ALARMS[19].slug, "filter")
        self.assertEqual(ALARMS[27].slug, "t1_short")
        self.assertEqual(ALARMS[58].slug, "t16_open")
        self.assertEqual(len(alarm_slugs()), 66)


class PlantTests(unittest.TestCase):
    def test_defaults_and_unknown_keys(self):
        plant = normalize_plant({"future": True, "reheater": "steam", "preheater": "yes"})
        self.assertEqual(plant["reheater"], "none")
        self.assertFalse(plant["preheater"])
        self.assertEqual(plant["room_source"], "entity")
        self.assertIsNone(plant["room_entity"])
        self.assertNotIn("future", plant)
        chosen = normalize_plant({"reheater": "water", "co2": True, "room_source": "t10", "room_entity": " sensor.stue "})
        self.assertEqual(chosen["reheater"], "water")
        self.assertTrue(chosen["co2"])
        self.assertEqual(chosen["room_source"], "t10")
        self.assertEqual(chosen["room_entity"], "sensor.stue")


class TranslationContractTests(unittest.TestCase):
    def test_every_entity_and_enum_is_translated(self):
        import json
        from nilan_cts602.catalog import ENTITIES, OPTION_LISTS

        strings = json.loads((COMPONENT / "strings.json").read_text(encoding="utf-8"))
        danish = json.loads((COMPONENT / "translations" / "da.json").read_text(encoding="utf-8"))
        for spec in ENTITIES:
            block = strings["entity"][spec.domain][spec.key]
            da_block = danish["entity"][spec.domain][spec.key]
            self.assertEqual(block["name"], spec.name_en)
            self.assertEqual(da_block["name"], spec.name_da)
            if spec.options_name:
                self.assertEqual(set(block["state"]), set(OPTION_LISTS[spec.options_name]))
                self.assertEqual(set(da_block["state"]), set(OPTION_LISTS[spec.options_name]))


if __name__ == "__main__":
    unittest.main()

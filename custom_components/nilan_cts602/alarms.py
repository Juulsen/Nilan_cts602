# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""CTS602 alarm list.

Texts follow Nilan's alarm table. Danish labels are translations for the UI.
The numeric code is the value in input registers 401, 404 and 407.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Alarm:
    """One alarm code."""

    code: int
    slug: str
    name_en: str
    name_da: str
    description_en: str
    description_da: str
    severity: str


def _alarm(
    code: int,
    slug: str,
    name_en: str,
    name_da: str,
    description_en: str,
    description_da: str,
    severity: str,
) -> Alarm:
    return Alarm(code, slug, name_en, name_da, description_en, description_da, severity)


_ROWS: tuple[Alarm, ...] = (
    _alarm(0, "none", "No alarm", "Ingen alarm", "No alarm.", "Ingen alarm.", "none"),
    _alarm(1, "hardware", "Hardware", "Hardware", "Electrical fault, for example the clock circuit.", "Elektrisk fejl, for eksempel urkredsløbet.", "critical"),
    _alarm(2, "timeout", "Timeout", "Timeout", "A warning has become critical.", "En advarsel er blevet kritisk.", "critical"),
    _alarm(3, "fire", "Fire thermostat", "Brandtermostat", "Fire thermostat.", "Brandtermostat.", "critical"),
    _alarm(4, "pressure", "Pressure switch", "Pressostat", "High or low pressure switch.", "Høj- eller lavtrykspressostat.", "critical"),
    _alarm(5, "door", "Door open", "Låge åben", "Inspection door is open.", "Inspektionslågen er åben.", "critical"),
    _alarm(6, "defrost_timeout", "Defrost time", "Afrimningstid", "Compressor defrost time exceeded.", "Afrimningstiden for kompressoren er overskredet.", "info"),
    _alarm(7, "frost", "Frost", "Frost", "Water coil freeze protection. Without T9 the thermostat tripped. With T9 the surface did not reach 20 °C within 6 minutes.", "Frostsikring af vandflade. Uden T9 er termostaten udløst. Med T9 nåede fladen ikke 20 °C inden for 6 minutter.", "critical"),
    _alarm(8, "frost_thermostat", "Frost thermostat", "Frosttermostat", "Water coil freeze thermostat, only relevant with T9.", "Frosttermostat på vandfladen. Kun relevant med T9.", "critical"),
    _alarm(9, "overtemp", "Over temperature", "Overtemperatur", "Domestic hot water above the maximum plus 10 °C.", "Brugsvand over maksimum plus 10 °C.", "info"),
    _alarm(10, "overheat", "Reheater overheat", "Eftervarme overhedet", "Electric reheater overheating.", "El-eftervarmefladen er overhedet.", "info"),
    _alarm(11, "airflow", "Airflow", "Luftmængde", "Electric reheater lacks airflow.", "El-eftervarmefladen mangler luftmængde.", "info"),
    _alarm(12, "thermo", "Motor thermal", "Motorværn", "Ventilation motor thermal switch.", "Motorværn på ventilationsmotoren.", "critical"),
    _alarm(13, "boiling", "Boiling", "Kogning", "Domestic hot water is boiling.", "Brugsvandet koger.", "critical"),
    _alarm(14, "sensor", "Control sensor", "Styreføler", "The selected controlling sensor is defective.", "Den valgte styreføler er defekt.", "critical"),
    _alarm(15, "room_low", "Room low", "Rum for koldt", "Room temperature is below the minimum and winter protection had no effect.", "Rumtemperaturen er under minimum, og vinterbeskyttelsen hjalp ikke.", "critical"),
    _alarm(16, "software", "Startup", "Opstart", "Program startup or main loop.", "Programstart eller hovedløkke.", "info"),
    _alarm(17, "watchdog", "Watchdog", "Watchdog", "Program execution error.", "Fejl i programafviklingen.", "info"),
    _alarm(18, "config", "Configuration", "Konfiguration", "Stored settings changed, for example after a software update.", "Gemte indstillinger er ændret, for eksempel efter en softwareopdatering.", "info"),
    _alarm(19, "filter", "Filter", "Filter", "Air filter pressure switch or filter timer.", "Filterpressostat eller filtertimer.", "info"),
    _alarm(20, "legionella", "Legionella", "Legionella", "Legionella function was not completed in time.", "Legionellafunktionen blev ikke kørt inden for tidsfristen.", "info"),
    _alarm(21, "power", "Power failure", "Strømafbrydelse", "Power was out longer than the clock backup.", "Strømmen har været væk længere end urets backup.", "info"),
    _alarm(22, "air_temperature", "Air temperature", "Lufttemperatur", "Air temperature fault.", "Fejl på lufttemperatur.", "info"),
    _alarm(23, "water_temperature", "Water temperature", "Vandtemperatur", "Domestic hot water temperature fault.", "Fejl på brugsvandstemperatur.", "info"),
    _alarm(24, "heat_temperature", "Heating temperature", "Varme temperatur", "Central heating temperature fault.", "Fejl på centralvarmetemperatur.", "info"),
    _alarm(25, "modem", "Modem", "Modem", "Modem communication error. CTS 600 generation 1 only.", "Modemfejl. Kun CTS 600 generation 1.", "info"),
    _alarm(26, "network", "Network", "Netværk", "Network communication error. CTS 600 generation 1 only.", "Netværksfejl. Kun CTS 600 generation 1.", "info"),
    _alarm(70, "anode", "Anode", "Anode", "The domestic hot water anode is corroded and needs replacing.", "Anoden i varmtvandsbeholderen er tæret og skal skiftes.", "info"),
    _alarm(71, "exchanger_defrost", "Exchanger defrost", "Veksler afrimning", "Exchanger defrost time exceeded.", "Afrimningstiden for veksleren er overskredet.", "info"),
    _alarm(90, "slave_io", "Slave I/O", "Slave I/O", "Not relevant for CTS602.", "Ikke relevant for CTS602.", "critical"),
    _alarm(91, "option_module", "Option module", "Optionsmodul", "The options module is missing.", "Optionsmodulet mangler.", "info"),
    _alarm(92, "preset", "Preset", "Forindstilling", "Installer settings could not be written or reloaded.", "Installatørindstillingerne kunne ikke skrives eller genindlæses.", "info"),
    _alarm(95, "software_rejected", "Software rejected", "Software afvist", "Software update rejected because the hardware is newer than the software.", "Softwareopdatering afvist, fordi hardwaren er nyere end softwaren.", "info"),
)

ALARMS: dict[int, Alarm] = {row.code: row for row in _ROWS}

for _sensor in range(1, 17):
    _short = 25 + (2 * _sensor)
    _open = _short + 1
    ALARMS[_short] = _alarm(
        _short,
        f"t{_sensor}_short",
        f"T{_sensor} shorted",
        f"T{_sensor} kortsluttet",
        f"Temperature sensor T{_sensor} is shorted.",
        f"Temperaturføler T{_sensor} er kortsluttet.",
        "critical",
    )
    ALARMS[_open] = _alarm(
        _open,
        f"t{_sensor}_open",
        f"T{_sensor} open",
        f"T{_sensor} afbrudt",
        f"Temperature sensor T{_sensor} is disconnected.",
        f"Temperaturføler T{_sensor} er afbrudt.",
        "critical",
    )

UNKNOWN_ALARM = _alarm(
    -1,
    "unknown",
    "Unknown alarm",
    "Ukendt alarm",
    "The controller reported an alarm code this integration does not know.",
    "Regulatoren meldte en alarmkode, som integrationen ikke kender.",
    "info",
)


def alarm_for_code(code: int | None) -> Alarm:
    """Return the alarm description for a code, or the unknown placeholder."""

    if code is None:
        return ALARMS[0]
    return ALARMS.get(int(code), UNKNOWN_ALARM)


def alarm_slugs() -> tuple[str, ...]:
    """Stable enum options, with unknown last."""

    ordered = [ALARMS[code].slug for code in sorted(ALARMS)]
    if UNKNOWN_ALARM.slug not in ordered:
        ordered.append(UNKNOWN_ALARM.slug)
    return tuple(ordered)

# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Juulsen
"""Writable CTS602 settings for protocol 9.

Engineering values are converted here. The Modbus client only sees raw
register words that already passed the allowlist in writes.py.
"""

from __future__ import annotations

from dataclasses import dataclass

from .writes import (
    ALARM_RESET_ADDRESS,
    CLOCK_ADDRESS,
    DependencyError,
    RangeError,
    WriteRejected,
)


@dataclass(frozen=True, slots=True)
class Choice:
    """One discrete register value."""

    raw: int
    slug: str
    label_da: str
    label_en: str


@dataclass(frozen=True, slots=True)
class Setting:
    """One allowlisted user setting or action."""

    key: str
    address: int
    kind: str
    name_da: str
    name_en: str
    explain_da: str
    explain_en: str
    help_da: str
    help_en: str
    risk: str
    register: str
    tab: str
    section: str
    when: str = "always"
    experimental: bool = False
    unit: str = ""
    minimum: float | None = None
    maximum: float | None = None
    step: float | None = None
    scale: float = 1.0
    signed: bool = False
    choices: tuple[Choice, ...] = ()
    high_raw: tuple[int, ...] = ()
    fixed_raw: int | None = None
    count: int = 1
    special: str = ""
    icon: str = "mdi:tune"


def _choice(raw: int, slug: str, da: str, en: str) -> Choice:
    return Choice(raw, slug, da, en)


_RUN = (
    _choice(0, "off", "Fra", "Off"),
    _choice(1, "on", "Til", "On"),
)
_MODE = (
    _choice(1, "heat", "Varme", "Heat"),
    _choice(2, "cool", "Køl", "Cool"),
    _choice(3, "auto", "Auto", "Auto"),
)
_STEP = (
    _choice(1, "1", "1", "1"),
    _choice(2, "2", "2", "2"),
    _choice(3, "3", "3", "3"),
    _choice(4, "4", "4", "4"),
)
_USER = (
    _choice(0, "none", "Fra", "Off"),
    _choice(1, "extend", "Forlæng", "Extend"),
    _choice(2, "inlet", "Indblæs", "Supply"),
    _choice(3, "exhaust", "Udsug", "Extract"),
    _choice(4, "external_heater_offset", "Ekst. offset", "External offset"),
    _choice(5, "ventilate", "Ventilation", "Ventilate"),
    _choice(6, "cooker_hood", "Emhætte", "Cooker hood"),
)
_WEEK = (
    _choice(0, "none", "Intet", "None"),
    _choice(1, "program_1", "Udearbejdende", "Away at work"),
    _choice(2, "program_2", "Hjemmegående", "Home during the day"),
    _choice(3, "program_3", "Erhverv", "Commercial"),
)
_COOL_VENT = (
    _choice(0, "off", "Fra", "Off"),
    _choice(2, "2", "2", "2"),
    _choice(3, "3", "3", "3"),
    _choice(4, "4", "4", "4"),
)
_COOL_SET = (
    _choice(0, "off", "Fra (ingen køling)", "Off (no cooling)"),
    _choice(1, "plus_0", "+0 K", "+0 K"),
    _choice(2, "plus_1", "+1 K", "+1 K"),
    _choice(3, "plus_2", "+2 K", "+2 K"),
    _choice(4, "plus_3", "+3 K", "+3 K"),
    _choice(5, "plus_4", "+4 K", "+4 K"),
    _choice(6, "plus_5", "+5 K", "+5 K"),
    _choice(7, "plus_7", "+7 K", "+7 K"),
    _choice(8, "plus_10", "+10 K", "+10 K"),
)
_RH_LOW = (
    _choice(0, "off", "Fra", "Off"),
    _choice(1, "1", "1", "1"),
    _choice(2, "2", "2", "2"),
    _choice(3, "3", "3", "3"),
)
_RH_HIGH = (
    _choice(0, "off", "Fra", "Off"),
    _choice(2, "2", "2", "2"),
    _choice(3, "3", "3", "3"),
    _choice(4, "4", "4", "4"),
)
_CO2_STEP = _RH_HIGH


def _number(
    key: str,
    address: int,
    name_da: str,
    name_en: str,
    explain_da: str,
    explain_en: str,
    *,
    register: str,
    tab: str,
    section: str,
    minimum: float,
    maximum: float,
    step: float,
    scale: float = 1.0,
    unit: str = "",
    risk: str = "low",
    when: str = "always",
    experimental: bool = False,
    signed: bool = False,
    special: str = "",
    icon: str = "mdi:tune",
) -> Setting:
    return Setting(
        key=key,
        address=address,
        kind="number",
        name_da=name_da,
        name_en=name_en,
        explain_da=explain_da,
        explain_en=explain_en,
        help_da=explain_da,
        help_en=explain_en,
        risk=risk,
        register=register,
        tab=tab,
        section=section,
        when=when,
        experimental=experimental,
        unit=unit,
        minimum=minimum,
        maximum=maximum,
        step=step,
        scale=scale,
        signed=signed,
        special=special,
        icon=icon,
    )


def _select(
    key: str,
    address: int,
    name_da: str,
    name_en: str,
    explain_da: str,
    explain_en: str,
    *,
    register: str,
    tab: str,
    section: str,
    choices: tuple[Choice, ...],
    risk: str = "low",
    when: str = "always",
    experimental: bool = False,
    high_raw: tuple[int, ...] = (),
    icon: str = "mdi:tune",
) -> Setting:
    return Setting(
        key=key,
        address=address,
        kind="select",
        name_da=name_da,
        name_en=name_en,
        explain_da=explain_da,
        explain_en=explain_en,
        help_da=explain_da,
        help_en=explain_en,
        risk=risk,
        register=register,
        tab=tab,
        section=section,
        when=when,
        experimental=experimental,
        choices=choices,
        high_raw=high_raw,
        icon=icon,
    )


def _button(
    key: str,
    address: int,
    name_da: str,
    name_en: str,
    explain_da: str,
    explain_en: str,
    *,
    register: str,
    tab: str,
    section: str,
    fixed_raw: int | None,
    risk: str,
    count: int = 1,
    when: str = "always",
    icon: str = "mdi:gesture-tap",
) -> Setting:
    return Setting(
        key=key,
        address=address,
        kind="button",
        name_da=name_da,
        name_en=name_en,
        explain_da=explain_da,
        explain_en=explain_en,
        help_da=explain_da,
        help_en=explain_en,
        risk=risk,
        register=register,
        tab=tab,
        section=section,
        when=when,
        fixed_raw=fixed_raw,
        count=count,
        icon=icon,
    )


SETTINGS: tuple[Setting, ...] = (
    _select(
        "ctrl_run", 1001, "Anlæg tændt", "Unit on",
        "Slukker hele ventilationen. Nilan fraråder stop, fordi fugt kan kondensere i kanaler og aggregat.",
        "Switches the whole ventilation off. Nilan advises against stopping, because moisture can condense in the ducts and the unit.",
        register="H1001 RunSet", tab="operation", section="drift", choices=_RUN, risk="medium",
        high_raw=(0,), icon="mdi:power",
    ),
    _select(
        "ctrl_mode", 1002, "Driftsform", "Operating mode",
        "Auto åbner og lukker bypass efter temperaturen. Varme holder bypass lukket. Køl åbner den, når udeluften er koldere end fraluften.",
        "Auto opens and closes the bypass from the temperatures. Heat keeps the bypass closed. Cool opens it when outdoor air is colder than extract air.",
        register="H1002 ModeSet", tab="operation", section="drift", choices=_MODE, risk="medium", icon="mdi:sun-snowflake",
    ),
    _number(
        "ctrl_fan_step", 1003, "Ventilationstrin", "Fan step",
        "Luftmængden. Trinnet gælder udsugningen. Trin 1 er lavest, 4 højest. Fugt og brugervalg kan midlertidigt hæve trinnet.",
        "Airflow. The step applies to the extract fan. Step 1 is lowest, 4 is highest. Humidity and a user function can raise the step for a while.",
        register="H1003 VentSet", tab="operation", section="step", minimum=1, maximum=4, step=1, risk="medium", icon="mdi:fan",
    ),
    _select(
        "ctrl_user1_function", 601, "Brugervalg 1 – funktion", "User function 1 – action",
        "Hvad der sker, når brugervalg aktiveres fra en knap, en kontakt eller Start her. Ekstern offset kræver optionsprint.",
        "What happens when the user function is started from a button, a contact or Start here. External offset needs the option board.",
        register="H601 UserFuncSet", tab="operation", section="user1", choices=_USER, risk="medium", icon="mdi:gesture-tap-button",
    ),
    _number(
        "ctrl_user1_time", 602, "Brugervalg 1 – varighed", "User function 1 – duration",
        "Hvor længe funktionen kører efter et tryk (maks. 8 timer). 0 betyder så længe kontakten er sluttet.",
        "How long the function runs after a press (maximum 8 hours). 0 means as long as the contact is closed.",
        register="H602 UserTimeSet", tab="operation", section="user1", minimum=0, maximum=480, step=15, unit="min",
        special="user_time", icon="mdi:timer-outline",
    ),
    _number(
        "ctrl_user1_step", 603, "Brugervalg 1 – trin", "User function 1 – step",
        "Ventilationstrin mens brugervalget kører. Stop (0) vises ikke, fordi det ville slukke anlægget.",
        "Fan step while the user function runs. Off (0) is hidden, because it would stop the unit.",
        register="H603 UserVentSet", tab="operation", section="user1", minimum=1, maximum=4, step=1, risk="medium", icon="mdi:fan",
    ),
    _number(
        "ctrl_user1_temp", 604, "Brugervalg 1 – temperatur", "User function 1 – temperature",
        "Ønsket rumtemperatur, mens Forlæng kører. Skalaen er rå grader og er ikke bekræftet på dette anlæg.",
        "Wanted room temperature while Extend is running. The scale is raw degrees and is not confirmed on this unit.",
        register="H604 UserTempSet", tab="operation", section="user1", minimum=5, maximum=30, step=1, unit="°C",
        experimental=True, icon="mdi:thermometer",
    ),
    _select(
        "ctrl_user1_start", 600, "Brugervalg 1 – start/stop", "User function 1 – start/stop",
        "Starter brugervalget nu, for eksempel boost. Skrivning til H600 er ikke dokumenteret og testes kun når Eksperimentel er slået til.",
        "Starts the user function now, for example a boost. Writing H600 is undocumented and is only tried when Experimental is on.",
        register="H600 UserFuncAct", tab="operation", section="user1", choices=_RUN, risk="medium",
        experimental=True, icon="mdi:play",
    ),
    _select(
        "ctrl_user2_function", 611, "Brugervalg 2 – funktion", "User function 2 – action",
        "Samme valg som brugervalg 1, men via indgang S7 på optionsprintet.",
        "Same choices as user function 1, but through input S7 on the option board.",
        register="H611", tab="operation", section="user2", choices=_USER, risk="medium", when="options_board",
    ),
    _number(
        "ctrl_user2_time", 612, "Brugervalg 2 – varighed", "User function 2 – duration",
        "Hvor længe brugervalg 2 kører. 0 betyder så længe kontakten er sluttet.",
        "How long user function 2 runs. 0 means as long as the contact is closed.",
        register="H612", tab="operation", section="user2", minimum=0, maximum=480, step=15, unit="min",
        special="user_time", when="options_board",
    ),
    _number(
        "ctrl_user2_step", 613, "Brugervalg 2 – trin", "User function 2 – step",
        "Ventilationstrin mens brugervalg 2 kører.",
        "Fan step while user function 2 runs.",
        register="H613", tab="operation", section="user2", minimum=1, maximum=4, step=1, risk="medium", when="options_board",
    ),
    _number(
        "ctrl_user2_temp", 614, "Brugervalg 2 – temperatur", "User function 2 – temperature",
        "Ønsket rumtemperatur mens Forlæng kører på brugervalg 2. Skalaen er ikke bekræftet.",
        "Wanted room temperature while Extend runs on user function 2. The scale is not confirmed.",
        register="H614", tab="operation", section="user2", minimum=5, maximum=30, step=1, unit="°C",
        experimental=True, when="options_board",
    ),
    _select(
        "ctrl_user2_start", 610, "Brugervalg 2 – start/stop", "User function 2 – start/stop",
        "Starter brugervalg 2. Skrivning er ikke dokumenteret.",
        "Starts user function 2. Writing is undocumented.",
        register="H610", tab="operation", section="user2", choices=_RUN, risk="medium",
        experimental=True, when="options_board",
    ),
    _number(
        "ctrl_ext_offset", 605, "Ekstern varme-offset", "External heat offset",
        "Forskyder setpunktet for den eksterne radiator. Kun med optionsprint. Skalaen er rå fortegnsgrader og er ikke bekræftet.",
        "Shifts the setpoint of the external radiator. Option board only. The scale is raw signed degrees and is not confirmed.",
        register="H605", tab="operation", section="user2", minimum=-10, maximum=10, step=1, unit="°C",
        signed=True, experimental=True, when="options_board",
    ),
    _number(
        "ctrl_ext_offset_2", 615, "Ekstern varme-offset (brugervalg 2)", "External heat offset (user function 2)",
        "Samme offset for brugervalg 2. Kun med optionsprint, og skalaen er ikke bekræftet.",
        "The same offset for user function 2. Option board only, and the scale is not confirmed.",
        register="H615", tab="operation", section="user2", minimum=-10, maximum=10, step=1, unit="°C",
        signed=True, experimental=True, when="options_board",
    ),
    _number(
        "ctrl_temperature", 1004, "Ønsket rumtemperatur", "Wanted room temperature",
        "Den temperatur anlægget styrer mod med bypass. Den måles af T3 (fraluft), fordi T15-panelet sidder på loftet.",
        "The temperature the unit steers towards with the bypass. It is measured by T3 (extract), because the T15 panel is in the loft.",
        register="H1004 TempSet", tab="temperature", section="room", minimum=5, maximum=30, step=0.5,
        scale=0.01, unit="°C", risk="medium", icon="mdi:thermometer",
    ),
    _number(
        "ctrl_supply_min_summer", 1201, "Min. indblæsning sommer", "Minimum supply, summer",
        "Koldeste luft der må blæses ind om sommeren. Bliver den koldere, lukker bypass.",
        "Coldest air that may be supplied in summer. If it gets colder, the bypass closes.",
        register="H1201", tab="temperature", section="supply", minimum=5, maximum=20, step=1, scale=0.01, unit="°C",
    ),
    _number(
        "ctrl_supply_min_winter", 1202, "Min. indblæsning vinter", "Minimum supply, winter",
        "Koldeste luft der må blæses ind om vinteren. Bliver indblæsningen koldere, lukker bypass.",
        "Coldest air that may be supplied in winter. If the supply gets colder, the bypass closes.",
        register="H1202", tab="temperature", section="supply", minimum=5, maximum=20, step=1, scale=0.01, unit="°C",
    ),
    _number(
        "ctrl_supply_max_summer", 1203, "Maks. indblæsning sommer", "Maximum supply, summer",
        "Varmeste indblæsning om sommeren. Vises kun når en eftervarmer er monteret.",
        "Warmest supply air in summer. Shown only when a reheater is fitted.",
        register="H1203", tab="temperature", section="supply", minimum=15, maximum=30, step=1, scale=0.01, unit="°C",
        when="reheater",
    ),
    _number(
        "ctrl_supply_max_winter", 1204, "Maks. indblæsning vinter", "Maximum supply, winter",
        "Varmeste indblæsning om vinteren. Vises kun når en eftervarmer er monteret.",
        "Warmest supply air in winter. Shown only when a reheater is fitted.",
        register="H1204", tab="temperature", section="supply", minimum=15, maximum=30, step=1, scale=0.01, unit="°C",
        when="reheater",
    ),
    _number(
        "ctrl_summer_limit", 1205, "Sommer/vinter-grænse", "Summer/winter limit",
        "Over denne udetemperatur bruges sommergrænserne, under den vintergrænserne.",
        "Above this outdoor temperature the summer limits are used, below it the winter limits.",
        register="H1205", tab="temperature", section="season", minimum=5, maximum=30, step=1, scale=0.01, unit="°C",
        icon="mdi:weather-partly-cloudy",
    ),
    _select(
        "ctrl_cool_vent", 1101, "Køling: ventilationstrin", "Cooling: fan step",
        "Hæver trinnet automatisk, mens anlægget køler via bypass. Fra er samme trin som ellers. Registeret er ikke bekræftet på Comfort.",
        "Raises the step automatically while the unit cools through the bypass. Off keeps the normal step. The register is not confirmed on Comfort.",
        register="H1101 CoolVent", tab="temperature", section="cooling", choices=_COOL_VENT, experimental=True,
    ),
    _select(
        "ctrl_cool_set", 1200, "Køling: setpunkt", "Cooling: setpoint",
        "Hvor mange grader over ønsket temperatur huset må blive, før bypass åbner for køling. Fra betyder ingen køling. Bypass kan stadig åbne efter min. indblæsning.",
        "How many degrees above the wanted temperature the house may get before the bypass opens for cooling. Off means no cooling. The bypass can still open from the minimum supply limit.",
        register="H1200 CoolSet", tab="temperature", section="cooling", choices=_COOL_SET, risk="medium", experimental=True,
    ),
    _number(
        "ctrl_night_day", 1206, "Natkøling: dag-grænse", "Night cooling: day limit",
        "Udetemperatur om dagen, der skal nås, før natkøling kan starte næste nat. 0 betyder sandsynligvis fra. Skalaen er antaget 0,01 °C.",
        "Outdoor temperature during the day that must be reached before night cooling can start the next night. 0 probably means off. The scale is assumed to be 0.01 °C.",
        register="H1206 NightDayLim", tab="temperature", section="night", minimum=0, maximum=30, step=1, scale=0.01,
        unit="°C", experimental=True,
    ),
    _number(
        "ctrl_night_set", 1207, "Natkøling: rumsetpunkt", "Night cooling: room setpoint",
        "Rumtemperatur natkølingen køler ned til. Skalaen er antaget 0,01 °C.",
        "Room temperature night cooling cools down to. The scale is assumed to be 0.01 °C.",
        register="H1207 NightSet", tab="temperature", section="night", minimum=10, maximum=30, step=1, scale=0.01,
        unit="°C", experimental=True,
    ),
    _select(
        "ctrl_rh_low", 1910, "Lavt trin ved tør luft", "Low step in dry air",
        "Om vinteren går anlægget ned på dette trin, når fugten er under grænsen. Det sparer varme og modvirker udtørring.",
        "In winter the unit drops to this step when humidity is below the limit. That saves heat and limits drying out.",
        register="H1910 RH_VentLo", tab="humidity", section="humidity", choices=_RH_LOW,
    ),
    _number(
        "ctrl_rh_limit", 1912, "Grænse for tør luft", "Dry-air limit",
        "Under denne relative fugt bruges det lave trin (kun vinter).",
        "Below this relative humidity the low step is used (winter only).",
        register="H1912 RH_LimLo", tab="humidity", section="humidity", minimum=15, maximum=45, step=1, scale=0.01, unit="%",
    ),
    _select(
        "ctrl_rh_high", 1911, "Højt trin ved fugt", "High step when humid",
        "Ved en pludselig fugtstigning, for eksempel bad eller madlavning, skifter anlægget til dette trin. Fugten sammenlignes med døgnmidlet.",
        "On a sudden rise in humidity, for example a shower or cooking, the unit changes to this step. Humidity is compared with the daily average.",
        register="H1911 RH_VentHi", tab="humidity", section="humidity", choices=_RH_HIGH,
    ),
    _number(
        "ctrl_rh_time", 1913, "Maks. tid på højt trin", "Maximum time on the high step",
        "Hvor længe fugt-boost højst må køre. 0 vises som ingen grænse.",
        "The longest a humidity boost may run. 0 is shown as no limit.",
        register="H1913 RH_TimeOut", tab="humidity", section="humidity", minimum=0, maximum=180, step=5, unit="min",
        special="humidity_time",
    ),
    _select(
        "ctrl_co2_step", 1920, "CO₂: højt trin", "CO₂: high step",
        "Trinnet ved højt CO₂. Kun når en CO₂-føler er monteret.",
        "The step used at high CO₂. Only when a CO₂ sensor is fitted.",
        register="H1920", tab="humidity", section="co2", choices=_CO2_STEP, when="co2", icon="mdi:molecule-co2",
    ),
    _number(
        "ctrl_co2_low", 1921, "CO₂: grænse normal", "CO₂: normal limit",
        "Under denne værdi går anlægget tilbage til normalt trin. Skal være lavere end den høje grænse.",
        "Below this value the unit returns to the normal step. It must be lower than the high limit.",
        register="H1921", tab="humidity", section="co2", minimum=400, maximum=750, step=50, unit="ppm", when="co2",
    ),
    _number(
        "ctrl_co2_high", 1922, "CO₂: grænse høj", "CO₂: high limit",
        "Over denne værdi køres det høje trin.",
        "Above this value the high step is used.",
        register="H1922", tab="humidity", section="co2", minimum=650, maximum=2500, step=50, unit="ppm", when="co2",
    ),
    _select(
        "ctrl_week", 500, "Aktivt ugeprogram", "Active week program",
        "Fabriksprogrammerne skifter trin og temperatur på faste tider. Program 3 stopper ventilationen på hverdage kl. 16. Slet (4) kan ikke vælges.",
        "The factory programs change step and temperature at fixed times. Program 3 stops ventilation on weekdays at 16:00. Erase (4) cannot be selected.",
        register="H500 Program.Select", tab="week", section="week", choices=_WEEK, risk="medium",
        high_raw=(3,), icon="mdi:calendar-clock",
    ),
    _button(
        "ctrl_reset_alarm", ALARM_RESET_ADDRESS, "Nulstil én alarm", "Reset one alarm",
        "Kvitterer én alarm. Kun inaktive alarmer kan nulstilles. Koden er 100 plus alarmnummeret.",
        "Acknowledges one alarm. Only inactive alarms can be reset. The code is 100 plus the alarm number.",
        register="H400 Alarm.Reset", tab="filter", section="alarms", fixed_raw=None, risk="low", icon="mdi:bell-cancel",
    ),
    _button(
        "ctrl_reset_all", ALARM_RESET_ADDRESS, "Nulstil alle alarmer", "Reset all alarms",
        "Kvitterer alle alarmer på én gang.",
        "Acknowledges every alarm at once.",
        register="H400 Alarm.Reset", tab="filter", section="alarms", fixed_raw=255, risk="medium", icon="mdi:bell-off",
    ),
    _button(
        "ctrl_reset_filter", ALARM_RESET_ADDRESS, "Filter skiftet", "Filter changed",
        "Kvitterer filteralarmen (kode 19) efter et filterskift. Uden aktiv alarm kan tælleren ikke nulstilles på protokol 9.",
        "Acknowledges the filter alarm (code 19) after a filter change. Without an active alarm the counter cannot be reset on protocol 9.",
        register="H400 Alarm.Reset", tab="filter", section="filter", fixed_raw=119, risk="low", icon="mdi:air-filter",
    ),
    _button(
        "ctrl_sync_clock", CLOCK_ADDRESS, "Synkronisér ur med HA", "Synchronise clock with HA",
        "Sætter regulatorens ur til Home Assistants tid. Uret skifter ikke selv til sommertid og styrer ugeprogram og alarmtider.",
        "Sets the controller clock to Home Assistant's time. The clock does not follow daylight saving by itself and it drives the week program and alarm times.",
        register="H300–H305", tab="service", section="clock", fixed_raw=None, risk="low", count=6, icon="mdi:clock-check",
    ),
)

SETTINGS_BY_KEY = {item.key: item for item in SETTINGS}

# The 24 points available on the owner's unit without extra hardware.
OWNER_POINT_KEYS = (
    "ctrl_run",
    "ctrl_mode",
    "ctrl_fan_step",
    "ctrl_temperature",
    "ctrl_user1_function",
    "ctrl_user1_time",
    "ctrl_user1_step",
    "ctrl_user1_temp",
    "ctrl_user1_start",
    "ctrl_supply_min_summer",
    "ctrl_supply_min_winter",
    "ctrl_summer_limit",
    "ctrl_cool_vent",
    "ctrl_cool_set",
    "ctrl_night_day",
    "ctrl_night_set",
    "ctrl_rh_low",
    "ctrl_rh_limit",
    "ctrl_rh_high",
    "ctrl_rh_time",
    "ctrl_week",
    "ctrl_reset_all",
    "ctrl_reset_filter",
    "ctrl_sync_clock",
)

EXPERIMENTAL_KEYS = tuple(item.key for item in SETTINGS if item.experimental)


def setting_for(key: str) -> Setting:
    """Return one setting or reject an unknown key."""

    try:
        return SETTINGS_BY_KEY[key]
    except KeyError as err:
        raise WriteRejected(f"Unknown setting {key}") from err


def setting_visible(spec: Setting, plant: dict, *, protocol: int) -> bool:
    """False when the plant toggle or the protocol hides the setting."""

    if protocol != 9:
        return False
    if spec.experimental and not plant.get("experimental"):
        return False
    if spec.when == "reheater":
        return plant.get("reheater") not in (None, "none")
    if spec.when == "options_board":
        return bool(plant.get("options_board"))
    if spec.when == "co2":
        return bool(plant.get("co2"))
    return True


def iter_settings(plant: dict, *, protocol: int) -> list[Setting]:
    """Settings that become entities for this plant."""

    return [item for item in SETTINGS if setting_visible(item, plant, protocol=protocol)]


def choices_for(spec: Setting, plant: dict) -> tuple[Choice, ...]:
    """Drop the external-offset choice unless an option board is fitted."""

    if spec.address in (601, 611) and not plant.get("options_board"):
        return tuple(choice for choice in spec.choices if choice.raw != 4)
    return spec.choices


def _signed(raw: int) -> int:
    value = int(raw) & 0xFFFF
    if value >= 0x8000:
        return value - 0x10000
    return value


def _to_raw_signed(value: int) -> int:
    if value < 0:
        return value + 0x10000
    return value


def decode_raw(spec: Setting, raw: int) -> float | str | None:
    """Engineering value or choice slug from one register word."""

    if spec.kind == "select":
        for choice in spec.choices:
            if choice.raw == (int(raw) & 0xFFFF):
                return choice.slug
        return None
    if spec.kind != "number":
        return None
    number = _signed(raw) if spec.signed else int(raw) & 0xFFFF
    value = number * spec.scale
    if spec.scale < 1:
        return round(value, 2)
    return float(int(round(value)))


def _quantize(spec: Setting, value: float) -> int:
    if spec.special == "user_time":
        minutes = int(round(float(value)))
        if minutes != 0 and not (15 <= minutes <= 480 and minutes % 15 == 0):
            raise RangeError("Brugervalg-tid skal være 0 eller 15–480 minutter i spring på 15")
        return minutes
    if spec.minimum is None or spec.maximum is None or spec.step is None:
        raise RangeError(f"{spec.key} has no numeric range")
    number = float(value)
    if number < spec.minimum - 1e-9 or number > spec.maximum + 1e-9:
        raise RangeError(f"{spec.name_da} skal være {spec.minimum:g}–{spec.maximum:g} {spec.unit}".strip())
    steps = round((number - spec.minimum) / spec.step)
    snapped = spec.minimum + steps * spec.step
    if abs(snapped - number) > max(1e-6, spec.step / 100):
        raise RangeError(f"{spec.name_da} skal følge trin {spec.step:g}")
    raw = int(round(snapped / spec.scale))
    if spec.signed:
        return _to_raw_signed(raw)
    if raw < 0 or raw > 0xFFFF:
        raise RangeError(f"{spec.name_da} er uden for registeret")
    return raw


def encode_setting(spec: Setting, value, plant: dict) -> list[int]:
    """Raw FC16 words for one user value. Clock words are passed through."""

    if spec.kind == "button" and spec.key == "ctrl_sync_clock":
        if not isinstance(value, (list, tuple)) or len(value) != 6:
            raise RangeError("Uret skrives som seks værdier: sek, min, time, dag, måned, år")
        words = [int(item) & 0xFFFF for item in value]
        second, minute, hour, day, month, year = words
        if not (0 <= second <= 59 and 0 <= minute <= 59 and 0 <= hour <= 23):
            raise RangeError("Klokkeslættet er ugyldigt")
        if not (1 <= day <= 31 and 1 <= month <= 12 and 0 <= year <= 99):
            raise RangeError("Datoen er ugyldig")
        return words
    if spec.kind == "button" and spec.key == "ctrl_reset_alarm":
        code = int(value)
        if not 1 <= code <= 99:
            raise RangeError("Alarmkoden skal være 1–99")
        return [100 + code]
    if spec.kind == "button":
        if spec.fixed_raw is None:
            raise RangeError(f"{spec.key} has no fixed value")
        return [int(spec.fixed_raw)]
    if spec.kind == "select":
        allowed = choices_for(spec, plant)
        for choice in allowed:
            if choice.slug == value or choice.raw == value:
                return [choice.raw]
        raise RangeError(f"{value} er ikke et gyldigt valg for {spec.name_da}")
    return [_quantize(spec, float(value))]


def risk_for(spec: Setting, raw_words: list[int]) -> str:
    """High when this particular value can stop the unit."""

    if raw_words and raw_words[0] in spec.high_raw:
        return "high"
    return spec.risk


def _engineering(spec: Setting | None, holdings: dict[int, int]) -> float | None:
    if spec is None or spec.address not in holdings or spec.kind != "number":
        return None
    decoded = decode_raw(spec, holdings[spec.address])
    if isinstance(decoded, (int, float)):
        return float(decoded)
    return None


def _other(address: int) -> Setting | None:
    for item in SETTINGS:
        if item.address == address and item.kind == "number":
            return item
    return None


def check_dependencies(spec: Setting, raw_words: list[int], holdings: dict[int, int]) -> None:
    """Reject pairs that the panel itself will not store."""

    if spec.kind != "number" or not raw_words:
        return
    proposed = decode_raw(spec, raw_words[0])
    if not isinstance(proposed, (int, float)):
        return
    proposed = float(proposed)
    pairs = {1201: 1203, 1203: 1201, 1202: 1204, 1204: 1202}
    other_address = pairs.get(spec.address)
    if other_address is not None:
        other = _engineering(_other(other_address), holdings)
        if other is not None:
            low, high = (proposed, other) if spec.address in (1201, 1202) else (other, proposed)
            if low > high + 1e-9:
                raise DependencyError("Min. indblæsning skal være mindre end eller lig med maks. indblæsning")
    if spec.address == 1921 and 1922 in holdings and proposed >= int(holdings[1922]):
        raise DependencyError("CO₂ normal skal være lavere end CO₂ høj")
    if spec.address == 1922 and 1921 in holdings and proposed <= int(holdings[1921]):
        raise DependencyError("CO₂ høj skal være højere end CO₂ normal")


def plan_write(key: str, value, *, plant: dict, protocol: int, holdings: dict[int, int]) -> tuple[Setting, list[int]]:
    """Validate one change and return the setting plus raw words."""

    spec = setting_for(key)
    if not setting_visible(spec, plant, protocol=protocol):
        if protocol != 9:
            raise WriteRejected("Skrivning er kun tilladt på Modbus-protokol 9")
        if spec.experimental and not plant.get("experimental"):
            raise WriteRejected("Eksperimentelle registre er slået fra")
        raise WriteRejected(f"{spec.name_da} er ikke aktiv for dette anlæg")
    words = encode_setting(spec, value, plant)
    check_dependencies(spec, words, holdings)
    return spec, words


def describe_value(spec: Setting, value) -> str:
    """Short Danish text for the log and the confirm dialog."""

    if spec.kind == "select":
        for choice in spec.choices:
            if choice.slug == value or choice.raw == value:
                return choice.label_da
    if spec.kind == "number" and isinstance(value, (int, float)):
        number = float(value)
        text = f"{number:g}".replace(".", ",")
        if spec.special == "humidity_time" and number == 0:
            return "Ingen grænse"
        return f"{text} {spec.unit}".strip()
    if spec.key == "ctrl_reset_alarm":
        return f"alarm {value}"
    if spec.key == "ctrl_reset_all":
        return "alle alarmer"
    if spec.key == "ctrl_reset_filter":
        return "filteralarm"
    if spec.key == "ctrl_sync_clock":
        return "uret"
    return str(value)

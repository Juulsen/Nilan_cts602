// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* UI catalog for the settings tabs. The Python allowlist is the authority. */
(function (root) {
  const onOff = [['off', 'Fra', 'Off'], ['on', 'Til', 'On']];
  const mode = [['heat', 'Varme', 'Heat'], ['cool', 'Køl', 'Cool'], ['auto', 'Auto', 'Auto']];
  const user = [['none', 'Fra', 'Off'], ['extend', 'Forlæng', 'Extend'], ['inlet', 'Indblæs', 'Supply'], ['exhaust', 'Udsug', 'Extract'], ['external_heater_offset', 'Ekst. offset', 'External offset'], ['ventilate', 'Ventilation', 'Ventilate'], ['cooker_hood', 'Emhætte', 'Cooker hood']];
  const coolVent = [['off', 'Fra', 'Off'], ['2', '2', '2'], ['3', '3', '3'], ['4', '4', '4']];
  const coolSet = [['off', 'Fra (ingen køling)', 'Off'], ['plus_0', '+0 K', '+0 K'], ['plus_1', '+1 K', '+1 K'], ['plus_2', '+2 K', '+2 K'], ['plus_3', '+3 K', '+3 K'], ['plus_4', '+4 K', '+4 K'], ['plus_5', '+5 K', '+5 K'], ['plus_7', '+7 K', '+7 K'], ['plus_10', '+10 K', '+10 K']];
  const rhLow = [['off', 'Fra', 'Off'], ['1', '1', '1'], ['2', '2', '2'], ['3', '3', '3']];
  const rhHigh = [['off', 'Fra', 'Off'], ['2', '2', '2'], ['3', '3', '3'], ['4', '4', '4']];
  const week = [['none', 'Intet', 'None'], ['program_1', 'Udearbejdende', 'Away at work'], ['program_2', 'Hjemmegående', 'Home during the day'], ['program_3', 'Erhverv', 'Commercial']];

  function row(key, tab, section, kind, da, en, explainDa, explainEn, extra) {
    return Object.assign({
      key, tab, section, kind, name: [da, en], explain: [explainDa, explainEn], help: [explainDa, explainEn],
    }, extra);
  }

  const SETTINGS = [
    row('ctrl_run', 'operation', 'drift', 'select', 'Anlæg tændt', 'Unit on', 'Slukker hele ventilationen. Nilan fraråder stop, fordi fugt kan kondensere i kanaler og aggregat.', 'Switches the whole ventilation off. Nilan advises against stopping, because moisture can condense in the ducts and the unit.', { options: onOff, risk: 'medium', high: ['off'], register: 'H1001 RunSet', address: 1001, range: '0 fra, 1 til' }),
    row('ctrl_mode', 'operation', 'drift', 'select', 'Driftsform', 'Operating mode', 'Auto åbner og lukker bypass efter temperaturen. Varme holder bypass lukket. Køl åbner den, når udeluften er koldere end fraluften.', 'Auto opens and closes the bypass from the temperatures. Heat keeps the bypass closed. Cool opens it when outdoor air is colder than extract air.', { options: mode, risk: 'medium', register: 'H1002 ModeSet', address: 1002, range: '1 Varme, 2 Køl, 3 Auto' }),
    row('ctrl_fan_step', 'operation', 'step', 'number', 'Ventilationstrin', 'Fan step', 'Luftmængden. Trinnet gælder udsugningen. Trin 1 er lavest, 4 højest. Fugt og brugervalg kan midlertidigt hæve trinnet.', 'Airflow. The step applies to the extract fan. Step 1 is lowest, 4 is highest.', { min: 1, max: 4, step: 1, risk: 'medium', register: 'H1003 VentSet', address: 1003, range: '1–4 · trin 1' }),
    row('ctrl_user1_function', 'operation', 'user1', 'select', 'Brugervalg 1 – funktion', 'User function 1 – action', 'Hvad der sker, når brugervalg aktiveres fra en knap, en kontakt eller Start her.', 'What happens when the user function is started from a button, a contact or Start here.', { options: user, risk: 'medium', register: 'H601 UserFuncSet', address: 601, range: '0–6' }),
    row('ctrl_user1_time', 'operation', 'user1', 'number', 'Brugervalg 1 – varighed', 'User function 1 – duration', 'Hvor længe funktionen kører efter et tryk (maks. 8 timer). 0 betyder så længe kontakten er sluttet.', 'How long the function runs after a press (maximum 8 hours). 0 means as long as the contact is closed.', { min: 0, max: 480, step: 15, unit: 'min', risk: 'low', register: 'H602 UserTimeSet', address: 602, range: '0 eller 15–480 min · trin 15' }),
    row('ctrl_user1_step', 'operation', 'user1', 'number', 'Brugervalg 1 – trin', 'User function 1 – step', 'Ventilationstrin mens brugervalget kører. Stop vises ikke, fordi det ville slukke anlægget.', 'Fan step while the user function runs. Off is hidden, because it would stop the unit.', { min: 1, max: 4, step: 1, risk: 'medium', register: 'H603 UserVentSet', address: 603, range: '1–4' }),
    row('ctrl_user1_temp', 'operation', 'user1', 'number', 'Brugervalg 1 – temperatur', 'User function 1 – temperature', 'Ønsket rumtemperatur, mens Forlæng kører. Skalaen er ikke bekræftet på dette anlæg.', 'Wanted room temperature while Extend is running. The scale is not confirmed on this unit.', { min: 5, max: 30, step: 1, unit: '°C', risk: 'low', experimental: true, register: 'H604 UserTempSet', address: 604, range: '5–30 °C · trin 1' }),
    row('ctrl_user1_start', 'operation', 'user1', 'select', 'Brugervalg 1 – start/stop', 'User function 1 – start/stop', 'Starter brugervalget nu. Skrivning til H600 testes kun når Eksperimentel er slået til.', 'Starts the user function now. Writing H600 is only tried when Experimental is on.', { options: onOff, risk: 'medium', experimental: true, register: 'H600 UserFuncAct', address: 600, range: '0 stop, 1 start' }),
    row('ctrl_user2_function', 'operation', 'user2', 'select', 'Brugervalg 2 – funktion', 'User function 2 – action', 'Samme valg som brugervalg 1, via indgang S7 på optionsprintet.', 'Same choices as user function 1, through input S7 on the option board.', { options: user, risk: 'medium', when: 'options_board', register: 'H611', address: 611, range: '0–6' }),
    row('ctrl_user2_time', 'operation', 'user2', 'number', 'Brugervalg 2 – varighed', 'User function 2 – duration', 'Hvor længe brugervalg 2 kører. 0 betyder så længe kontakten er sluttet.', 'How long user function 2 runs. 0 means as long as the contact is closed.', { min: 0, max: 480, step: 15, unit: 'min', risk: 'low', when: 'options_board', register: 'H612', address: 612, range: '0 eller 15–480 min' }),
    row('ctrl_user2_step', 'operation', 'user2', 'number', 'Brugervalg 2 – trin', 'User function 2 – step', 'Ventilationstrin mens brugervalg 2 kører.', 'Fan step while user function 2 runs.', { min: 1, max: 4, step: 1, risk: 'medium', when: 'options_board', register: 'H613', address: 613, range: '1–4' }),
    row('ctrl_user2_temp', 'operation', 'user2', 'number', 'Brugervalg 2 – temperatur', 'User function 2 – temperature', 'Ønsket rumtemperatur mens Forlæng kører på brugervalg 2. Skalaen er ikke bekræftet.', 'Wanted room temperature while Extend runs on user function 2. The scale is not confirmed.', { min: 5, max: 30, step: 1, unit: '°C', experimental: true, when: 'options_board', register: 'H614', address: 614, range: '5–30 °C' }),
    row('ctrl_user2_start', 'operation', 'user2', 'select', 'Brugervalg 2 – start/stop', 'User function 2 – start/stop', 'Starter brugervalg 2. Skrivning er ikke dokumenteret.', 'Starts user function 2. Writing is undocumented.', { options: onOff, risk: 'medium', experimental: true, when: 'options_board', register: 'H610', address: 610, range: '0 stop, 1 start' }),
    row('ctrl_ext_offset', 'operation', 'user2', 'number', 'Ekstern varme-offset', 'External heat offset', 'Forskyder setpunktet for den eksterne radiator. Kun med optionsprint.', 'Shifts the setpoint of the external radiator. Option board only.', { min: -10, max: 10, step: 1, unit: '°C', experimental: true, when: 'options_board', register: 'H605', address: 605, range: '−10…+10 °C' }),
    row('ctrl_ext_offset_2', 'operation', 'user2', 'number', 'Ekstern varme-offset (brugervalg 2)', 'External heat offset (user function 2)', 'Samme offset for brugervalg 2.', 'The same offset for user function 2.', { min: -10, max: 10, step: 1, unit: '°C', experimental: true, when: 'options_board', register: 'H615', address: 615, range: '−10…+10 °C' }),
    row('ctrl_temperature', 'temperature', 'room', 'number', 'Ønsket rumtemperatur', 'Wanted room temperature', 'Den temperatur anlægget styrer mod med bypass. Den måles af T3 (fraluft), fordi T15-panelet sidder på loftet.', 'The temperature the unit steers towards with the bypass. It is measured by T3, because the T15 panel is in the loft.', { min: 5, max: 30, step: 0.5, unit: '°C', risk: 'medium', register: 'H1004 TempSet', address: 1004, range: '5–30 °C · trin 0,5 · standard 21 °C' }),
    row('ctrl_supply_min_summer', 'temperature', 'supply', 'number', 'Min. indblæsning sommer', 'Minimum supply, summer', 'Koldeste luft der må blæses ind om sommeren. Bliver den koldere, lukker bypass.', 'Coldest air that may be supplied in summer. If it gets colder, the bypass closes.', { min: 5, max: 20, step: 1, unit: '°C', risk: 'low', register: 'H1201', address: 1201, range: '5–20 °C · trin 1 · standard 14 °C' }),
    row('ctrl_supply_min_winter', 'temperature', 'supply', 'number', 'Min. indblæsning vinter', 'Minimum supply, winter', 'Koldeste luft der må blæses ind om vinteren. Bliver indblæsningen koldere, lukker bypass.', 'Coldest air that may be supplied in winter. If the supply gets colder, the bypass closes.', { min: 5, max: 20, step: 1, unit: '°C', risk: 'low', register: 'H1202', address: 1202, range: '5–20 °C · trin 1 · standard 16 °C' }),
    row('ctrl_supply_max_summer', 'temperature', 'supply', 'number', 'Maks. indblæsning sommer', 'Maximum supply, summer', 'Varmeste indblæsning om sommeren. Vises kun når en eftervarmer er monteret.', 'Warmest supply air in summer. Shown only when a reheater is fitted.', { min: 15, max: 30, step: 1, unit: '°C', risk: 'low', when: 'reheater', register: 'H1203', address: 1203, range: '15–30 °C · trin 1' }),
    row('ctrl_supply_max_winter', 'temperature', 'supply', 'number', 'Maks. indblæsning vinter', 'Maximum supply, winter', 'Varmeste indblæsning om vinteren. Kun med eftervarmer.', 'Warmest supply air in winter. Reheater only.', { min: 15, max: 30, step: 1, unit: '°C', risk: 'low', when: 'reheater', register: 'H1204', address: 1204, range: '15–30 °C · trin 1' }),
    row('ctrl_summer_limit', 'temperature', 'season', 'number', 'Sommer/vinter-grænse', 'Summer/winter limit', 'Over denne udetemperatur bruges sommergrænserne, under den vintergrænserne.', 'Above this outdoor temperature the summer limits are used, below it the winter limits.', { min: 5, max: 30, step: 1, unit: '°C', risk: 'low', register: 'H1205', address: 1205, range: '5–30 °C · trin 1 · standard 12 °C' }),
    row('ctrl_cool_vent', 'temperature', 'cooling', 'select', 'Køling: ventilationstrin', 'Cooling: fan step', 'Hæver trinnet automatisk, mens anlægget køler via bypass. Registeret er ikke bekræftet på Comfort.', 'Raises the step automatically while the unit cools through the bypass. Not confirmed on Comfort.', { options: coolVent, risk: 'low', experimental: true, register: 'H1101 CoolVent', address: 1101, range: 'Fra, 2, 3, 4' }),
    row('ctrl_cool_set', 'temperature', 'cooling', 'select', 'Køling: setpunkt', 'Cooling: setpoint', 'Hvor mange grader over ønsket temperatur huset må blive, før bypass åbner for køling. Bypass kan stadig åbne efter min. indblæsning.', 'How many degrees above the wanted temperature the house may get before the bypass opens for cooling. The bypass can still open from the minimum supply limit.', { options: coolSet, risk: 'medium', experimental: true, register: 'H1200 CoolSet', address: 1200, range: 'Fra, +0…+10 K' }),
    row('ctrl_night_day', 'temperature', 'night', 'number', 'Natkøling: dag-grænse', 'Night cooling: day limit', 'Udetemperatur om dagen, der skal nås, før natkøling kan starte næste nat. 0 betyder sandsynligvis fra.', 'Outdoor temperature during the day that must be reached before night cooling can start the next night. 0 probably means off.', { min: 0, max: 30, step: 1, unit: '°C', experimental: true, register: 'H1206 NightDayLim', address: 1206, range: '0–30 °C · trin 1' }),
    row('ctrl_night_set', 'temperature', 'night', 'number', 'Natkøling: rumsetpunkt', 'Night cooling: room setpoint', 'Rumtemperatur natkølingen køler ned til.', 'Room temperature night cooling cools down to.', { min: 10, max: 30, step: 1, unit: '°C', experimental: true, register: 'H1207 NightSet', address: 1207, range: '10–30 °C · trin 1' }),
    row('ctrl_rh_low', 'humidity', 'humidity', 'select', 'Lavt trin ved tør luft', 'Low step in dry air', 'Om vinteren går anlægget ned på dette trin, når fugten er under grænsen.', 'In winter the unit drops to this step when humidity is below the limit.', { options: rhLow, risk: 'low', register: 'H1910 RH_VentLo', address: 1910, range: 'Fra, 1, 2, 3' }),
    row('ctrl_rh_limit', 'humidity', 'humidity', 'number', 'Grænse for tør luft', 'Dry-air limit', 'Under denne relative fugt bruges det lave trin (kun vinter).', 'Below this relative humidity the low step is used (winter only).', { min: 15, max: 45, step: 1, unit: '%', risk: 'low', register: 'H1912 RH_LimLo', address: 1912, range: '15–45 % · trin 1 · standard 30 %' }),
    row('ctrl_rh_high', 'humidity', 'humidity', 'select', 'Højt trin ved fugt', 'High step when humid', 'Ved en pludselig fugtstigning skifter anlægget til dette trin. Fugten sammenlignes med døgnmidlet.', 'On a sudden rise in humidity the unit changes to this step. Humidity is compared with the daily average.', { options: rhHigh, risk: 'low', register: 'H1911 RH_VentHi', address: 1911, range: 'Fra, 2, 3, 4' }),
    row('ctrl_rh_time', 'humidity', 'humidity', 'number', 'Maks. tid på højt trin', 'Maximum time on the high step', 'Hvor længe fugt-boost højst må køre. 0 vises som ingen grænse.', 'The longest a humidity boost may run. 0 is shown as no limit.', { min: 0, max: 180, step: 5, unit: 'min', risk: 'low', register: 'H1913 RH_TimeOut', address: 1913, range: '0–180 min · trin 5' }),
    row('ctrl_co2_step', 'humidity', 'co2', 'select', 'CO₂: højt trin', 'CO₂: high step', 'Trinnet ved højt CO₂. Kun når en CO₂-føler er monteret.', 'The step used at high CO₂. Only when a CO₂ sensor is fitted.', { options: rhHigh, risk: 'low', when: 'co2', register: 'H1920', address: 1920, range: 'Fra, 2, 3, 4' }),
    row('ctrl_co2_low', 'humidity', 'co2', 'number', 'CO₂: grænse normal', 'CO₂: normal limit', 'Under denne værdi går anlægget tilbage til normalt trin. Skal være lavere end den høje grænse.', 'Below this value the unit returns to the normal step. It must be lower than the high limit.', { min: 400, max: 750, step: 50, unit: 'ppm', risk: 'low', when: 'co2', register: 'H1921', address: 1921, range: '400–750 ppm · trin 50' }),
    row('ctrl_co2_high', 'humidity', 'co2', 'number', 'CO₂: grænse høj', 'CO₂: high limit', 'Over denne værdi køres det høje trin.', 'Above this value the high step is used.', { min: 650, max: 2500, step: 50, unit: 'ppm', risk: 'low', when: 'co2', register: 'H1922', address: 1922, range: '650–2500 ppm · trin 50' }),
    row('ctrl_week', 'week', 'week', 'select', 'Aktivt ugeprogram', 'Active week program', 'Fabriksprogrammerne skifter trin og temperatur på faste tider. Program 3 stopper ventilationen på hverdage kl. 16. Slet kan ikke vælges.', 'The factory programs change step and temperature at fixed times. Program 3 stops ventilation on weekdays at 16:00. Erase cannot be selected.', { options: week, risk: 'medium', high: ['program_3'], register: 'H500 Program.Select', address: 500, range: '0–3' }),
    row('ctrl_reset_all', 'filter', 'alarms', 'button', 'Nulstil alle alarmer', 'Reset all alarms', 'Kvitterer alle alarmer på én gang.', 'Acknowledges every alarm at once.', { risk: 'medium', register: 'H400 Alarm.Reset', address: 400, range: '255' }),
    row('ctrl_reset_filter', 'filter', 'filter', 'button', 'Filter skiftet', 'Filter changed', 'Kvitterer filteralarmen efter et filterskift. Uden aktiv alarm kan tælleren ikke nulstilles på protokol 9.', 'Acknowledges the filter alarm after a filter change. Without an active alarm the counter cannot be reset on protocol 9.', { risk: 'low', register: 'H400 Alarm.Reset', address: 400, range: '119' }),
    row('ctrl_sync_clock', 'service', 'clock', 'button', 'Synkronisér ur med HA', 'Synchronise clock with HA', 'Sætter regulatorens ur til Home Assistants tid. Uret skifter ikke selv til sommertid.', 'Sets the controller clock to Home Assistant time. The clock does not follow daylight saving by itself.', { risk: 'low', register: 'H300–H305', address: 300, range: 'FC16 count 6' }),
  ];

  const TABS = [
    ['overview', 'Overblik', 'Overview'],
    ['operation', 'Drift & trin', 'Run & step'],
    ['temperature', 'Temperatur & bypass', 'Temperature & bypass'],
    ['humidity', 'Fugt & luftkvalitet', 'Humidity & air quality'],
    ['week', 'Ugeprogram', 'Week program'],
    ['filter', 'Filter & alarmer', 'Filter & alarms'],
    ['service', 'Service & konfiguration', 'Service & configuration'],
  ];

  const SECTIONS = {
    drift: ['Drift', 'Run'],
    step: ['Ventilationstrin', 'Fan step'],
    user1: ['Brugervalg 1', 'User function 1'],
    user2: ['Brugervalg 2', 'User function 2'],
    room: ['Rumtemperatur', 'Room temperature'],
    supply: ['Indblæsningsgrænser', 'Supply limits'],
    season: ['Sommer / vinter', 'Summer / winter'],
    cooling: ['Køling via bypass', 'Cooling through the bypass'],
    night: ['Natkøling', 'Night cooling'],
    humidity: ['Fugtstyring', 'Humidity control'],
    co2: ['CO₂', 'CO₂'],
    week: ['Aktivt program', 'Active program'],
    filter: ['Filter', 'Filter'],
    alarms: ['Aktive alarmer', 'Active alarms'],
    clock: ['Ur', 'Clock'],
  };

  const WEEK_TEXT = [
    ['Udearbejdende', 'Away at work', 'Hverdage: højere trin morgen og eftermiddag, lavt trin mens boligen er tom. Weekend: højere trin om dagen.'],
    ['Hjemmegående', 'Home during the day', 'Højere trin om dagen og lavere trin om natten, alle ugens dage.'],
    ['Erhverv', 'Commercial', 'Hverdage: ventilation i arbejdstiden. Programmet stopper ventilationen hverdage kl. 16. Det kræver ekstra bekræftelse.'],
  ];

  const UNAVAILABLE = [
    ['Filterinterval 30/90/180/360', 'H1105 kræver protokol 19. Kortet viser intervallet som dage siden plus dage til.'],
    ['Nulstil filtertæller uden alarm', 'På protokol 9 kan tælleren kun nulstilles ved at kvittere alarm 19.'],
    ['Luftskifte ved lav udetemperatur', 'H4003/H4002 kræver protokol 11.'],
    ['Varmeflade til/fra', 'H4013 findes ikke på protokol 9. Frostsikring er altid aktiv.'],
    ['Forvarmer, afrimning og temperatur', 'H4111/H4112 kræver protokol 19. Kun status H127 kan læses.'],
    ['Rediger ugeprogrammets tider', 'H4030–H4036 kan ikke læses sikkert. Kun valg af program 0–3.'],
    ['Rumføler-valg T15/T10/T3', 'H1208 kræver en nyere protokol. Vælges i service-menuen på panelet.'],
    ['Ventilatorprocent pr. trin', 'H4100–H4107 kræver protokol 19.'],
    ['Bypass-position som tal', 'I3000 kræver protokol 11. Positionen følger H102/H103.'],
  ];

  function visible(item, plant) {
    if (item.experimental && !plant.experimental) return false;
    if (item.when === 'reheater') return plant.reheater && plant.reheater !== 'none';
    if (item.when === 'options_board') return !!plant.options_board;
    if (item.when === 'co2') return !!plant.co2;
    return true;
  }

  root.NilanSettings = { SETTINGS, TABS, SECTIONS, WEEK_TEXT, UNAVAILABLE, visible };
})(typeof globalThis === 'undefined' ? window : globalThis);

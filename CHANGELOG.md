# Changelog

All notable changes to **Nilan CTS602 by Juulsen** are documented in this file.

The project follows [Semantic Versioning](https://semver.org/). During the pre-1.0 development phase, minor releases can add entities and dashboard behaviour while the hardware interface is being verified.

## [0.6.0] - 2026-10-07

- The overview drawing scales to the card width (`width: 100%`, height auto, `preserveAspectRatio` meet), including portrait widths from 320 px to 699 px.
- Overblik uses the locked v2 drawings: udeluft and afkast have swapped, the extract fan sits on the afkast duct, and the exchanger is the octagon "Modstrømsveksler". The SVG files are embedded unchanged. Live values are placed from the boxes in those files. The preheater symbol, its label and its status box follow the new coordinates. Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.6.0`.

## [0.5.5] - 2026-10-07

- Overblik draws the preheater and reheater symbols, their labels and their status boxes only when the plant options say that heater is installed. The default is not installed. A sensor that exists, or a register that reads off ("Fra"), does not add a heater. Landscape and portrait use the same rule, including the optional text and frame images. With no heaters fitted, the base drawings stay unchanged. Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.5.5`.
- Service & konfiguration keeps an unchecked equipment box off. Saving Udstyr no longer turns a cleared preheater, reheater, CO₂ or option-board flag back on from the previous reheater value. Electric and water reheater still exclude each other.

## [0.5.4] - 2026-10-07

- Overblik uses the supplied ventilation drawings as the base layer, unchanged. Live values sit in the boxes already drawn on those drawings. Landscape (`ventilation-anlaeg`) is used when the card is at least 700 px wide, and portrait (`ventilation-mobil`) below that. The choice follows the card width. Optional preheater and reheater symbols use the plant options and the positions from the drawing notes. Tapping a value opens the Home Assistant more-info dialog. Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.5.4`.

## [0.5.3] - 2026-10-07

- fix: dashboard jumps/refreshes while scrolling

## [0.5.2] - 2026-10-04

- The overview follows the edited drawing. The filters form an inverted V over the exchanger. The flow lines, the CTS 602 tag, the exchanger name plate, the filter names and the fan names are gone. The hexagon and its hatch stay. Bypass reads "Bypass", with the state on the line below, and the damper sits under the filter apex. The sensor badges and the fans use the positions from that drawing. A vertical split runs through the housing in the theme split colour. On a wide screen the T15 panel is shorter and the temperature sits beside the label. Fan speed stays above each fan. The fans still spin with the speed. On a narrow screen that speed is 16px.
- Every diagram value uses a theme colour, including the T15 temperature in dark mode.
- Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.5.2`. A Home Assistant restart is required.

## [0.5.1] - 2026-10-04

- Stored plant options migrate from version 1 to version 2 when Home Assistant starts. `async_migrate_entry` is a module-level function, which is the function Home Assistant calls. The config entry version stays 1.2. A version 1 plant gains separate reheater toggles, the option board and the experimental flag. The room entity and the other option keys are kept. Entries that are already 1.2 are left as they are.
- Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.5.1`. A Home Assistant restart is required.

## [0.5.0] - 2026-10-04

- The overview follows the approved principle drawing. Grey ducts and large arrows enter and leave the housing. A horizontal line splits the housing. Two thin G4 filter panels stay inside the upper half: the outdoor filter slants from the hexagon's upper-left down to the left side of the centre line, and the extract filter mirrors it. The bypass name sits above the housing with a short leader to the damper. The exchanger name sits on a plate in the lower half of the hexagon, clear of the crossing. The counterflow exchanger is a cross-hatched hexagon with a CTS 602 tag. Blue outdoor air runs through the hexagon and leaves as orange supply air, and red extract air runs through it and leaves as purple exhaust air. Sensor circles sit on those lines. It is not a rotary wheel.
- `theme` stays `light`, `dark` or `auto`. `auto` follows Home Assistant dark mode. Every fill, stroke and label in the diagram uses those theme colours, including the housing, the four temperature boxes and the efficiency and T15 plaques. Labels sit clear of ducts, filters, fans and the bypass damper. On a narrow screen the drawing fills the card, the status line shortens, the tabs scroll with an edge fade, and the values sit in the grid below.
- Equipment toggles default to off: electric preheater, electric reheater, water reheater (the two reheaters exclude each other), option board and CO₂. Missing parts are not drawn and do not create entities. Plant options migrate to version 2. T0 is the sensor on the controller board. T10 is an external room sensor.
- Settings tabs: Drift & trin, Temperatur & bypass, Fugt & luftkvalitet, Ugeprogram, Filter & alarmer, Service & konfiguration. Each setting has an explanation, the range and the register.
- Writes are allowlisted for protocol 9 and exposed as `number`, `select` and `button` entities so automations can use them. The card writes through those entities. Only an administrator can save from the card. A confirm dialog shows the current value, the new value, the register and the risk. High risk needs an extra checkbox. The coordinator writes FC16 under the existing gateway lock, waits 0.5 s, reads the register back and logs the change. The six unconfirmed registers stay behind Experimental, which is off by default. The room setpoint step is 0.5 °C.
- A successful write is also recorded in the Home Assistant logbook when that integration is installed. Logbook is an after-dependency, not required for the ventilation card itself.
- Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.5.0`. A Home Assistant restart is required.

## [0.4.0] - 2026-10-03

- The overview is an industrial HMI: two straight ducts and a counterflow plate exchanger, with the bypass beside it. The exchanger spans both ducts. It is not a rotary wheel.
- The card defaults to the light HMI. `theme` is `light`, `dark` or `auto` (default `light`). `auto` follows Home Assistant dark mode.
- Heat recovery stays the exhaust-side value `(T3 − T4) / (T3 − T8)`. The plaque shows that percentage, and the bypass state is drawn on the exchanger, so a low summer value is read together with an open bypass.
- 24-hour graphs read `history/history_during_period` with `significant_changes_only: false` and unpack the compressed `{s, lu}` / `{s, lc}` rows. Sensors with a state class fall back to `recorder/statistics_during_period` (5-minute, then hour, mean). The empty-state sentence wraps inside the card and is shown only when the fetch returned no points.
- Still read-only. Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.4.0`

## [0.3.0] - 2026-10-03

- The overview is redrawn as a SCADA diagram: thick shaded ducts with elbows and flanges, animated flow in the bore, and a counterflow plate exchanger. The exchanger spans the ducts. The two air paths cross inside it and meet the ducts at the four corners.
- Outdoor air is blue, supply air is orange, extract air is salmon and exhaust air is grey. Round fan housings show percent and step. Filters show the days remaining. Humidity sits on the extract side.
- Bypass is a duct under the exchanger with a damper. The label is åben, lukket, seneste kendte, åbner… or lukker…. An unknown position has no label.
- A status panel under the diagram shows operating state, fan step, setpoint, summer mode, alarms, filter life, bypass, room temperature and T15.
- T15 is input register 215 scaled by 0.01 °C, the same register and scale as the CTS602 protocol and the veista integration. On this unit the panel is in the loft, so about 30 °C is that sensor and not the living room. The card and the entity say so. Preheater, reheater and T10 stay off the diagram unless they are fitted.
- Still read-only. Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.3.0`

## [0.2.1] - 2026-10-02

- The options flow can save the equipment step. A change to preheater, reheater, CO₂ or T10 is kept when the room step is saved.
- On protocol 9 the bypass position follows the last finished motor pulse. Holding 102 (H102) opens the damper and holding 103 (H103) closes it. Open stays open until a close pulse finishes, and the other way around.
- The last position is restored after a restart and shown as last known until the next pulse. While the motor runs the card says `Bypass åbner…` or `Bypass lukker…`. The two relays are diagnostic sensors.
- Card type, spacing and motion are tightened. Missing values are left out instead of showing “unavailable”. Fan spin follows fan speed, and reduced motion turns the animation off.
- Still read-only. Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.2.1`

## [0.2.0] - 2026-10-02

- Replaced the overview graphic with a P&ID schematic: thin ducts, small flow chevrons, and animated dashes while the fans run.
- Counterflow exchanger with crossing channels. The bypass is a damper on its own duct, drawn open or closed.
- Intake and extract each have a filter symbol. A filter alarm turns them red and shows the days remaining.
- Fan symbols show percent and step. Sensor tags sit on the ducts (`T8 Udeluft`, `T7 Indblæs`, `T3 Udsug`, `T4 Afkast`) and open history when tapped. Outdoor air on this Comfort is T8.
- The house shows the configured room temperature. Heat recovery is a tag on the exchanger. Preheater and reheater symbols appear only when configured.
- Still read-only. Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.2.0`

## [0.1.1] - 2026-10-02

- The counterflow diagram fits a 390px column. The house label stays inside the frame, and arrows show supply air moving into the home and extract air moving out.
- The highest point on each graph is named, for example `Maks Udsug 22,6 °C`, instead of a bare number.
- The card subtitle says `protokol 9` and the Modbus slave id. It no longer says `bus 9`.
- The bypass chip says `Bypass lukket` or `Bypass åben`, the same words as the diagram.
- Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.1.1`

## [0.1.0] - 2026-10-02

- First read-only release for a Nilan Comfort 300 LR with a CTS602 controller.
- Config flow for Modbus TCP, RTU over TCP and serial 19200 8E1. Setup reads model type, protocol and software, and accepts only Comfort (type 13).
- Plant options for preheater, reheater, CO₂, T10 and the room-temperature source. Missing hardware is not created as entities.
- Sensors for duct temperatures, humidity, fan speed and step, filter days, alarms, the controller clock, the panel display and both efficiency values.
- Binary sensors for running, summer, alarm, filter, bypass, defrost and user function. Preheater and reheater appear only when configured.
- Exhaust-side heat recovery is calculated from T3, T4 and T8 and hidden when T3−T8 is below 3 K. The controller's own value stays a separate sensor.
- Bypass on protocol 9 is latched from the damper relays so a pulse does not flicker. Protocol 11 and newer can use the position register.
- Requests on a shared gateway are serialized, with a pause between frames, retries and a 30 second default poll. Nothing is written to the controller.
- Dashboard card at `/nilan_cts602-static/nilan-card.js?v=0.1.0` with a counterflow diagram, interactive history, and the tabs Overblik, Alarmer, Filter and Indstillinger.
- Danish and English names. Writes, service mode, relay outputs and factory reset stay unavailable.

## [Unreleased]

- Writing setpoints, fan step and run mode is planned for a later version. It will use function code 16 with count 1, and only after an administrator confirms.

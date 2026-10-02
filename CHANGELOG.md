# Changelog

All notable changes to **Nilan CTS602** are documented in this file.

The project follows [Semantic Versioning](https://semver.org/). During the pre-1.0 development phase, minor releases can add entities and dashboard behaviour while the hardware interface is being verified.

## [0.2.1] - 2026-10-02

- The options flow can save the equipment step. A change to preheater, reheater, CO₂ or T10 is kept when the room step is saved.
- On protocol 9 the bypass position follows the last finished motor pulse. Holding 102 (H102) opens the damper and holding 103 (H103) closes it. Open stays open until a close pulse finishes, and the other way around.
- The last position is restored after a restart and shown as last known until the next pulse. While the motor runs the card says `Bypass åbner…` or `Bypass lukker…`. The two relays are diagnostic sensors.
- Card type, spacing and motion are tightened. Missing values are left out instead of showing “unavailable”. Fan spin follows fan speed, and reduced motion turns the animation off.
- Still read-only. Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.2.1`

## [0.2.0] - 2026-10-02

- Replaced the overview graphic with a P&ID schematic: thin ducts, small flow chevrons, and animated dashes while the fans run.
- Cross-flow exchanger is a diamond with crossing channels. The bypass is a damper on its own duct, drawn open or closed.
- Intake and extract each have a filter symbol. A filter alarm turns them red and shows the days remaining.
- Fan symbols show percent and step. Sensor tags sit on the ducts (`T8 Udeluft`, `T7 Indblæs`, `T3 Udsug`, `T4 Afkast`) and open history when tapped. Outdoor air on this Comfort is T8.
- The house shows the configured room temperature. Heat recovery is a tag on the exchanger. Preheater and reheater symbols appear only when configured.
- Still read-only. Dashboard resource: `/nilan_cts602-static/nilan-card.js?v=0.2.0`

## [0.1.1] - 2026-10-02

- The cross-flow diagram fits a 390px column. The house label stays inside the frame, and arrows show supply air moving into the home and extract air moving out.
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
- Dashboard card at `/nilan_cts602-static/nilan-card.js?v=0.1.0` with a cross-flow diagram, interactive history, and the tabs Overblik, Alarmer, Filter and Indstillinger.
- Danish and English names. Writes, service mode, relay outputs and factory reset stay unavailable.

## [Unreleased]

- Writing setpoints, fan step and run mode is planned for a later version. It will use function code 16 with count 1, and only after an administrator confirms.

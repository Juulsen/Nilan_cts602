# Changelog

All notable changes to **Nilan CTS602** are documented in this file.

The project follows [Semantic Versioning](https://semver.org/). During the pre-1.0 development phase, minor releases can add entities and dashboard behaviour while the hardware interface is being verified.

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

<p align="center">
  <img src="docs/icon.png" alt="Juulsen smart home icon" width="180">
</p>

# Nilan CTS602 · Juulsen

[![Latest release](https://img.shields.io/github/v/release/Juulsen/Nilan_cts602)](https://github.com/Juulsen/Nilan_cts602/releases/latest)
[![Validation](https://img.shields.io/github/actions/workflow/status/Juulsen/Nilan_cts602/validate.yaml?branch=main&label=HACS%20%2B%20Hassfest%20%2B%20tests)](https://github.com/Juulsen/Nilan_cts602/actions/workflows/validate.yaml)
[![Home Assistant](https://img.shields.io/badge/Home_Assistant-2026.1.0%2B-18BCF2?logo=homeassistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS custom repository](https://img.shields.io/badge/HACS-Custom_repository-41BDF5)](#installation)
[![Project status](https://img.shields.io/badge/Status-Read--only_0.3.0-orange)](#status-and-support)
[![Local Modbus](https://img.shields.io/badge/Connection-Modbus_TCP_%7C_RTU-00897B)](#requirements)
[![Languages](https://img.shields.io/badge/Languages-English_%7C_Dansk-blue)](#dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-0070BA?logo=paypal&logoColor=white)](https://www.paypal.me/MIJUTEC)

**Read a Nilan Comfort 300 LR with a CTS602 controller from Home Assistant, including duct temperatures, filter life, alarms and a cross-flow diagram.**

An independent community project by **Juulsen**, under active testing. Not developed, supported or endorsed by Nilan. Version 0.3.0 only reads. Donations help support development and testing.

## Dansk

Nilan CTS602 læser et Nilan Comfort 300 LR med CTS602 fra Home Assistant. Kortet viser krydsvarmeveksleren, ventilatorer, filter, alarmer og to grafer. Teksten er på dansk, når Home Assistant eller kortet er sat til dansk.

**Før du skifter:** slå den gamle `nilan`-integration (veista) fra, og fjern YAML-modbus-sensorer for samme slave. To integrationer på samme slave pumper den delte RS485-gateway.

Rumtemperaturen kan ikke skrives ind i regulatoren over Modbus. T15 er brugerpanelet. På det anlæg kortet er tegnet til sidder panelet på loftet ved aggregatet, så T15 er ikke stuetemperaturen. Vælg en temperaturentitet fra Home Assistant, hvis kortet skal vise rummet. Valget bruges kun til visning.

Efter installation sættes dashboard-ressourcen til:

```text
/nilan_cts602-static/nilan-card.js?v=0.3.0
```

Behold kun én Nilan-ressource. Anlægget gemmes under **Indstillinger → Enheder og tjenester → Nilan CTS602 → Konfigurer**. Guiden spørger, før den gemmer, og den skriver ikke til CTS602.

## Features

- **Read-only Modbus.** Function codes 03 and 04 only. Function code 06 is not used. Function code 16 is reserved for a later version and is refused in 0.3.0, including bus address, model type, service mode, factory reset, relay outputs, the keypress register and week-program erase.
- **Comfort only.** Setup reads model type, protocol and software. Anything other than Comfort (type 13) is refused with the type that answered.
- **Protocol gating.** Fan step, filter days and the bypass position register are read only when that protocol provides them.
- **Plant.** Preheater, reheater (none, electric or water), CO₂ and T10 create entities only when they are fitted.
- **Heat recovery.** The primary sensor is the exhaust-side temperature efficiency. The controller's own value is a separate sensor.
- **Shared bus.** Requests for one gateway are serialized, with a pause between frames, retries and a 30 second default poll.
- **Dashboard card** with graphic and field views, interactive history and the tabs Overview, Alarms, Filter and Settings.
- **Danish and English.**

See the [changelog](CHANGELOG.md).

## Requirements

- Home Assistant **2026.1.0 or newer**.
- A Nilan Comfort 300 LR with CTS602, reachable through a **Modbus TCP gateway**, a transparent RTU-over-TCP gateway, or a direct RS485 port at **19200 8E1**.
- Gateway host, TCP port and the CTS602 slave ID. The unit this integration is written for uses slave **10**. The PDF default of 30 is not assumed.
- If the same gateway already serves an ECL110, choose **Modbus TCP**. That is the framing the ECL110 integration uses.

The integration does not change the gateway's RS485 settings.

## Installation

### Through HACS

1. In HACS, open **⋮ → Custom repositories**.
2. Add `https://github.com/Juulsen/Nilan_cts602` with type **Integration**.
3. Find **Nilan CTS602 by Juulsen**, download it and restart Home Assistant.
4. Open **Settings → Devices & services → Add integration**, search for **Nilan CTS602**, and enter the connection.
5. Confirm preheater, reheater, CO₂, T10 and where the room temperature should come from.

### Manual installation

Download the source ZIP from the [latest release](https://github.com/Juulsen/Nilan_cts602/releases/latest). Extract it and copy the complete `custom_components/nilan_cts602` folder, including `frontend`, into `/config/custom_components/`. Restart Home Assistant, then add the integration as above.

### Migration

Disable every other reader of this slave before the first poll:

- The HACS integration **nilan** by veista, if it is installed.
- Any `modbus:` sensors in `configuration.yaml` that use the same gateway and slave.

Two masters on one RS485 gateway collide. This integration pauses between frames and retries, but it cannot share a lock with a different integration. Leave the old sensors disabled.

### Updating

Update through HACS, or replace the complete integration folder, then restart Home Assistant. On startup the integration rewrites an existing Nilan card resource to the URL below. Keep only one Nilan JavaScript resource and reload the browser.

## Dashboard

Add this dashboard resource as a **JavaScript module**:

```text
/nilan_cts602-static/nilan-card.js?v=0.3.0
```

Add a manual card:

```yaml
type: custom:nilan-cts602-card
language: da
```

One Comfort is discovered from its entities. With more than one unit, set `entity` to any of that unit's sensors. `view` is `graphic` or `fields`. The in-card **Grafisk / Felter** choice is stored in the browser.

```yaml
type: custom:nilan-cts602-card
entity: sensor.nilan_comfort_udeluft_t8
language: da
view: graphic
```

The tabs are **Overblik · Alarmer · Filter · Indstillinger**. Settings are read-only in 0.3.0. An administrator can open **Opsæt anlæg**. Saving asks for confirmation and stores the plant on the integration. It does not call a Modbus write.

The first time an administrator opens the card before a room entity is chosen, a banner starts the wizard. T15 and T10 are explained there: both can sit inside the unit, and the controller cannot take an external sensor over Modbus.

### Version 0.3.0 card

The overview is a SCADA diagram: shaded ducts with elbows and flanges, a plate cross-flow exchanger, round fans, filters and a bypass damper under the exchanger. Tapping a value opens that sensor's history. The screenshots are the real card with simulated readings.

![Mobile, dark](docs/images/nilan-mobile-0.3.0.png)

![Desktop, dark](docs/images/nilan-desktop-0.3.0.png)

![Mobile, light](docs/images/nilan-mobile-light-0.3.0.png)

![Desktop, light](docs/images/nilan-desktop-light-0.3.0.png)

Every graph has a legend with the sensor name and the current value, for example `Ude 12,3 °C` when the language is Danish. A tap or hold shows every series at that time. The highest point on a graph is labelled. Decimal commas follow the language.

## Sensors

Temperatures are signed words scaled by 0.01 °C. T0, T3, T4, T7, T8 and T15 are created for a Comfort. T2, T9 and T10 stay disabled until a plausible probe was seen at setup, or until the plant says the sensor is fitted. An administrator can enable them from the device page.

| Reading | Notes |
| --- | --- |
| Duct and board temperatures | T0, T2, T3, T4, T7, T8, T9, T10, T15 |
| Humidity | Percent |
| CO₂ | Only when the plant says the sensor is fitted. Unit is ppm |
| Control state and operation mode | Text, not the raw number |
| Supply setpoint | Input 1201 |
| Supply and extract fan | Percent, plus step on protocol 9 and newer |
| Filter | Days since change and days left, protocol 9 and newer |
| Alarms | Count, plus alarm 1–3 with text. Date and time are decoded best-effort |
| Controller clock and panel display | Diagnostic |
| Room temperature | T15, T10, or another Home Assistant temperature entity. Display only |
| Heat recovery, exhaust side | `(T3 − T4) / (T3 − T8) × 100`, limited to 0–100. Unavailable when T3 − T8 is below 3 K |
| Heat recovery, controller | Input 1204, labelled as the controller's own value |

Binary sensors: running, summer, alarm active, filter, bypass, defrost, user function. Preheater and reheater are added only when configured.

The filter binary sensor follows alarm code 19 in the active alarm list, or zero days left before the filter change. The pressure-switch input is not used.

Bypass on protocol 10 and older follows the damper open and close relays. The position stays put while a relay is still moving, so the sensor does not flicker, and it stays unknown until a pulse has finished. Protocol 11 and newer use the bypass position register.

Current settings (run, mode, fan step, temperature limits, humidity, week program, cooling and user functions) are diagnostic sensors. They are shown on the Settings tab and are not writable in this version.

## Connection defaults

| Setting | Default |
| --- | --- |
| Connection | Modbus TCP |
| Port | 502 |
| Slave ID | 10 |
| Poll | 30 seconds, minimum 10 |
| Pause between frames | 0.15 seconds, minimum 0.05 |
| Timeout | 5 seconds |
| Retries | 3, with backoff |

Serial is fixed at 19200 baud, 8 data bits, even parity, 1 stop bit, which is what the CTS602 uses.

## Status and support

0.3.0 is read-only. It is meant to be installed and corrected against the live Comfort 300 LR (software 2.35.a, protocol 9). Setpoints and fan step are planned for a later version, still with function code 16, one register at a time, and only after an administrator confirms. A restart is required. After startup the integration rewrites an existing Nilan card resource to `/nilan_cts602-static/nilan-card.js?v=0.3.0`. Reload the browser so it fetches the new file.

Issues: <https://github.com/Juulsen/Nilan_cts602/issues>

These points are still assumptions until the live unit confirms them:

- Alarm date and time words use a best-effort bit layout. The raw words stay on the sensor if the date is not valid.
- Holding 1206 and 1207 (night-cooling limits) are scaled as 0.01 °C. The PDF does not state that scale. The sensors are marked `scale_assumed`.
- On protocol 9 the bypass position follows the last finished motor pulse. Holding 102 opens the damper and holding 103 closes it. The last position is restored after a restart and shown as last known until the next pulse. It stays unknown only when no pulse has been seen.
- The gateway address is never filled in for you. Modbus TCP is the default framing because that matches the shared ECL110 gateway.

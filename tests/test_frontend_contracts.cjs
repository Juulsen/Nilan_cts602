// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Card contracts without a browser. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../custom_components/nilan_cts602/frontend');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../custom_components/nilan_cts602/manifest.json'), 'utf8'));
const cardSource = fs.readFileSync(path.join(root, 'nilan-card.js'), 'utf8');
const diagramSource = fs.readFileSync(path.join(root, 'nilan-diagram.js'), 'utf8');
const settingsSource = fs.readFileSync(path.join(root, 'nilan-settings.js'), 'utf8');
assert.match(cardSource, new RegExp(`const NILAN_VERSION = '${manifest.version}'`));
assert.match(cardSource, /const NILAN_STATIC = '\/nilan_cts602-static\/'/);
assert.match(cardSource, /\?v=\$\{NILAN_VERSION\}/);
assert.match(cardSource, /callService\s*\(/);
assert.match(cardSource, /NilanSettings\.TABS/);
for (const label of ['Overblik', 'Drift & trin', 'Temperatur & bypass', 'Fugt & luftkvalitet', 'Ugeprogram', 'Filter & alarmer', 'Service & konfiguration']) {
  assert.match(settingsSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(cardSource, /Gemt og genlæst/);
assert.match(cardSource, /© \$\{NILAN_AUTHOR\} · Nilan CTS602 v\$\{NILAN_VERSION\}/);
assert.match(cardSource, /Nilan CTS602 by Juulsen/);
assert.match(cardSource, /protokol /);
assert.match(cardSource, /Bypass lukket/);
assert.match(cardSource, /Bypass åben/);
assert.match(cardSource, /Bypass åbner…/);
assert.match(cardSource, /seneste kendte/);
assert.match(cardSource, /prefers-reduced-motion/);
assert.match(cardSource, /ResizeObserver/);
assert.match(cardSource, /getGridOptions/);
assert.match(cardSource, /min_columns: 6/);
assert.doesNotMatch(cardSource, /Utilgængelig/);
assert.doesNotMatch(cardSource, /bus \$\{protocol\}/);
assert.doesNotMatch(cardSource, /'Veksler'/);
assert.match(cardSource, /nilan_cts602\/plant\/set/);
assert.match(cardSource, /confirm\(/);
for (const file of ['nilan-card.js', 'nilan-plant.js', 'nilan-diagram.js', 'nilan-chart.js', 'nilan-wizard.js', 'nilan-settings.js']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.doesNotMatch(source, /CONCENTRATION_PARTS_PER_MILLION/);
  assert.match(source, /SPDX-License-Identifier: MIT/);
  assert.match(source, /Copyright \(c\) 2026 Juulsen/);
}

function matches(node, selector) {
  if (!selector) return false;
  if (selector.startsWith('.')) return String(node.className || '').split(/\s+/).includes(selector.slice(1));
  const attr = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
  if (attr) {
    const key = attr[1];
    const expected = attr[2];
    if (key.startsWith('data-')) {
      const dataKey = key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const actual = node.dataset?.[dataKey] ?? node.attributes?.[key];
      return expected === undefined ? actual != null && actual !== '' : String(actual) === expected;
    }
    const actual = node.attributes?.[key];
    return expected === undefined ? actual != null : String(actual) === expected;
  }
  return node.tag === selector;
}
class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.scrollLeft = 0;
  }
  attachShadow() { return this.shadowRoot = new Element('shadow'); }
  append(...nodes) {
    for (const node of nodes) node.parentElement = this;
    this.children.push(...nodes);
  }
  replaceChildren(...nodes) { this.children = nodes; this._replacements = (this._replacements || 0) + 1; }
  setAttribute(key, value) {
    this.attributes[key] = value;
    if (key.startsWith('data-')) {
      const dataKey = key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[dataKey] = value;
    }
  }
  getAttribute(key) { return this.attributes[key]; }
  toggleAttribute(key, force) {
    if (force === false || (force === undefined && this.attributes[key] != null)) delete this.attributes[key];
    else this.attributes[key] = '';
  }
  removeAttribute(key) { delete this.attributes[key]; }
  getBoundingClientRect() { return { height: 420, width: 800, x: 0, y: 0 }; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector) {
    const found = [];
    const walk = (node) => {
      for (const child of node.children || []) {
        if (matches(child, selector)) found.push(child);
        walk(child);
      }
    };
    walk(this);
    return found;
  }
}
const definitions = new Map();
const context = vm.createContext({
  HTMLElement: Element,
  document: { createElement: (tag) => new Element(tag), head: new Element('head') },
  customElements: { define: (name, value) => definitions.set(name, value) },
  window: {},
  localStorage: { getItem: () => null, setItem() {} },
  CustomEvent: class { constructor(type, options) { Object.assign(this, { type }, options); } },
  console,
});
context.window = context;
for (const file of ['nilan-plant.js', 'nilan-diagram.js', 'nilan-chart.js', 'nilan-wizard.js', 'nilan-settings.js', 'nilan-card.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const plant = context.NilanPlant.normalize({ reheater: 'steam', preheater: true, room_source: 'loft', room_entity: ' sensor.stue ' });
assert.equal(plant.reheater, 'none');
assert.equal(plant.preheater, true);
assert.equal(plant.room_source, 'entity');
assert.equal(plant.room_entity, 'sensor.stue');
assert.equal(plant.version, 2);
assert.equal(plant.options_board, false);
assert.equal(plant.experimental, false);
assert.equal(context.NilanPlant.normalize({ reheater_electric: true, reheater_water: true }).reheater, 'electric');
const fittedPlant = context.NilanPlant.normalize({ preheater: true, reheater_water: true, co2: true });
const clearedPlant = context.NilanPlant.normalize({ ...fittedPlant, preheater: false, reheater_water: false, co2: false });
assert.equal(clearedPlant.preheater, false);
assert.equal(clearedPlant.reheater_water, false);
assert.equal(clearedPlant.reheater, 'none');
assert.equal(clearedPlant.co2, false);
const switchedPlant = context.NilanPlant.normalize({ ...fittedPlant, reheater_electric: true, reheater_water: false });
assert.equal(switchedPlant.reheater, 'electric');
assert.equal(switchedPlant.reheater_water, false);

const artDesktop = fs.readFileSync(path.join(root, 'art/ventilation-anlaeg.svg'), 'utf8');
const artMobile = fs.readFileSync(path.join(root, 'art/ventilation-mobil.svg'), 'utf8');
assert.ok(diagramSource.includes(artDesktop));
assert.ok(diagramSource.includes(artMobile));
const bare = context.NilanDiagram.markup(context.NilanPlant.normalize({}), {
  bypass: 'closed',
  extract_fan_speed: '42 %',
  supply_fan_speed: '40 %',
  t8_outdoor: '12,3 °C',
});
assert.match(bare, /viewBox='0 0 1200 600'/);
assert.match(bare, /Krydsveksler/);
assert.match(bare, /Udsugning/);
assert.match(bare, /Indblæsning/);
assert.match(bare, />Bypass</);
assert.doesNotMatch(bare, /Forvarmer/);
assert.doesNotMatch(bare, /Eftervarmer/);
assert.match(bare, /42 %/);
assert.match(bare, /40 %/);
assert.match(bare, /12,3 °C/);
assert.match(bare, /data-sensor="humidity"/);
assert.match(bare, /data-sensor="t8_outdoor"/);
assert.match(bare, /data-sensor="t7_supply"/);
assert.match(bare, /data-sensor="t3_extract"/);
assert.match(bare, /data-sensor="t4_exhaust"/);
assert.match(bare, /data-nilan-damper='1'/);
assert.doesNotMatch(bare, /data-nilan-damper='1'[^>]*transform=/);
const fitted = context.NilanDiagram.markup({ preheater: true, reheater: 'electric' }, { bypass: 'open' });
assert.match(fitted, /Forvarmer/);
assert.match(fitted, /Eftervarmer/);
assert.match(fitted, /forvarmer-el\.svg|nilan-option="forvarmer-el\.svg"/);
assert.match(fitted, /transform='rotate\(45 600 452\)'/);
const portrait = context.NilanDiagram.markup(context.NilanPlant.normalize({}), {
  compact: true,
  t7_supply: '19,4 °C',
  preheater: 'Fra',
  reheater: 'Fra',
});
assert.match(portrait, /viewBox='0 0 400 760'/);
assert.match(portrait, /19,4 °C/);
assert.doesNotMatch(portrait, /Forvarmer/);
assert.doesNotMatch(portrait, /Eftervarmer/);
assert.doesNotMatch(portrait, /nilan-option/);
const inferred = context.NilanDiagram.markup(
  { preheater: 'Fra', reheater: 'off', reheater_electric: 'off' },
  { compact: true, preheater: 'Fra', reheater: 'Fra' },
);
assert.doesNotMatch(inferred, /Forvarmer/);
assert.doesNotMatch(inferred, /Eftervarmer/);
const portraitFitted = context.NilanDiagram.markup(
  { preheater: true, reheater: 'water' },
  { compact: true, preheater: 'Fra' },
);
assert.match(portraitFitted, /Forvarmer/);
assert.match(portraitFitted, /Eftervarmer/);
assert.match(portraitFitted, /forvarmer-el-mobil\.svg/);
assert.match(portraitFitted, /eftervarmer-vand-mobil\.svg/);
assert.match(portraitFitted, /mobil-felt-forvarmer\.svg/);
assert.match(portraitFitted, /mobil-tekst-eftervarmer\.svg/);
assert.match(cardSource, /hass-more-info/);
assert.doesNotMatch(bare, /marker-end=/);
const viewBox = bare.match(/viewBox='0 0 ([\d.]+) ([\d.]+)'/);
assert.ok(viewBox);
const boxW = Number(viewBox[1]);
const boxH = Number(viewBox[2]);
for (const match of bare.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)) {
  const attrs = match[1];
  if (!attrs.includes('nilan-value')) continue;
  const label = match[2];
  const x = Number((attrs.match(/\bx="([^"]+)"/) || [])[1]);
  const y = Number((attrs.match(/\by="([^"]+)"/) || [])[1]);
  assert.ok(x >= 4 && x <= boxW - 4, `${label} x=${x} leaves the diagram`);
  assert.ok(y >= 8 && y <= boxH - 2, `${label} y=${y} leaves the diagram`);
}
const portraitBox = portrait.match(/viewBox='0 0 ([\d.]+) ([\d.]+)'/);
const portraitFont = Number((portrait.match(/data-sensor="t7_supply"[^>]*font-size="([\d.]+)"/) || portrait.match(/font-size="([\d.]+)"[^>]*data-sensor="t7_supply"/) || [])[1]);
assert.ok(portraitFont * 390 / Number(portraitBox[1]) >= 11, `value font ${portraitFont} is under 11px at 390px`);
assert.match(cardSource, /data-hmi/);
assert.match(cardSource, /significant_changes_only:\s*false/);
assert.match(cardSource, /hmiTheme/);
assert.match(cardSource, /significant_changes_only:\s*false/);
assert.match(cardSource, /recorder\/statistics_during_period/);
assert.match(cardSource, /chart-empty/);
assert.match(cardSource, /overflow-wrap:anywhere/);
assert.match(cardSource, /Ventilation – Nilan Comfort 300 LR/);
assert.match(cardSource, /--hmi-housing:#1b222c/);
assert.match(artDesktop, /#1c1c1c/);
assert.doesNotMatch(cardSource, /Diagram skaleres/);
assert.match(cardSource, /themes\?\.darkMode/);

assert.equal(context.NilanChart.legendLine('Ude', 12.3, '°C', true), 'Ude 12,3 °C');
assert.equal(context.NilanChart.legendLine('Outdoor', 12.3, '°C', false), 'Outdoor 12.3 °C');
const now = Date.now();
const series = [
  { id: 't8_outdoor', name: 'Ude', unit: '°C', points: [[now - 3600000, 10.5], [now, 12.3]] },
  { id: 't3_extract', name: 'Udsug', unit: '°C', points: [[now - 3600000, 21], [now, 22.5]] },
  { id: 't7_supply', name: 'Indblæs', unit: '°C', points: [[now - 3600000, 18], [now, 19.2]] },
  { id: 't4_exhaust', name: 'Afkast', unit: '°C', points: [[now - 3600000, 14], [now, 15.4]] },
];
const svg = context.NilanChart.history(series, { comma: true, maxLabel: 'Maks' });
assert.match(svg, /data-chart="history"/);
assert.match(svg, /data-series="t8_outdoor"/);
assert.match(svg, /data-top="1"[^>]*>Maks Udsug 22,5 °C</);
const hit = context.NilanChart.nearest(series, 1);
assert.equal(hit.rows.length, 4);
const tip = context.NilanChart.tooltipText(hit, true);
for (const name of ['Ude', 'Udsug', 'Indblæs', 'Afkast']) assert.match(tip, new RegExp(name));
assert.match(tip, /,/);
const efficiency = context.NilanChart.history([{ id: 'efficiency', name: 'Afkastside', unit: '%', points: [[now - 1000, 20], [now, 25.5]] }], { comma: true, maxLabel: 'Maks' });
assert.match(efficiency, /data-top="1"[^>]*>Maks Afkastside 25,5 %</);
const emptyChart = context.NilanChart.history(
  [{ id: 't8_outdoor', name: 'Ude', unit: '°C', points: [] }],
  { comma: true, empty: 'Ingen historik endnu. Den kommer, når Home Assistant har optaget målingerne.' },
);
assert.match(emptyChart, /data-empty="1"/);
assert.doesNotMatch(emptyChart, /Ingen historik/);
assert.match(emptyChart, />°C</);

const t3 = 'sensor.nilan_t3_extract';
const compressed = {
  [t3]: [
    { s: '21.5', lu: 1759406400.0 },
    { s: '22,1', lu: 1759410000.25 },
    { s: 'unavailable', lu: 1759413600 },
    { s: '22.8', lc: 1759417200.0 },
  ],
};
const parsed = context.NilanChart.parseHistory(compressed);
assert.equal(JSON.stringify(parsed[t3]), JSON.stringify([
  [1759406400000, 21.5],
  [1759410000250, 22.1],
  [1759417200000, 22.8],
]));
const legacy = [[
  { entity_id: 'sensor.nilan_t8_outdoor', state: '12.3', last_changed: '2026-10-02T12:00:00.000Z', last_updated: '2026-10-02T12:00:00.000Z' },
  { s: '11.5', lu: 1759406400 },
]];
const legacyParsed = context.NilanChart.parseHistory(legacy);
assert.equal(legacyParsed['sensor.nilan_t8_outdoor'][0][1], 12.3);
assert.equal(legacyParsed['sensor.nilan_t8_outdoor'][0][0], Date.parse('2026-10-02T12:00:00.000Z'));
assert.equal(legacyParsed['sensor.nilan_t8_outdoor'][1][1], 11.5);
const stats = context.NilanChart.parseStatistics({
  'sensor.nilan_efficiency': [
    { start: 1759406400000, end: 1759406700000, mean: 65.4, min: 60, max: 70 },
    { start: 1759406700000, mean: 29.3 },
  ],
});
assert.equal(JSON.stringify(stats['sensor.nilan_efficiency']), JSON.stringify([
  [1759406400000, 65.4],
  [1759406700000, 29.3],
]));

const Card = definitions.get('nilan-cts602-card');
const card = new Card();
card.config = { language: 'da' };
card._hass = { language: 'da', user: { is_admin: true }, states: {} };
assert.equal(card.fmt(12.3, 1, '°C'), '12,3 °C');
assert.equal(card.tr('Grafisk', 'Graphic'), 'Grafisk');
card.config.language = 'en';
assert.equal(card.fmt(12.3, 1, '°C'), '12.3 °C');
assert.equal(card.viewMode(), 'graphic');

function nilanState(key, value, attributes) {
  return { state: value, attributes: { nilan_device: 'comfort', register_key: key, ...attributes } };
}
card.config.language = 'da';
card._hass.states = {
  'binary_sensor.bypass': nilanState('bypass', 'on', { position: 'open', restored: true, last_pulse: { relay: 'H102', at: '2026-10-01T00:00:00+00:00' } }),
  'binary_sensor.running': nilanState('running', 'on', {}),
};
assert.equal(card.bypassView().chip, 'Bypass åben · seneste kendte');
assert.equal(card.bypassView().short, 'seneste');
card._hass.states['binary_sensor.bypass'] = nilanState('bypass', 'on', { position: 'open', moving: 'opening' });
assert.equal(card.bypassView().chip, 'Bypass åbner…');
card._hass.states['binary_sensor.bypass'] = nilanState('bypass', 'unavailable', { position: 'unknown' });
assert.equal(card.bypassView().chip, '');
assert.equal(card.display('t8_outdoor').text, '—');
assert.equal(card.pace('45 %', ''), '1.83');
card._hass.states['binary_sensor.running'] = nilanState('running', 'off', {});
assert.equal(card.pace('45 %', ''), '');

const liveCard = new Card();
liveCard._libs = true;
liveCard.config = { language: 'da', theme: 'light', layout: 'desktop' };
function state(key, value, extra) {
  return { state: value, attributes: { nilan_device: 'comfort', register_key: key, unit_of_measurement: extra?.unit, ...extra } };
}
const t8 = state('t8_outdoor', '12.3', { unit: '°C', unit_of_measurement: '°C' });
const running = state('running', 'on');
const baseStates = {
  'sensor.t8': t8,
  'binary_sensor.running': running,
  'sensor.mode': state('operation_mode', 'auto'),
  'sensor.step': state('fan_step', '2'),
  'sensor.alarms': state('alarm_count', '0'),
};
liveCard.hass = { language: 'da', themes: {}, user: { is_admin: false }, states: { ...baseStates, 'light.kitchen': { state: 'on', attributes: {} } } };
const replacements = liveCard.shadowRoot._replacements;
const probe = new Element('span');
probe.dataset.live = 't8_outdoor';
probe.textContent = 'old';
liveCard.shadowRoot.append(probe);
const damper = new Element('path');
damper.setAttribute('data-part', 'bypass');
damper.setAttribute('data-open', 'OPEN');
damper.setAttribute('data-closed', 'SHUT');
damper.setAttribute('d', 'SHUT');
liveCard.shadowRoot.append(damper);
liveCard.hass = {
  language: 'da',
  themes: {},
  user: { is_admin: false },
  states: { ...baseStates, 'light.kitchen': { state: 'off', attributes: { brightness: 10 } } },
};
assert.equal(liveCard.shadowRoot._replacements, replacements, 'unrelated hass update rebuilt the card');
assert.equal(probe.textContent, 'old');
const nextT8 = state('t8_outdoor', '13.5', { unit_of_measurement: '°C' });
liveCard.hass = {
  language: 'da',
  themes: {},
  user: { is_admin: false },
  states: { ...baseStates, 'sensor.t8': nextT8 },
};
assert.equal(liveCard.shadowRoot._replacements, replacements, 'relevant hass update rebuilt the DOM');
assert.equal(probe.textContent, '13,5 °C');
assert.equal(damper.getAttribute('d'), 'SHUT');
const extractBox = new Element('g');
extractBox.className = 'channel-value ext';
const extractRh = new Element('text');
extractRh.className = 'muted';
extractRh.textContent = 'T3 · RH 45 %';
extractBox.append(extractRh);
const outdoor = new Element('g');
outdoor.className = 'channel-value out';
const outdoorValue = new Element('text');
outdoorValue.className = 'value-text';
outdoorValue.textContent = '12,3 °C';
outdoor.append(outdoorValue);
const eff = new Element('text');
eff.className = 'value-text';
eff.setAttribute('data-sensor', 'efficiency');
eff.textContent = '70 %';
const t15 = new Element('text');
t15.className = 'value-text';
t15.setAttribute('data-sensor', 't15_panel');
t15.textContent = '18 °C';
const extractSpeed = new Element('text');
extractSpeed.className = 'muted fan-speed';
extractSpeed.textContent = '42 %';
const supplySpeed = new Element('text');
supplySpeed.className = 'muted fan-speed';
supplySpeed.textContent = '40 %';
const bypassName = new Element('text');
bypassName.className = 'tag bypass-label';
bypassName.textContent = 'Bypass';
const bypassState = new Element('text');
bypassState.className = 'muted bypass-label';
bypassState.textContent = 'lukket (H102/H103)';
const extractFan = new Element('g');
extractFan.setAttribute('data-part', 'extract_fan');
liveCard.shadowRoot.append(extractBox, outdoor, eff, t15, extractSpeed, supplySpeed, bypassName, bypassState, extractFan);
liveCard._hass.states['sensor.rh'] = state('humidity', '45', { unit_of_measurement: '%' });
liveCard._hass.states['sensor.eff'] = state('efficiency', '74.5', { unit_of_measurement: '%' });
liveCard._hass.states['sensor.t15'] = state('t15_panel', '18.6', { unit_of_measurement: '°C' });
liveCard._hass.states['sensor.m3'] = state('extract_fan_speed', '42', { unit_of_measurement: '%' });
liveCard._hass.states['sensor.m4'] = state('supply_fan_speed', '40', { unit_of_measurement: '%' });
liveCard._hass.states['binary_sensor.bypass'] = state('bypass', 'off', { position: 'closed' });
const painted = liveCard.shadowRoot._replacements;
liveCard.hass = {
  language: 'da',
  themes: {},
  user: { is_admin: false },
  states: {
    ...liveCard._hass.states,
    'sensor.t8': state('t8_outdoor', '11.0', { unit_of_measurement: '°C' }),
    'sensor.eff': state('efficiency', '80', { unit_of_measurement: '%' }),
    'sensor.t15': state('t15_panel', '19.1', { unit_of_measurement: '°C' }),
    'sensor.m3': state('extract_fan_speed', '55', { unit_of_measurement: '%' }),
    'sensor.rh': state('humidity', '47', { unit_of_measurement: '%' }),
    'binary_sensor.bypass': state('bypass', 'on', { position: 'open' }),
    'binary_sensor.running': state('running', 'on'),
  },
};
assert.equal(liveCard.shadowRoot._replacements, painted);
assert.equal(outdoorValue.textContent, '11,0 °C');
assert.equal(extractRh.textContent, 'T3 · RH 47 %');
assert.equal(eff.textContent, '80 %');
assert.equal(t15.textContent, '19,1 °C');
assert.equal(extractSpeed.textContent, '55 %');
assert.equal(supplySpeed.textContent, '40 %');
assert.equal(bypassState.textContent, 'åben (H102/H103)');
assert.equal(damper.getAttribute('d'), 'M 368.72879 90.711868 H 390.72879');
assert.match(extractFan.getAttribute('style'), /animation-duration/);

console.log('PASS: plant, diagram, chart legend, tooltip, comma, card version and read-only contract');

/* Card contracts without a browser. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../custom_components/nilan_cts602/frontend');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../custom_components/nilan_cts602/manifest.json'), 'utf8'));
const cardSource = fs.readFileSync(path.join(root, 'nilan-card.js'), 'utf8');
const diagramSource = fs.readFileSync(path.join(root, 'nilan-diagram.js'), 'utf8');
assert.match(cardSource, new RegExp(`const NILAN_VERSION = '${manifest.version}'`));
assert.match(cardSource, /const NILAN_STATIC = '\/nilan_cts602-static\/'/);
assert.match(cardSource, /\?v=\$\{NILAN_VERSION\}/);
assert.doesNotMatch(cardSource, /callService\s*\(/);
assert.match(cardSource, /Grafisk/);
assert.match(cardSource, /Felter/);
assert.match(cardSource, /Overblik/);
assert.match(cardSource, /Alarmer/);
assert.match(cardSource, /Filter/);
assert.match(cardSource, /Indstillinger/);
assert.match(cardSource, /protokol /);
assert.match(cardSource, /Bypass lukket/);
assert.match(cardSource, /Bypass åben/);
assert.match(cardSource, /Bypass åbner…/);
assert.match(cardSource, /seneste kendte/);
assert.match(diagramSource, /prefers-reduced-motion/);
assert.doesNotMatch(cardSource, /Utilgængelig/);
assert.doesNotMatch(cardSource, /bus \$\{protocol\}/);
assert.doesNotMatch(cardSource, /'Veksler'/);
assert.match(cardSource, /nilan_cts602\/plant\/set/);
assert.match(cardSource, /confirm\(/);
for (const file of ['nilan-card.js', 'nilan-plant.js', 'nilan-diagram.js', 'nilan-chart.js', 'nilan-wizard.js']) {
  assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /CONCENTRATION_PARTS_PER_MILLION/);
}

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; }
  attachShadow() { return this.shadowRoot = new Element('shadow'); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
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
for (const file of ['nilan-plant.js', 'nilan-diagram.js', 'nilan-chart.js', 'nilan-wizard.js', 'nilan-card.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const plant = context.NilanPlant.normalize({ reheater: 'steam', preheater: true, room_source: 'loft', room_entity: ' sensor.stue ' });
assert.equal(plant.reheater, 'none');
assert.equal(plant.preheater, true);
assert.equal(plant.room_source, 'entity');
assert.equal(plant.room_entity, 'sensor.stue');

const bare = context.NilanDiagram.markup(context.NilanPlant.normalize({}), { t8: '12,3 °C', bypass: 'closed' });
for (const part of ['outdoor', 'supply', 'extract', 'exhaust', 'exchanger', 'supply_fan', 'extract_fan', 'filter', 'bypass']) {
  assert.match(bare, new RegExp(`data-part="${part}"`));
}
assert.doesNotMatch(bare, /data-part="preheater"/);
assert.doesNotMatch(bare, /data-part="reheater"/);
const fitted = context.NilanDiagram.markup({ preheater: true, reheater: 'electric' }, { bypass: 'open', filterAlarm: true });
assert.match(fitted, /data-part="preheater"/);
assert.match(fitted, /data-part="reheater"/);
assert.match(fitted, /data-state="open"/);
assert.match(bare, /data-diagram="hmi"/);
assert.match(bare, /hx-hatch/);
assert.match(bare, /hx-diamond/);
assert.match(bare, /hx-path cold/);
assert.match(bare, /hx-path warm/);
assert.doesNotMatch(bare, /rotary|ROT1/);
assert.match(bare, /class="flange"/);
assert.match(bare, /data-sensor="humidity"/);
assert.match(bare, /Udeluft/);
assert.match(bare, /Afkast/);
assert.doesNotMatch(bare, />ukendt</);
assert.match(bare, /data-flow="outdoor"/);
assert.match(bare, /data-flow="supply"/);
assert.match(bare, /data-flow="extract"/);
assert.match(bare, /data-flow="exhaust"/);
assert.equal((bare.match(/data-part="filter"/g) || []).length, 2);
assert.match(bare, /data-sensor="t8_outdoor"/);
assert.match(bare, /data-sensor="t7_supply"/);
assert.match(bare, /data-sensor="t3_extract"/);
assert.match(bare, /data-sensor="t4_exhaust"/);
assert.match(bare, /data-part="exchanger"/);
assert.match(cardSource, /T15 panel \(loft\)/);
assert.doesNotMatch(bare, />HX</);
assert.doesNotMatch(bare, /marker-end=/);
assert.match(fitted, /data-state="open"/);
assert.match(fitted, /class="filter alarm"/);
const viewBox = bare.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
assert.ok(viewBox);
const boxW = Number(viewBox[1]);
const boxH = Number(viewBox[2]);
for (const match of bare.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)) {
  const attrs = match[1];
  const label = match[2];
  const x = Number((attrs.match(/\bx="([^"]+)"/) || [])[1]);
  const y = Number((attrs.match(/\by="([^"]+)"/) || [])[1]);
  assert.ok(x >= 4 && x <= boxW - 4, `${label} x=${x} leaves the diagram`);
  assert.ok(y >= 8 && y <= boxH - 2, `${label} y=${y} leaves the diagram`);
}
const valueFont = Number((bare.match(/class="value-text" font-size="(\d+)"/) || [])[1]);
assert.ok(valueFont * 390 / boxW >= 11, `value font ${valueFont} in viewBox ${boxW} is under 11px at 390px`);
assert.match(cardSource, /data-hmi/);
assert.match(cardSource, /hmiTheme/);
assert.match(cardSource, /significant_changes_only:\s*false/);
assert.match(cardSource, /recorder\/statistics_during_period/);
assert.match(cardSource, /chart-empty/);
assert.match(cardSource, /overflow-wrap:anywhere/);
assert.match(cardSource, /Ventilation – Nilan Comfort 300 LR/);

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

console.log('PASS: plant, diagram, chart legend, tooltip, comma, card version and read-only contract');

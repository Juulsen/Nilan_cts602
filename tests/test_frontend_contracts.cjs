/* Card contracts without a browser. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../custom_components/nilan_cts602/frontend');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../custom_components/nilan_cts602/manifest.json'), 'utf8'));
const cardSource = fs.readFileSync(path.join(root, 'nilan-card.js'), 'utf8');
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

assert.equal(context.NilanChart.legendLine('Ude', 12.3, '°C', true), 'Ude 12,3 °C');
assert.equal(context.NilanChart.legendLine('Outdoor', 12.3, '°C', false), 'Outdoor 12.3 °C');
const now = Date.now();
const series = [
  { id: 't8_outdoor', name: 'Ude', unit: '°C', points: [[now - 3600000, 10.5], [now, 12.3]] },
  { id: 't3_extract', name: 'Udsug', unit: '°C', points: [[now - 3600000, 21], [now, 22.5]] },
  { id: 't7_supply', name: 'Indblæs', unit: '°C', points: [[now - 3600000, 18], [now, 19.2]] },
  { id: 't4_exhaust', name: 'Afkast', unit: '°C', points: [[now - 3600000, 14], [now, 15.4]] },
];
const svg = context.NilanChart.history(series, { comma: true });
assert.match(svg, /data-chart="history"/);
assert.match(svg, /data-series="t8_outdoor"/);
assert.match(svg, /data-top="1"/);
assert.match(svg, /22,5|12,3|19,2|15,4/);
const hit = context.NilanChart.nearest(series, 1);
assert.equal(hit.rows.length, 4);
const tip = context.NilanChart.tooltipText(hit, true);
for (const name of ['Ude', 'Udsug', 'Indblæs', 'Afkast']) assert.match(tip, new RegExp(name));
assert.match(tip, /,/);
const efficiency = context.NilanChart.history([{ id: 'efficiency', name: 'Afkastside', unit: '%', points: [[now - 1000, 20], [now, 25.5]] }], { comma: true });
assert.match(efficiency, /data-top="1"/);
assert.match(efficiency, /25,5/);

const Card = definitions.get('nilan-cts602-card');
const card = new Card();
card.config = { language: 'da' };
card._hass = { language: 'da', user: { is_admin: true }, states: {} };
assert.equal(card.fmt(12.3, 1, '°C'), '12,3 °C');
assert.equal(card.tr('Grafisk', 'Graphic'), 'Grafisk');
card.config.language = 'en';
assert.equal(card.fmt(12.3, 1, '°C'), '12.3 °C');
assert.equal(card.viewMode(), 'graphic');
console.log('PASS: plant, diagram, chart legend, tooltip, comma, card version and read-only contract');

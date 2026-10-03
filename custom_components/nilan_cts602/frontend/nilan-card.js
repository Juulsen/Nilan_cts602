/* Nilan CTS602 dashboard. Read-only in 0.3.0. No external card dependencies. */
const NILAN_VERSION = '0.3.0';
const NILAN_STATIC = '/nilan_cts602-static/';

async function nilanLoadLibs() {
  if (globalThis.NilanPlant && globalThis.NilanDiagram && globalThis.NilanChart && globalThis.NilanWizard) return;
  for (const file of ['nilan-plant.js', 'nilan-diagram.js', 'nilan-chart.js', 'nilan-wizard.js']) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${NILAN_STATIC}${file}?v=${NILAN_VERSION}`;
      script.onload = () => resolve();
      script.onerror = () => reject(Error(file));
      (document.head || document.documentElement).append(script);
    });
  }
}

const NILAN_FIELDS = ['t8_outdoor', 't3_extract', 't7_supply', 't4_exhaust', 'humidity', 'efficiency', 'supply_fan_speed', 'extract_fan_speed', 'control_state', 'supply_setpoint'];
const NILAN_SETTINGS = ['set_temperature', 'set_fan_step', 'set_mode', 'set_run', 'supply_min_summer', 'supply_min_winter', 'supply_max_summer', 'supply_max_winter', 'summer_limit', 'night_cool_day_limit', 'night_cool_setpoint', 'humidity_limit', 'humidity_low_step', 'humidity_high_step', 'humidity_high_time', 'week_program', 'cooling_setpoint', 'cooling_fan_step', 'user_function_1_type', 'user_function_2_type', 'co2_limit_low', 'co2_limit_high'];

const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};

class NilanCard extends HTMLElement {
  static getConfigElement() { return document.createElement('nilan-cts602-card-editor'); }
  static getStubConfig() { return { view: 'graphic' }; }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.tab = 'overview';
    this._history = null;
  }
  setConfig(config) {
    this.config = { ...config };
    if (!this._libs) this.load();
    else this.render();
  }
  async load() {
    try {
      await nilanLoadLibs();
      this._libs = true;
      this.render();
    } catch (err) {
      this._error = String(err);
      this.render();
    }
  }
  set hass(hass) {
    this._hass = hass;
    if (!this._asked && hass) {
      this._asked = true;
      this.loadPlant();
    }
    const open = this.shadowRoot.querySelector('dialog[open]');
    if (open || this.shadowRoot.activeElement) {
      this.refreshLive();
      return;
    }
    this.render();
  }
  getCardSize() { return this.tab === 'overview' ? 14 : 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 'auto' }; }
  tr(da, en) { return this.lang() === 'da' ? da : en; }
  lang() { return String(this.config?.language || this._hass?.language || 'en').startsWith('da') ? 'da' : 'en'; }
  comma() { return this.lang() === 'da'; }
  isAdmin() { return !!this._hass?.user?.is_admin; }
  fmt(value, digits = 1, unit = '') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '—';
    let text = parsed.toFixed(digits);
    if (this.comma()) text = text.replace('.', ',');
    return unit ? `${text} ${unit}` : text;
  }
  entities() {
    const all = Object.entries(this._hass?.states || {}).filter(([, state]) => state.attributes?.nilan_device);
    const anchor = this._hass?.states?.[this.config?.entity];
    const ids = [...new Set(all.map(([, state]) => state.attributes.nilan_device))];
    const device = anchor?.attributes?.nilan_device || this.config?.device || (ids.length === 1 ? ids[0] : null);
    return all.filter(([, state]) => device && state.attributes.nilan_device === device);
  }
  find(key) {
    return this.entities().find(([, state]) => state.attributes.register_key === key);
  }
  num(key) {
    const match = this.find(key);
    if (!match) return null;
    const raw = String(match[1].state ?? '').trim();
    if (!raw || raw === 'unavailable' || raw === 'unknown' || raw === 'none') return null;
    const value = Number(raw.replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }
  on(key) { return this.find(key)?.[1].state === 'on'; }
  display(key) {
    const match = this.find(key);
    if (!match) return { text: '—', muted: true };
    const state = String(match[1].state ?? '');
    if (!state || state === 'unavailable' || state === 'unknown' || state === 'none') return { text: '—', muted: true };
    const numeric = this.num(key);
    const unit = match[1].attributes?.unit_of_measurement || '';
    if (numeric != null && unit) {
      const digits = unit === '%' || unit === 'd' || unit === 'ppm' || unit === 'min' ? 0 : 1;
      return { text: this.fmt(numeric, digits, ''), unit };
    }
    if (this._hass.formatEntityState) return { text: this._hass.formatEntityState(match[1]) };
    return { text: state };
  }
  text(key) {
    const shown = this.display(key);
    return shown.unit ? `${shown.text} ${shown.unit}` : shown.text;
  }
  valueNode(key) {
    const shown = this.display(key);
    const node = el('div', undefined, shown.muted ? 'value muted' : 'value');
    node.append(document.createTextNode(shown.text));
    if (shown.unit) node.append(el('span', shown.unit, 'unit'));
    return node;
  }
  name(key, fallback) {
    return this.find(key)?.[1].attributes.friendly_name || fallback || key;
  }
  resolvedPlant() {
    if (this.config?.plant && globalThis.NilanPlant) return NilanPlant.normalize(this.config.plant);
    if (this.remotePlant) return this.remotePlant;
    return globalThis.NilanPlant ? NilanPlant.normalize({}) : { reheater: 'none', room_source: 'entity' };
  }
  viewKey() {
    const device = this.entities()[0]?.[1].attributes.nilan_device || 'device';
    return `nilan_cts602:view:v1:${this._hass?.user?.id || 'local'}:${device}`;
  }
  viewMode() {
    const fallback = this.config?.view === 'fields' ? 'fields' : 'graphic';
    try {
      const saved = localStorage.getItem(this.viewKey());
      if (saved === 'graphic' || saved === 'fields') return saved;
    } catch { /* private mode */ }
    return fallback;
  }
  setView(mode) {
    try { localStorage.setItem(this.viewKey(), mode); } catch { /* ignore */ }
    this.render();
  }
  async entryId() {
    if (this._entryId) return this._entryId;
    const entity = this.entities()[0]?.[0];
    if (!entity || !this._hass?.callWS) return null;
    try {
      const listed = await this._hass.callWS({ type: 'config/entity_registry/get', entity_id: entity });
      this._entryId = listed.config_entry_id || null;
    } catch { this._entryId = null; }
    return this._entryId;
  }
  async loadPlant() {
    const id = await this.entryId();
    if (!id || !this._hass?.callWS || this.config?.plant) return;
    try {
      const result = await this._hass.callWS({ type: 'nilan_cts602/plant/get', entry_id: id });
      this.remotePlant = result?.plant || null;
      if (!this.shadowRoot.querySelector('dialog[open]')) this.render();
    } catch { /* the card still renders from entities */ }
  }
  async savePlant(plant) {
    if (!this.isAdmin()) {
      this.message = this.tr('Kun en administrator kan gemme anlægget.', 'Only an administrator can save the plant.');
      this.render();
      return;
    }
    const normalized = NilanPlant.normalize(plant);
    const confirmed = confirm(this.tr(
      'Gem anlægsopsætningen på integrationen? Der skrives ikke til CTS602.',
      'Save the plant on the integration? Nothing is written to the CTS602.',
    ));
    if (!confirmed) return;
    const id = await this.entryId();
    if (!id) {
      this.message = this.tr('Kunne ikke finde integrationen.', 'Could not find the integration.');
      this.render();
      return;
    }
    await this._hass.callWS({ type: 'nilan_cts602/plant/set', entry_id: id, plant: normalized });
    this.remotePlant = normalized;
    this.message = this.tr('Anlæg gemt. Integrationen genindlæses.', 'Plant saved. The integration reloads.');
    this.shadowRoot.querySelector('dialog[open]')?.close();
    this.render();
  }
  openWizard() { if (globalThis.NilanWizard) NilanWizard.open(this); }
  needsWizard() {
    const plant = this.resolvedPlant();
    return this.isAdmin() && !this.config?.plant && plant.room_source === 'entity' && !plant.room_entity && !plant.preheater && plant.reheater === 'none' && !plant.co2 && !plant.t10;
  }
  button(text, fn, cls) {
    const node = el('button', text, cls);
    node.type = 'button';
    node.onclick = fn;
    return node;
  }
  refreshLive() {
    for (const node of this.shadowRoot.querySelectorAll('[data-live]')) {
      const shown = this.display(node.dataset.live);
      node.replaceChildren(document.createTextNode(shown.text));
      if (shown.unit) node.append(el('span', shown.unit, 'unit'));
      node.classList.toggle('muted', !!shown.muted);
    }
  }
  render() {
    if (!this.config) return;
    const root = this.shadowRoot;
    const open = root.querySelector('dialog[open]');
    if (open) return;
    root.replaceChildren();
    const style = el('style');
    style.textContent = CARD_CSS;
    root.append(style);
    const card = el('ha-card');
    root.append(card);
    if (!this._libs || !this._hass) {
      card.append(el('p', this._error || this.tr('Indlæser…', 'Loading…')));
      return;
    }
    card.append(this.header());
    if (!this.entities().length) {
      card.append(el('p', this.tr('Vælg en Nilan-entitet i kortet, når der er mere end ét aggregat.', 'Choose a Nilan entity on the card when more than one unit is configured.')));
      return;
    }
    card.append(this.navigation());
    if (this.needsWizard()) {
      const banner = el('div', undefined, 'banner');
      banner.append(el('span', this.tr('Vælg hvor rumtemperaturen skal komme fra.', 'Choose where the room temperature should come from.')));
      banner.append(this.button(this.tr('Opsæt anlæg', 'Set up plant'), () => this.openWizard(), 'primary'));
      card.append(banner);
    }
    if (this.on('alarm_active')) {
      const alarm = el('div', undefined, 'alarm-banner');
      alarm.append(el('strong', this.tr('Alarm aktiv', 'Alarm active')));
      alarm.append(el('span', this.text('alarm_1')));
      card.append(alarm);
    }
    if (this.message) card.append(el('div', this.message, 'message'));
    if (this.tab === 'overview') this.overview(card);
    if (this.tab === 'alarms') this.alarms(card);
    if (this.tab === 'filter') this.filter(card);
    if (this.tab === 'settings') this.settings(card);
    const foot = el('div', undefined, 'footer');
    foot.append(el('span', this.tr('Kun læsning i 0.3.0. Tryk på grafen for værdier.', 'Read-only in 0.3.0. Tap the chart for values.')));
    foot.append(el('span', `Juulsen · ${NILAN_VERSION}`));
    card.append(foot);
    this.ensureHistory();
  }
  header() {
    const head = el('header');
    const brand = el('div', undefined, 'brand');
    brand.append(el('div', 'N', 'logo'));
    const titles = el('div');
    titles.append(el('h2', this.config.title || 'Nilan Comfort'));
    const sample = this.entities()[0]?.[1];
    const sw = sample?.attributes.sw_version || '';
    const protocol = sample?.attributes.protocol_version;
    const slave = sample?.attributes.slave_id;
    const sub = el('small');
    sub.append(document.createTextNode(`CTS602${sw ? ` · ${sw}` : ''}`));
    const detail = [];
    if (protocol != null && protocol !== '') detail.push(this.tr(`protokol ${protocol}`, `protocol ${protocol}`));
    if (slave != null && slave !== '') detail.push(this.tr(`slave ${slave}`, `slave ${slave}`));
    if (detail.length) {
      sub.append(document.createElement('br'));
      sub.append(document.createTextNode(detail.join(' · ')));
    }
    titles.append(sub);
    brand.append(titles);
    head.append(brand);
    const tools = el('div', undefined, 'head-tools');
    if (this.on('running')) tools.append(el('div', this.tr('Kører', 'Running'), 'mode-pill'));
    const toggle = el('div', undefined, 'view-toggle');
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', this.tr('Skift visning', 'Switch view'));
    for (const [value, label] of [['graphic', this.tr('Grafisk', 'Graphic')], ['fields', this.tr('Felter', 'Fields')]]) {
      const button = this.button(label, () => this.setView(value), this.viewMode() === value ? 'active' : '');
      button.setAttribute('aria-pressed', this.viewMode() === value ? 'true' : 'false');
      toggle.append(button);
    }
    tools.append(toggle);
    head.append(tools);
    return head;
  }
  navigation() {
    const nav = el('nav');
    const tabs = [
      ['overview', this.tr('Overblik', 'Overview')],
      ['alarms', this.tr('Alarmer', 'Alarms')],
      ['filter', this.tr('Filter', 'Filter')],
      ['settings', this.tr('Indstillinger', 'Settings')],
    ];
    if (!tabs.some(([key]) => key === this.tab)) this.tab = 'overview';
    for (const [key, label] of tabs) {
      const button = this.button(label, () => { this.tab = key; this.render(); }, key === this.tab ? 'active' : '');
      button.setAttribute('aria-pressed', key === this.tab ? 'true' : 'false');
      nav.append(button);
    }
    return nav;
  }
  overview(card) {
    if (this.viewMode() === 'graphic') {
      const box = el('div', undefined, 'diagram');
      if (globalThis.NilanDiagram) box.innerHTML = NilanDiagram.markup(this.resolvedPlant(), this.diagramValues());
      box.addEventListener('click', (event) => {
        const node = event.target.closest?.('[data-sensor]');
        if (node) this.moreInfo(node.getAttribute('data-sensor'));
      });
      card.append(box);
      this.statusPanel(card);
    } else {
      const grid = el('div', undefined, 'tiles');
      for (const key of NILAN_FIELDS) {
        if (!this.find(key)) continue;
        const tile = el('button', undefined, 'metric');
        tile.type = 'button';
        tile.append(el('small', this.shortName(key)));
        const value = this.valueNode(key);
        value.dataset.live = key;
        tile.append(value);
        tile.onclick = () => this.moreInfo(key);
        grid.append(tile);
      }
      card.append(grid);
    }
    this.drawChart(card, this.temperatureSeries(), this.tr('Temperatur, 24 timer', 'Temperature, 24 hours'));
    this.drawChart(card, this.efficiencySeries(), this.tr('Varmegenvinding, 24 timer', 'Heat recovery, 24 hours'));
  }
  shortName(key) {
    const names = {
      t8_outdoor: this.tr('Ude', 'Outdoor'),
      t3_extract: this.tr('Udsug', 'Extract'),
      t7_supply: this.tr('Indblæs', 'Supply'),
      t4_exhaust: this.tr('Afkast', 'Exhaust'),
      humidity: this.tr('Fugt', 'Humidity'),
      efficiency: this.tr('Afkastside', 'Exhaust side'),
      supply_fan_speed: this.tr('Indblæs ventilator', 'Supply fan'),
      extract_fan_speed: this.tr('Udsug ventilator', 'Extract fan'),
      control_state: this.tr('Drift', 'State'),
      supply_setpoint: this.tr('T7-sæt', 'T7 set'),
    };
    return names[key] || key;
  }
  pace(pct, step) {
    let speed = null;
    const percent = Number(String(pct ?? '').replace(',', '.').replace(/[^\d.]/g, ''));
    if (Number.isFinite(percent) && percent > 0) speed = percent;
    else {
      const stepNo = Number(String(step ?? '').replace(/[^\d.]/g, ''));
      if (Number.isFinite(stepNo) && stepNo > 0) speed = Math.min(100, stepNo * 25);
    }
    if (!speed || !this.on('running')) return '';
    return (2.8 - (Math.min(100, speed) / 100) * 2.15).toFixed(2);
  }
  diagramValues() {
    const bypass = this.bypassView();
    const days = this.num('filter_days_left');
    const pct = (key) => (this.num(key) == null ? '' : this.fmt(this.num(key), 0, '%'));
    const step = (key) => (this.num(key) == null ? '' : this.tr(`trin ${this.fmt(this.num(key), 0)}`, `step ${this.fmt(this.num(key), 0)}`));
    const supplyPct = pct('supply_fan_speed');
    const extractPct = pct('extract_fan_speed');
    const supplyStep = step('supply_fan_step');
    const extractStep = step('extract_fan_step');
    const supplySpin = this.pace(supplyPct, supplyStep);
    const extractSpin = this.pace(extractPct, extractStep);
    const spins = [supplySpin, extractSpin].map(Number).filter((value) => value > 0);
    return {
      running: this.on('running'),
      supplySpin,
      extractSpin,
      flowSpeed: spins.length ? (spins.reduce((sum, value) => sum + value, 0) / spins.length).toFixed(2) : '',
      t8: this.fmt(this.num('t8_outdoor'), 1, '°C'),
      t3: this.fmt(this.num('t3_extract'), 1, '°C'),
      t7: this.fmt(this.num('t7_supply'), 1, '°C'),
      t4: this.fmt(this.num('t4_exhaust'), 1, '°C'),
      t15: this.find('t15_panel') ? this.fmt(this.num('t15_panel'), 1, '°C') : '',
      room: this.fmt(this.num('room_temperature'), 1, '°C'),
      efficiency: this.fmt(this.num('efficiency'), 1, '%'),
      humidity: this.fmt(this.num('humidity'), 0, '%'),
      supplyPct,
      extractPct,
      supplyStep,
      extractStep,
      filterDays: days == null ? '' : this.fmt(days, 0, 'd'),
      filterAlarm: this.on('filter'),
      bypass: bypass.state,
      bypassShort: bypass.short,
      outdoorTitle: this.tr('T8 Udeluft', 'T8 Outdoor'),
      supplyTitle: this.tr('T7 Indblæs', 'T7 Supply'),
      extractTitle: this.tr('T3 Udsug', 'T3 Extract'),
      exhaustTitle: this.tr('T4 Afkast', 'T4 Exhaust'),
      t15Title: this.tr('T15 Panel', 'T15 Panel'),
      roomTitle: this.tr('Rum', 'Room'),
      efficiencyTitle: this.tr('Varmegenvinding', 'Heat recovery'),
      exhaust1: this.tr('Afkast', 'Exhaust'),
      exhaust2: this.tr('til det fri', 'to outside'),
      extract1: this.tr('Udsugning', 'Extract'),
      extract2: this.tr('fra boligen', 'from the home'),
      outdoor1: this.tr('Udeluft', 'Outdoor'),
      outdoor2: this.tr('fra det fri', 'from outside'),
      supply1: this.tr('Indblæsning', 'Supply'),
      supply2: this.tr('til boligen', 'to the home'),
    };
  }
  statusPanel(card) {
    const panel = el('div', undefined, 'status');
    panel.append(this.statusBlock(this.tr('Driftsstatus', 'Operating status'), [
      [this.tr('Driftstilstand', 'Operating mode'), this.stateText('operation_mode'), 'operation_mode'],
      [this.tr('Aktuel drift', 'Current state'), this.stateText('control_state'), 'control_state'],
      [this.tr('Ventilatortrin', 'Fan step'), this.find('fan_step') ? this.text('fan_step') : '—', 'fan_step'],
      [this.tr('Setpunkt', 'Setpoint'), this.find('set_temperature') ? this.text('set_temperature') : '—', 'set_temperature'],
      [this.tr('Sommerdrift', 'Summer mode'), this.onOff('summer', this.tr('Sommer', 'Summer'), this.tr('Vinter', 'Winter')), 'summer'],
      [this.tr('Alarmer', 'Alarms'), this.onOff('alarm_active', this.tr('Alarm', 'Alarm'), this.tr('Ingen', 'None')), 'alarm_active'],
    ]));
    const bypass = this.bypassView();
    const service = [
      [this.tr('Filteradvarsel', 'Filter warning'), this.onOff('filter', this.tr('Skift filter', 'Change filter'), this.tr('Ok', 'Ok')), 'filter'],
      [this.tr('Dage til skift', 'Days to change'), this.find('filter_days_left') ? this.text('filter_days_left') : '—', 'filter_days_left'],
      [this.tr('Dage siden skift', 'Days since change'), this.find('filter_days_since') ? this.text('filter_days_since') : '—', 'filter_days_since'],
      [this.tr('Bypass', 'Bypass'), bypass.chip ? bypass.chip.replace(/^Bypass\s+/i, '') : '—', 'bypass'],
      [this.tr('Rum', 'Room'), this.find('room_temperature') ? this.text('room_temperature') : '—', 'room_temperature'],
      [this.tr('T15 panel (loft)', 'T15 panel (loft)'), this.find('t15_panel') ? this.text('t15_panel') : '—', 't15_panel'],
    ];
    const block = this.statusBlock(this.tr('Filter og service', 'Filter and service'), service);
    const note = el('p', this.tr(
      'T15 er føleren i betjeningspanelet. På dette anlæg sidder panelet i loftet ved aggregatet, så tallet er ikke stuetemperaturen.',
      'T15 is the sensor in the user panel. On this unit the panel is in the loft next to the ventilator, so the value is not the living-room temperature.',
    ), 'status-note');
    block.append(note);
    panel.append(block);
    card.append(panel);
  }
  statusBlock(title, rows) {
    const section = el('section');
    section.append(el('h3', title));
    for (const [label, value, key] of rows) {
      const row = el('button', undefined, 'status-row');
      row.type = 'button';
      row.append(el('span', label));
      const lcd = el('b', value, value === '—' ? 'lcd muted' : 'lcd');
      row.append(lcd);
      if (key) row.onclick = () => this.moreInfo(key);
      section.append(row);
    }
    return section;
  }
  stateText(key) {
    const match = this.find(key);
    if (!match) return '—';
    const state = String(match[1].state ?? '');
    if (!state || state === 'unavailable' || state === 'unknown' || state === 'none') return '—';
    if (this._hass?.formatEntityState) return this._hass.formatEntityState(match[1]);
    return state;
  }
  onOff(key, onLabel, offLabel) {
    const match = this.find(key);
    if (!match) return '—';
    if (match[1].state === 'on') return onLabel;
    if (match[1].state === 'off') return offLabel;
    return '—';
  }
  bypassPosition() {
    const match = this.find('bypass');
    const position = match?.[1].attributes?.position;
    if (position === 'open' || position === 'closed') return position;
    if (match?.[1].state === 'on') return 'open';
    if (match?.[1].state === 'off') return 'closed';
    return 'unknown';
  }
  bypassView() {
    const match = this.find('bypass');
    const attrs = match?.[1].attributes || {};
    const moving = attrs.moving;
    const restored = attrs.restored === true || attrs.restored === 'true';
    const position = this.bypassPosition();
    if (moving === 'opening') return { state: 'opening', short: this.tr('åbner…', 'opening…'), chip: this.tr('Bypass åbner…', 'Bypass opening…'), kind: 'warn' };
    if (moving === 'closing') return { state: 'closing', short: this.tr('lukker…', 'closing…'), chip: this.tr('Bypass lukker…', 'Bypass closing…'), kind: 'warn' };
    if (position !== 'open' && position !== 'closed') return { state: 'unknown', short: '', chip: '', kind: 'idle' };
    const open = position === 'open';
    const label = open ? this.tr('Bypass åben', 'Bypass open') : this.tr('Bypass lukket', 'Bypass closed');
    const short = restored ? this.tr('seneste', 'last') : open ? this.tr('åben', 'open') : this.tr('lukket', 'closed');
    return {
      state: position,
      short,
      chip: restored ? `${label} · ${this.tr('seneste kendte', 'last known')}` : label,
      kind: open ? 'warn' : 'ok',
    };
  }
  chips(card) {
    const row = el('div', undefined, 'chips');
    row.append(this.chip(this.on('running') ? 'ok' : 'idle', this.on('running') ? this.tr('Kører', 'Running') : this.tr('Stoppet', 'Stopped')));
    row.append(this.chip(this.on('summer') ? 'info' : 'idle', this.on('summer') ? this.tr('Sommer', 'Summer') : this.tr('Vinter', 'Winter')));
    const bypass = this.bypassView();
    if (bypass.chip) row.append(this.chip(bypass.kind, bypass.chip));
    row.append(this.chip(this.on('filter') ? 'warn' : 'ok', this.on('filter') ? this.tr('Filter', 'Filter') : this.tr('Filter ok', 'Filter ok')));
    if (this.on('defrost')) row.append(this.chip('info', this.tr('Afrimning', 'Defrost')));
    if (this.on('user_function')) row.append(this.chip('info', this.tr('Brugerfunktion', 'User function')));
    card.append(row);
  }
  chip(kind, text) {
    const node = el('span', undefined, 'chip');
    node.append(el('i', undefined, `dot ${kind}`));
    node.append(document.createTextNode(text));
    return node;
  }
  temperatureSeries() {
    return [
      ['t8_outdoor', this.tr('Ude', 'Outdoor'), '°C'],
      ['t3_extract', this.tr('Udsug', 'Extract'), '°C'],
      ['t7_supply', this.tr('Indblæs', 'Supply'), '°C'],
      ['t4_exhaust', this.tr('Afkast', 'Exhaust'), '°C'],
    ].map(([id, name, unit]) => this.series(id, name, unit));
  }
  efficiencySeries() {
    return [this.series('efficiency', this.tr('Afkastside', 'Exhaust side'), '%')];
  }
  series(id, name, unit) {
    const history = (this._history || []).find((item) => item.id === id);
    return { id, name, unit, current: this.num(id), points: history?.points || [] };
  }
  drawChart(card, series, title) {
    card.append(el('h3', title));
    const legend = el('div', undefined, 'legend');
    for (const item of series) {
      const row = el('span');
      const swatch = el('i', undefined, 'swatch');
      swatch.style.background = globalThis.NilanChart ? NilanChart.color(item.id) : '#999';
      row.append(swatch, document.createTextNode(NilanChart.legendLine(item.name, item.current, item.unit, this.comma())));
      legend.append(row);
    }
    card.append(legend);
    const host = el('div', undefined, 'history');
    host.innerHTML = NilanChart.history(series, {
      comma: this.comma(),
      maxLabel: this.tr('Maks', 'Max'),
      empty: this.tr('Ingen historik endnu. Den kommer, når Home Assistant har optaget målingerne.', 'No history yet. It appears after Home Assistant has recorded the sensors.'),
    });
    const tip = el('div', '', 'tip');
    tip.hidden = true;
    host.append(tip);
    const move = (event) => {
      const width = host.getBoundingClientRect().width || 1;
      const ratio = (event.clientX - host.getBoundingClientRect().left) / width;
      const hit = NilanChart.nearest(series, ratio);
      const text = NilanChart.tooltipText(hit, this.comma());
      if (!text) return;
      tip.hidden = false;
      tip.textContent = text;
      tip.style.left = `${Math.max(0, Math.min(width - 140, event.clientX - host.getBoundingClientRect().left))}px`;
      const cursor = host.querySelector('[data-cursor]');
      const plot = host.querySelector('[data-plot-x]');
      if (cursor && plot) {
        const x = Number(plot.getAttribute('data-plot-x')) + ratio * Number(plot.getAttribute('data-plot-w'));
        cursor.setAttribute('x1', String(x));
        cursor.setAttribute('x2', String(x));
        cursor.setAttribute('visibility', 'visible');
      }
    };
    host.addEventListener('pointerdown', move);
    host.addEventListener('pointermove', (event) => { if (event.buttons || event.pointerType === 'touch') move(event); });
    host.addEventListener('pointerup', () => { window.setTimeout(() => { tip.hidden = true; }, 2500); });
    card.append(host);
  }
  alarms(card) {
    const count = this.num('alarm_count');
    card.append(el('p', this.tr(`Aktive alarmer: ${count ?? '—'}`, `Active alarms: ${count ?? '—'}`)));
    for (const key of ['alarm_1', 'alarm_2', 'alarm_3']) {
      const match = this.find(key);
      if (!match) continue;
      const attrs = match[1].attributes || {};
      const row = el('div', undefined, 'alarm');
      const title = this.lang() === 'da' ? (attrs.name_da || this.text(key)) : (attrs.name_en || this.text(key));
      row.append(el('strong', title));
      const detail = this.lang() === 'da' ? attrs.description_da : attrs.description_en;
      if (detail) row.append(el('p', detail));
      const when = [attrs.alarm_date, attrs.alarm_time].filter(Boolean).join(' ');
      if (when) row.append(el('small', when));
      else if (attrs.raw_date != null) row.append(el('small', this.tr(`Rå dato/tid ${attrs.raw_date} / ${attrs.raw_time}`, `Raw date/time ${attrs.raw_date} / ${attrs.raw_time}`)));
      if (attrs.code) row.append(el('small', this.tr(`Kode ${attrs.code}`, `Code ${attrs.code}`)));
      card.append(row);
    }
    card.append(el('p', this.tr('Dato og klokkeslæt afkodes bedst muligt. Hvis tallene ikke giver en gyldig dato, vises den rå værdi.', 'Date and time are decoded best-effort. If the words are not a valid date, the raw value is shown.'), 'muted'));
  }
  filter(card) {
    const since = this.num('filter_days_since');
    const left = this.num('filter_days_left');
    const grid = el('div', undefined, 'tiles');
    grid.append(this.metric(this.tr('Dage siden skift', 'Days since change'), since == null ? '—' : this.fmt(since, 0)));
    grid.append(this.metric(this.tr('Dage til skift', 'Days to change'), left == null ? '—' : this.fmt(left, 0)));
    card.append(grid);
    if (since != null && left != null && since + left > 0) {
      const pct = Math.max(0, Math.min(100, (since / (since + left)) * 100));
      const bar = el('div', undefined, 'bar');
      const fill = el('div', undefined, 'bar-fill');
      fill.style.width = `${pct}%`;
      bar.append(fill);
      card.append(bar);
    }
    card.append(el('p', this.on('filter') ? this.tr('Filteralarm er aktiv.', 'The filter alarm is active.') : this.tr('Ingen filteralarm.', 'No filter alarm.')));
    card.append(el('p', this.tr('Alarmen kommer fra alarmkode 19 eller fra at dagene til filterskift er 0. Pressostat-indgangen bruges ikke.', 'The alarm comes from alarm code 19 or from zero days left before the filter change. The pressure-switch input is not used.'), 'muted'));
  }
  metric(label, value) {
    const tile = el('div', undefined, 'metric');
    const shown = el('div', undefined, value === '—' ? 'value muted' : 'value');
    shown.append(document.createTextNode(value));
    tile.append(el('small', label), shown);
    return tile;
  }
  settings(card) {
    card.append(el('p', this.tr('Version 0.3.0 skriver ikke til regulatoren. Tallene er de aktuelle indstillinger.', 'Version 0.3.0 does not write to the controller. These are the current settings.'), 'muted'));
    for (const key of NILAN_SETTINGS) {
      const match = this.find(key);
      if (!match) continue;
      const row = el('div', undefined, 'row');
      row.append(el('span', this.shortSetting(key)));
      const value = el('strong', this.text(key));
      value.dataset.live = key;
      row.append(value);
      card.append(row);
    }
    if (this.isAdmin()) card.append(this.button(this.tr('Rediger anlæg', 'Edit plant'), () => this.openWizard(), 'primary'));
  }
  shortSetting(key) {
    const da = {
      set_temperature: 'Temperatursetpunkt', set_fan_step: 'Ventilatortrin', set_mode: 'Driftform', set_run: 'Drift',
      supply_min_summer: 'Min. indblæsning sommer', supply_min_winter: 'Min. indblæsning vinter',
      supply_max_summer: 'Maks. indblæsning sommer', supply_max_winter: 'Maks. indblæsning vinter',
      summer_limit: 'Sommergrænse', night_cool_day_limit: 'Natkøling dag', night_cool_setpoint: 'Natkøling rum',
      humidity_limit: 'Fugtegrænse', humidity_low_step: 'Fugt lavt trin', humidity_high_step: 'Fugt højt trin',
      humidity_high_time: 'Maks. tid høj fugt', week_program: 'Ugeprogram', cooling_setpoint: 'Kølesætpunkt',
      cooling_fan_step: 'Køletrin', user_function_1_type: 'Brugerfunktion 1', user_function_2_type: 'Brugerfunktion 2',
      co2_limit_low: 'CO₂ normal', co2_limit_high: 'CO₂ høj',
    };
    const en = {
      set_temperature: 'Temperature setpoint', set_fan_step: 'Fan step', set_mode: 'Mode', set_run: 'Run',
      supply_min_summer: 'Min supply summer', supply_min_winter: 'Min supply winter',
      supply_max_summer: 'Max supply summer', supply_max_winter: 'Max supply winter',
      summer_limit: 'Summer limit', night_cool_day_limit: 'Night cooling day', night_cool_setpoint: 'Night cooling room',
      humidity_limit: 'Humidity limit', humidity_low_step: 'Humidity low step', humidity_high_step: 'Humidity high step',
      humidity_high_time: 'Max high-humidity time', week_program: 'Week program', cooling_setpoint: 'Cooling setpoint',
      cooling_fan_step: 'Cooling fan step', user_function_1_type: 'User function 1', user_function_2_type: 'User function 2',
      co2_limit_low: 'CO₂ normal', co2_limit_high: 'CO₂ high',
    };
    return (this.lang() === 'da' ? da : en)[key] || key;
  }
  moreInfo(key) {
    const match = this.find(key);
    if (!match) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: match[0] }, bubbles: true, composed: true }));
  }
  async ensureHistory() {
    if (this._loadingHistory || !this._hass?.callWS) return;
    if (this._historyAt && Date.now() - this._historyAt < 60000) return;
    const ids = ['t8_outdoor', 't3_extract', 't7_supply', 't4_exhaust', 'efficiency'].map((key) => this.find(key)?.[0]).filter(Boolean);
    if (!ids.length) return;
    this._loadingHistory = true;
    try {
      const rows = await this._hass.callWS({
        type: 'history/history_during_period',
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date().toISOString(),
        entity_ids: ids,
        minimal_response: true,
        no_attributes: true,
      });
      this._history = this.normalizeHistory(rows);
      this._historyAt = Date.now();
      if (!this.shadowRoot.querySelector('dialog[open]')) this.render();
    } catch {
      this._historyAt = Date.now();
    } finally {
      this._loadingHistory = false;
    }
  }
  normalizeHistory(rows) {
    const lists = Array.isArray(rows) ? rows : [];
    const keys = {
      t8_outdoor: this.find('t8_outdoor')?.[0],
      t3_extract: this.find('t3_extract')?.[0],
      t7_supply: this.find('t7_supply')?.[0],
      t4_exhaust: this.find('t4_exhaust')?.[0],
      efficiency: this.find('efficiency')?.[0],
    };
    return Object.entries(keys).map(([id, entity]) => {
      const bucket = lists.find((list) => Array.isArray(list) && list.some((row) => row.entity_id === entity)) || [];
      const points = bucket.map((row) => [Date.parse(row.last_changed || row.last_updated || ''), Number(String(row.state ?? '').replace(',', '.'))]).filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
      return { id, points };
    });
  }
}

const CARD_CSS = `
:host{display:block;container-type:inline-size;width:100%;min-width:0;
  --nilan-bg:var(--ha-card-background,var(--card-background-color,#14171c));
  --nilan-fg:var(--primary-text-color,#e8eef6);
  --nilan-muted:var(--secondary-text-color,#93a0b0);
  --nilan-line:var(--divider-color,#2a3342);
  --nilan-control:var(--secondary-background-color,#1b212b);
  --nilan-chip:color-mix(in srgb,var(--nilan-fg) 6%,var(--nilan-bg));
  --nilan-accent:#1f8a70;--nilan-cold:#4aa3ff;--nilan-warm:#e07a3d;--nilan-ok:#1f9d55;
  --nilan-radius:var(--ha-card-border-radius,1.25rem);
  --nilan-font:var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,ui-sans-serif,system-ui,sans-serif));
  font-family:var(--nilan-font);color:var(--nilan-fg);font-size:1rem}
*{box-sizing:border-box;font-family:inherit}
ha-card{display:block;width:100%;padding:0.9rem;background:var(--nilan-bg);color:var(--nilan-fg);border-radius:var(--nilan-radius);border:1px solid var(--nilan-line);overflow:hidden}
header{display:flex;justify-content:space-between;gap:0.5rem;align-items:center;margin-bottom:0.55rem}
h2{font-size:1.15rem;margin:0;font-weight:650;letter-spacing:-0.01em}h3{font-size:0.82rem;margin:0.85rem 0 0.25rem;font-weight:650}
small,.muted{color:var(--nilan-muted)}
.brand{display:flex;gap:10px;align-items:center;min-width:0}
.logo{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:var(--nilan-accent);color:#04221c;font-weight:750;flex:none}
.brand small{display:block}
.head-tools{display:flex;align-items:center;gap:8px;flex:none}
.mode-pill{border-radius:999px;padding:0.35rem 0.65rem;background:color-mix(in srgb,#1f9d55 22%,var(--nilan-control));font-size:0.75rem;font-weight:650}
.view-toggle{display:flex;border:1px solid var(--nilan-line);border-radius:12px;overflow:hidden;background:var(--nilan-control)}
nav{display:flex;gap:2px;overflow:auto;margin:0 0 10px;border-bottom:1px solid var(--nilan-line)}
button,input,select{font:inherit;font-size:0.875rem;border:1px solid var(--nilan-line);border-radius:0.65rem;padding:0.5rem 0.65rem;color:var(--nilan-fg);background:var(--nilan-control)}
button{cursor:pointer}
.view-toggle button,.nav button{background:transparent;border-color:transparent;border-radius:0;color:var(--nilan-muted)}
.view-toggle button.active,nav button.active{color:var(--nilan-fg)}
nav button.active{box-shadow:inset 0 -2px 0 var(--nilan-accent)}
.primary{background:var(--nilan-accent);color:#04221c;border-color:transparent}
.diagram{border-radius:calc(var(--nilan-radius) - 0.25rem);overflow:hidden;background:var(--nilan-chip);margin-bottom:0.5rem}
.diagram svg{display:block;width:100%;height:auto}
.history svg{display:block;width:100%;height:auto;max-height:220px}
.status{display:grid;grid-template-columns:1fr;gap:0.55rem;margin:0.15rem 0 0.7rem}
.status section{background:var(--nilan-chip);border:1px solid var(--nilan-line);border-radius:calc(var(--nilan-radius) - 0.3rem);padding:0.55rem 0.7rem 0.45rem}
.status h3{margin:0 0 0.2rem;font-size:0.68rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--nilan-muted);font-weight:700}
.status-row{display:flex;justify-content:space-between;align-items:center;gap:0.6rem;width:100%;padding:0.28rem 0;background:transparent;border:0;border-radius:0;text-align:left}
.status-row span{color:var(--nilan-muted);font-size:0.78rem}
.lcd{font-variant-numeric:tabular-nums;background:color-mix(in srgb,var(--nilan-bg) 84%,#000);color:var(--nilan-fg);border:1px solid var(--nilan-line);border-radius:0.35rem;padding:0.12rem 0.45rem;min-width:4.6rem;text-align:right;font-weight:680;font-size:0.82rem;box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 12%,transparent)}
.lcd.muted{color:var(--nilan-muted);font-weight:550}
.status-note{margin:0.35rem 0 0.15rem;font-size:0.68rem;line-height:1.35;color:var(--nilan-muted)}
.chips{display:flex;flex-wrap:wrap;gap:0.4rem;margin:0.5rem 0}
.chip{display:inline-flex;align-items:center;gap:0.35rem;border:1px solid var(--nilan-line);border-radius:999px;padding:0.22rem 0.55rem;font-size:0.75rem;font-variant-numeric:tabular-nums;background:color-mix(in srgb,var(--nilan-fg) 4%,var(--nilan-bg))}
.dot{width:7px;height:7px;border-radius:50%;background:#9aa6b5;display:inline-block}
.dot.ok{background:#1f9d55}.dot.warn{background:#e0a15a}.dot.info{background:#4aa3ff}.dot.idle{background:#9aa6b5}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.metric{text-align:left;padding:12px;border-radius:14px;background:var(--nilan-chip);color:inherit;min-width:0}
.metric small{display:block;min-height:2.4em;color:var(--nilan-muted)}
.value{font-size:1.35rem;font-weight:650;font-variant-numeric:tabular-nums;letter-spacing:-0.02em}
.value .unit{font-size:0.62em;font-weight:550;color:var(--nilan-muted);margin-left:0.2em}
.legend{display:flex;flex-wrap:wrap;gap:0.45rem 0.75rem;font-size:0.75rem;margin:0.25rem 0 0.4rem;font-variant-numeric:tabular-nums}
.legend span{display:inline-flex;align-items:center;gap:6px}
.swatch{width:16px;height:3px;border-radius:2px;display:inline-block}
.history{position:relative;margin-top:4px}
.tip{position:absolute;top:8px;z-index:2;pointer-events:none;background:color-mix(in srgb,var(--nilan-bg) 88%,#000);color:var(--nilan-fg);border:1px solid var(--nilan-line);padding:6px 8px;border-radius:8px;font-size:12px;white-space:pre;max-width:220px}
.banner,.alarm-banner,.message{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:10px 12px;border-radius:12px;margin-bottom:10px}
.banner{background:color-mix(in srgb,var(--nilan-accent) 16%,var(--nilan-control))}
.alarm-banner{background:color-mix(in srgb,#d64545 18%,var(--nilan-control));border:1px solid #d64545}
.message{background:var(--nilan-control);white-space:pre-wrap}
.alarm{padding:8px 0;border-top:1px solid var(--nilan-line)}
.alarm p{margin:4px 0}
.row{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid var(--nilan-line)}
.bar{height:8px;border-radius:8px;background:var(--nilan-line);margin:8px 0;overflow:hidden}
.bar-fill{height:100%;background:var(--nilan-accent)}
.footer{display:flex;justify-content:space-between;gap:0.5rem;font-size:0.75rem;color:var(--nilan-muted);margin-top:0.75rem}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
dialog{max-width:min(520px,94vw);border:1px solid var(--nilan-line);border-radius:18px;padding:18px;background:var(--nilan-bg);color:var(--nilan-fg)}
dialog::backdrop{background:#0008}
dialog label{display:flex;gap:8px;align-items:center;margin:8px 0}
dialog select{display:block;width:100%;margin-top:6px}
button:focus-visible,select:focus-visible{outline:2px solid var(--nilan-accent);outline-offset:2px}
@container (min-width:720px){
  .tiles{grid-template-columns:repeat(4,minmax(0,1fr))}
  ha-card{padding:16px}
}
@container (min-width:680px){
  .status{grid-template-columns:1fr 1fr}
}
@container (max-width:420px){
  ha-card{padding:12px}
  nav button{padding:8px;font-size:13px}
  .value{font-size:1.2rem}
  header{align-items:flex-start}
}
`;

class NilanCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }
  _render() {
    if (!this._config || !this.shadowRoot) return;
    const root = this.shadowRoot;
    root.replaceChildren();
    const style = el('style');
    style.textContent = 'label{display:block;margin:8px 0;font:14px sans-serif}select,input{width:100%;margin-top:4px}';
    root.append(style);
    const language = el('label', 'Language / sprog');
    const lang = document.createElement('select');
    for (const [value, label] of [['', 'Auto'], ['da', 'Dansk'], ['en', 'English']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      lang.append(option);
    }
    lang.value = this._config.language || '';
    lang.onchange = () => this._commit({ language: lang.value || undefined });
    language.append(lang);
    const viewLabel = el('label', 'View / visning');
    const view = document.createElement('select');
    for (const [value, label] of [['graphic', 'Grafisk'], ['fields', 'Felter']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      view.append(option);
    }
    view.value = this._config.view === 'fields' ? 'fields' : 'graphic';
    view.onchange = () => this._commit({ view: view.value });
    viewLabel.append(view);
    root.append(language, viewLabel);
  }
  _commit(patch) {
    this._config = { ...this._config, ...patch };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

customElements.define('nilan-cts602-card', NilanCard);
customElements.define('nilan-cts602-card-editor', NilanCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'custom:nilan-cts602-card',
  name: 'Nilan CTS602',
  description: 'Comfort 300 LR overview, alarms, filter and read-only settings',
  preview: true,
});

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Nilan CTS602 dashboard. Writes go through number, select and button entities. */
const NILAN_VERSION = '0.5.2';
const NILAN_AUTHOR = 'Juulsen';
const NILAN_STATIC = '/nilan_cts602-static/';

async function nilanLoadLibs() {
  if (globalThis.NilanPlant && globalThis.NilanDiagram && globalThis.NilanChart && globalThis.NilanWizard && globalThis.NilanSettings) return;
  for (const file of ['nilan-plant.js', 'nilan-diagram.js', 'nilan-chart.js', 'nilan-wizard.js', 'nilan-settings.js']) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${NILAN_STATIC}${file}?v=${NILAN_VERSION}`;
      script.onload = () => resolve();
      script.onerror = () => reject(Error(file));
      (document.head || document.documentElement).append(script);
    });
  }
}

const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined && text !== null) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};

class NilanCard extends HTMLElement {
  static getConfigElement() { return document.createElement('nilan-cts602-card-editor'); }
  static getStubConfig() { return { theme: 'light' }; }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.tab = 'overview';
    this._draft = {};
    this._history = null;
  }
  setConfig(config) {
    this.config = { ...config };
    if (config?.tab) this.tab = config.tab;
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
    if (this._overlay) {
      this.refreshLive();
      return;
    }
    this.render();
  }
  getCardSize() { return this.tab === 'overview' ? 12 : 8; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 'auto' }; }
  tr(da, en) { return this.lang() === 'da' ? da : en; }
  lang() { return String(this.config?.language || this._hass?.language || 'en').startsWith('da') ? 'da' : 'en'; }
  hmiTheme() {
    const choice = String(this.config?.theme || 'light');
    if (choice === 'dark') return 'dark';
    if (choice === 'auto') return this._hass?.themes?.darkMode === true ? 'dark' : 'light';
    return 'light';
  }
  comma() { return this.lang() === 'da'; }
  isAdmin() { return !!this._hass?.user?.is_admin; }
  viewMode() { return 'graphic'; }
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
  resolvedPlant() {
    if (this.config?.plant && globalThis.NilanPlant) return NilanPlant.normalize(this.config.plant);
    if (this.remotePlant) return this.remotePlant;
    return globalThis.NilanPlant ? NilanPlant.normalize({}) : { reheater: 'none', room_source: 'entity', version: 2 };
  }
  narrow() {
    if (this.config?.layout === 'mobile') return true;
    if (this.config?.layout === 'desktop') return false;
    return (this.getBoundingClientRect().width || 800) < 700;
  }
  async entryId() {
    if (this.config?.entry_id) return this.config.entry_id;
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
      if (!this._overlay) this.render();
    } catch { /* the card still renders from entities */ }
  }
  refreshLive() {
    this.shadowRoot.querySelectorAll('[data-live]').forEach((node) => {
      const shown = this.display(node.dataset.live);
      node.textContent = shown.unit ? `${shown.text} ${shown.unit}` : shown.text;
    });
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
  button(label, action, cls) {
    const node = el('button', label, cls || '');
    node.type = 'button';
    node.onclick = (event) => { event.preventDefault(); action(); };
    return node;
  }
  render() {
    const root = this.shadowRoot;
    const theme = this.hmiTheme();
    root.replaceChildren();
    const style = el('style');
    style.textContent = CARD_CSS;
    const card = document.createElement('ha-card');
    card.dataset.hmi = theme;
    this.toggleAttribute('data-hmi', true);
    this.dataset.hmi = theme;
    this.toggleAttribute('data-narrow', this.narrow());
    if (this._error) card.append(el('p', this._error));
    else if (!this._libs || !globalThis.NilanDiagram) card.append(el('p', 'Nilan…'));
    else {
      this.header(card);
      this.tabs(card);
      if (this._notice) card.append(el('p', this._notice.text, this._notice.ok ? 'saved' : 'error'));
      if (this.tab === 'overview') this.overview(card);
      else if (this.tab === 'filter') this.alarms(card);
      else if (this.tab === 'week') this.week(card);
      else if (this.tab === 'service') this.service(card);
      else this.settings(card);
      this.footer(card);
    }
    root.append(style, card);
    if (this.config?.demoConfirm && globalThis.NilanSettings) {
      const sample = NilanSettings.SETTINGS.find((item) => item.key === 'ctrl_fan_step');
      if (sample) this.openConfirm(sample, '3');
    }
    if (this._helpItem) this.openHelp(this._helpItem);
    if (this._confirm) this.paintConfirm();
  }
  header(card) {
    const head = el('header');
    const brand = el('div', undefined, 'brand');
    const title = el('div');
    title.append(el('h2', 'Ventilation – Nilan Comfort 300 LR'));
    const protocol = this.find('protocol_version')?.[1].state || '9';
    const software = this.find('sw_version')?.[1].state || '';
    title.append(el('small', `CTS602 · protokol ${protocol}${software ? ` · SW ${software}` : ''} · slave 10`));
    brand.append(title);
    const tools = el('div', undefined, 'head-tools');
    const mode = this.display('operation_mode').text;
    const step = this.display('fan_step').text;
    const alarms = this.num('alarm_count') || 0;
    const alarmText = alarms
      ? this.tr(`${alarms} alarmer`, `${alarms} alarms`)
      : (this.narrow() ? 'OK' : this.tr('ingen alarmer', 'no alarms'));
    const pill = this.narrow()
      ? `${mode} · ${this.tr('trin', 'step')} ${step} · ${alarmText}`
      : `${this.tr('Drift', 'Run')} · ${mode} · ${this.tr('trin', 'step')} ${step} · ${alarmText}`;
    tools.append(el('span', pill, 'mode-pill'));
    if (this.isAdmin()) tools.append(el('span', 'Admin', 'admin'));
    head.append(brand, tools);
    card.append(head);
  }
  tabs(card) {
    const wrap = el('div', undefined, 'tabs');
    const nav = el('nav');
    for (const [id, da, en] of NilanSettings.TABS) {
      const button = this.button(this.tr(da, en), () => { this.tab = id; this._confirm = null; this.render(); }, this.tab === id ? 'active' : '');
      nav.append(button);
    }
    const fade = el('span', '›', 'tab-fade');
    fade.setAttribute('aria-hidden', 'true');
    wrap.append(nav, fade);
    card.append(wrap);
  }
  footer(card) {
    const foot = el('footer');
    foot.append(el('span', this.isAdmin()
      ? this.tr('Skriver kun som admin · bekræftelse og genlæsning', 'Writes only as admin · confirmation and read-back')
      : this.tr('Kun læsning', 'Read only')));
    foot.append(el('span', `© ${NILAN_AUTHOR} · Nilan CTS602 v${NILAN_VERSION}`));
    card.append(foot);
  }
  overview(card) {
    const plant = this.resolvedPlant();
    const bypass = this.bypassView();
    const host = el('div', undefined, 'diagram');
    host.innerHTML = NilanDiagram.markup(plant, {
      t8: this.text('t8_outdoor'),
      t3: this.text('t3_extract'),
      t4: this.text('t4_exhaust'),
      t7: this.text('t7_supply'),
      t15: this.text('t15_panel'),
      rh: this.text('humidity'),
      eff: this.text('efficiency'),
      m3: this.text('extract_fan_speed'),
      m4: this.text('supply_fan_speed'),
      bypass: bypass.state,
      bypassLabel: bypass.short || '',
      filterAlarm: this.on('filter'),
      running: this.on('running'),
      extractSpin: this.pace(this.text('extract_fan_speed'), ''),
      supplySpin: this.pace(this.text('supply_fan_speed'), ''),
      compact: this.narrow(),
    });
    host.querySelectorAll('[data-sensor]').forEach((node) => {
      node.style.cursor = 'pointer';
      node.onclick = () => this.openHistory(node.dataset.sensor === 'humidity' ? 'humidity' : node.dataset.sensor);
    });
    card.append(host);
    const chips = el('div', undefined, 'chips');
    const season = this.on('summer') ? this.tr('Sommer', 'Summer') : this.tr('Vinter', 'Winter');
    const bypassChip = bypass.state === 'closed' ? this.tr('Lukket', 'Closed') : bypass.state === 'open' ? this.tr('Åben', 'Open') : (bypass.short || '—');
    const filterLeft = this.num('filter_days_left');
    const chipRows = [
      [this.tr('Fugt (RH, fraluft)', 'Humidity (RH, extract)'), this.text('humidity'), ''],
      [this.tr('Bypass M7', 'Bypass M7'), bypassChip, ''],
      [this.tr('Filter, dage til skift', 'Filter, days to change'), filterLeft == null ? '—' : `${this.fmt(filterLeft, 0)} d`, ''],
      [this.tr('Setpunkt', 'Setpoint'), this.text('set_temperature'), ''],
      [this.tr('T15 panel (loft)', 'T15 panel (loft)'), this.text('t15_panel'), 'warm'],
      [this.tr('Sommer/vinter', 'Summer/winter'), season, ''],
    ];
    for (const [label, value, cls] of chipRows) {
      const chip = el('div', undefined, `chip ${cls}`.trim());
      chip.append(el('small', label), el('strong', value));
      chips.append(chip);
    }
    card.append(chips);
    const grid = el('div', undefined, 'value-grid');
    for (const [key, da, en] of [
      ['t8_outdoor', 'T8 udeluft', 'T8 outdoor'],
      ['t3_extract', 'T3 fraluft', 'T3 extract'],
      ['t4_exhaust', 'T4 afkast', 'T4 exhaust'],
      ['t7_supply', 'T7 tilluft', 'T7 supply'],
      ['humidity', 'Fugt', 'Humidity'],
      ['bypass', 'Bypass', 'Bypass'],
      ['filter_days_left', 'Filter', 'Filter'],
      ['t15_panel', 'T15 (loft)', 'T15 (loft)'],
    ]) {
      const tile = el('button', undefined, key === 't15_panel' ? 'tile warm' : 'tile');
      tile.type = 'button';
      tile.append(el('small', this.tr(da, en)));
      const value = key === 'bypass' ? bypass.short || '—' : key === 'filter_days_left' ? (this.num(key) == null ? '—' : `${this.fmt(this.num(key), 0)} d`) : this.text(key);
      tile.append(el('strong', value));
      if (key !== 'bypass') tile.onclick = () => this.openHistory(key);
      grid.append(tile);
    }
    card.append(grid);
  }
  settings(card) {
    const plant = this.resolvedPlant();
    const items = NilanSettings.SETTINGS.filter((item) => item.tab === this.tab);
    const sections = [...new Set(items.map((item) => item.section))];
    if (!this.isAdmin()) card.append(el('p', this.tr('Du kan se værdierne, men kun en administrator kan gemme.', 'You can see the values, but only an administrator can save.'), 'muted'));
    const sheet = el('div', undefined, 'sheet');
    for (const section of sections) {
      const heading = NilanSettings.SECTIONS[section] || [section, section];
      const box = el('section');
      box.append(el('h3', this.tr(heading[0], heading[1])));
      let any = false;
      let noted = false;
      for (const item of items.filter((entry) => entry.section === section)) {
        if (!NilanSettings.visible(item, plant)) {
          if (item.experimental && !noted) {
            box.append(el('p', this.tr('Eksperimentelle indstillinger i dette afsnit er skjult, indtil Eksperimentel slås til under Service.', 'Experimental settings in this section stay hidden until Experimental is switched on under Service.'), 'muted experimental-note'));
            noted = true;
            any = true;
          }
          continue;
        }
        box.append(this.settingRow(item));
        any = true;
      }
      if (any) sheet.append(box);
    }
    card.append(sheet);
  }
  settingRow(item) {
    const row = el('div', undefined, 'setting');
    const head = el('div', undefined, 'setting-head');
    const title = el('div', undefined, 'setting-title');
    title.append(el('strong', this.tr(item.name[0], item.name[1])));
    if (item.experimental) title.append(el('span', this.tr('EKSPERIMENTEL', 'EXPERIMENTAL'), 'badge'));
    head.append(title);
    const info = this.button('i', () => { this._helpItem = item; this.render(); }, 'info');
    head.append(info);
    row.append(head);
    row.append(el('p', this.tr(item.explain[0], item.explain[1]), 'explain'));
    row.append(el('p', `${this.tr('Område', 'Range')} ${item.range} · ${item.register}`, 'meta'));
    const current = this.currentValue(item);
    const draft = this._draft[item.key];
    const shown = draft === undefined ? current : draft;
    row.append(this.control(item, shown));
    const status = el('p', this.tr(`Læst fra anlægget`, 'Read from the unit'), 'meta');
    status.dataset.live = item.key;
    if (draft !== undefined && String(draft) !== String(current)) {
      const save = this.button(this.tr('Gem…', 'Save…'), () => this.openConfirm(item, draft), 'primary');
      if (!this.isAdmin()) save.disabled = true;
      row.append(save);
    }
    row.append(status);
    return row;
  }
  currentValue(item) {
    const match = this.find(item.key);
    if (!match) return item.kind === 'number' ? item.min : item.options?.[0]?.[0];
    if (item.kind === 'number') {
      const value = this.num(item.key);
      return value == null ? item.min : value;
    }
    const state = String(match[1].state || '');
    return state && state !== 'unknown' && state !== 'unavailable' ? state : item.options?.[0]?.[0];
  }
  control(item, shown) {
    if (!this.isAdmin() || item.kind === 'button') {
      if (item.kind === 'button') {
        const button = this.button(this.tr('Udfør…', 'Run…'), () => this.openConfirm(item, true), 'primary');
        if (!this.isAdmin()) button.disabled = true;
        return button;
      }
      return el('div', this.labelOf(item, shown), 'readonly');
    }
    if (item.kind === 'select' && item.options.length <= 4) return this.segments(item, shown);
    if (item.kind === 'select') return this.dropdown(item, shown);
    return this.stepper(item, shown);
  }
  segments(item, shown) {
    const wrap = el('div', undefined, 'segments');
    for (const [value, da, en] of item.options) {
      if (value === 'external_heater_offset' && !this.resolvedPlant().options_board) continue;
      const button = this.button(this.tr(da, en), () => { this._draft[item.key] = value; this.render(); }, String(shown) === value ? 'active' : '');
      wrap.append(button);
    }
    return wrap;
  }
  dropdown(item, shown) {
    const input = document.createElement('select');
    for (const [value, da, en] of item.options) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = this.tr(da, en);
      input.append(option);
    }
    input.value = String(shown || '');
    input.onchange = () => { this._draft[item.key] = input.value; this.render(); };
    return input;
  }
  stepper(item, shown) {
    const wrap = el('div', undefined, 'stepper');
    const value = Number(shown);
    wrap.append(this.button('−', () => { this._draft[item.key] = Math.max(item.min, roundStep(value - item.step, item.step)); this.render(); }));
    const field = document.createElement('input');
    field.type = 'number';
    field.min = String(item.min);
    field.max = String(item.max);
    field.step = String(item.step);
    field.value = String(value);
    field.onchange = () => { this._draft[item.key] = Number(field.value); this.render(); };
    wrap.append(field);
    wrap.append(el('span', item.unit || '', 'unit'));
    wrap.append(this.button('+', () => { this._draft[item.key] = Math.min(item.max, roundStep(value + item.step, item.step)); this.render(); }));
    return wrap;
  }
  labelOf(item, shown) {
    if (item.kind === 'select') {
      const found = (item.options || []).find((option) => option[0] === shown);
      if (found) return this.tr(found[1], found[2]);
    }
    if (item.kind === 'number') return `${this.fmt(shown, String(item.step).includes('.') ? 1 : 0, '')} ${item.unit || ''}`.trim();
    return String(shown ?? '—');
  }
  openConfirm(item, next) {
    this._confirm = { item, next, accepted: false };
    this._helpItem = null;
    this.paintConfirm();
  }
  paintConfirm() {
    if (!this._confirm) return;
    this.shadowRoot.querySelector('.overlay')?.remove();
    const { item, next } = this._confirm;
    const risk = (item.high || []).includes(next) ? 'high' : (item.risk || 'low');
    const overlay = el('div', undefined, 'overlay');
    const dialog = el('div', undefined, 'dialog');
    dialog.append(el('p', this.tr('BEKRÆFT SKRIVNING', 'CONFIRM WRITE'), 'kicker'));
    dialog.append(el('h3', this.tr('Skriv til ventilationsanlægget?', 'Write to the ventilation unit?')));
    const table = el('dl');
    const rows = [
      [this.tr('Indstilling', 'Setting'), this.tr(item.name[0], item.name[1])],
      [this.tr('Nu', 'Now'), this.labelOf(item, this.currentValue(item))],
      [this.tr('Ny værdi', 'New value'), item.kind === 'button' ? this.tr(item.name[0], item.name[1]) : this.labelOf(item, next)],
      [this.tr('Tilladt', 'Allowed'), item.range],
      [this.tr('Register', 'Register'), `${item.register} · ${40001 + item.address} · FC16 count ${item.key === 'ctrl_sync_clock' ? 6 : 1}`],
      [this.tr('Risiko', 'Risk'), this.riskText(risk)],
    ];
    for (const [label, value] of rows) {
      const dd = el('dd', value);
      if (label === this.tr('Risiko', 'Risk')) dd.className = `risk ${risk}`;
      table.append(el('dt', label), dd);
    }
    dialog.append(table);
    if (risk === 'high') {
      const label = el('label', this.tr('Jeg forstår, at anlægget stopper', 'I understand that the unit will stop'), 'check');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.onchange = () => { this._confirm.accepted = box.checked; };
      label.prepend(box);
      dialog.append(label);
    }
    dialog.append(el('p', this.tr('Efter skrivning læses registret igen. Stemmer det ikke, vises fejlen, og den rigtige værdi beholdes.', 'After the write the register is read again. If it does not match, the error is shown and the real value stays.'), 'muted'));
    const actions = el('div', undefined, 'actions');
    actions.append(this.button(this.tr('Annullér', 'Cancel'), () => { this._confirm = null; this.render(); }));
    const go = this.button(this.tr('Skriv og genlæs', 'Write and read back'), () => this.commit(item, next, risk), 'primary');
    actions.append(go);
    dialog.append(actions);
    overlay.append(dialog);
    this.shadowRoot.append(overlay);
    this._overlay = overlay;
  }
  riskText(risk) {
    if (risk === 'high') return this.tr('HØJ. Kan stoppe anlægget.', 'HIGH. Can stop the unit.');
    if (risk === 'medium') return this.tr('MIDDEL. Påvirker drift eller energi og kan fortrydes.', 'MEDIUM. Affects operation or energy and can be undone.');
    return this.tr('LAV. Komfort, let at fortryde.', 'LOW. Comfort, easy to undo.');
  }
  async commit(item, next, risk) {
    if (risk === 'high' && !this._confirm?.accepted) {
      this._notice = { ok: false, text: this.tr('Sæt flueben ved den høje risiko først.', 'Tick the high-risk box first.') };
      this.render();
      return;
    }
    if (this.config?.preview) {
      const now = new Date();
      const stamp = now.toLocaleTimeString(this.lang() === 'da' ? 'da-DK' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
      this._notice = { ok: true, text: this.tr(`Gemt og genlæst kl. ${stamp}: ${this.tr(item.name[0], item.name[1])}`, `Saved and read back at ${stamp}: ${item.name[1]}`) };
      this._confirm = null;
      this._draft = {};
      this.render();
      return;
    }
    if (!this._hass?.callService) {
      this._notice = { ok: false, text: this.tr('Entiteten findes ikke endnu. Genstart Home Assistant efter opdateringen.', 'The entity is not here yet. Restart Home Assistant after the update.') };
      this._confirm = null;
      this.render();
      return;
    }
    try {
      if (item.key === 'ctrl_reset_alarm') {
        const entry = await this.entryId();
        await this._hass.callService('nilan_cts602', 'reset_alarm', { entry_id: entry, code: Number(next) });
      } else {
        const match = this.find(item.key);
        if (!match) {
          this._notice = { ok: false, text: this.tr('Entiteten findes ikke endnu. Genstart Home Assistant efter opdateringen.', 'The entity is not here yet. Restart Home Assistant after the update.') };
          this._confirm = null;
          this.render();
          return;
        }
        if (item.kind === 'number') await this._hass.callService('number', 'set_value', { entity_id: match[0], value: Number(next) });
        else if (item.kind === 'select') await this._hass.callService('select', 'select_option', { entity_id: match[0], option: String(next) });
        else await this._hass.callService('button', 'press', { entity_id: match[0] });
      }
      const now = new Date();
      const stamp = now.toLocaleTimeString(this.lang() === 'da' ? 'da-DK' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
      this._notice = { ok: true, text: `${this.tr('Gemt og genlæst', 'Saved and read back')} kl. ${stamp}` };
      delete this._draft[item.key];
    } catch (err) {
      this._notice = { ok: false, text: String(err?.message || err) };
    }
    this._confirm = null;
    this._overlay = null;
    this.render();
  }
  openHelp(item) {
    const overlay = el('div', undefined, 'overlay');
    const dialog = el('div', undefined, 'dialog');
    dialog.append(el('h3', this.tr('Hvad betyder en ændring?', 'What does a change mean?')));
    dialog.append(el('p', this.tr(item.help[0], item.help[1])));
    dialog.append(el('p', item.register, 'meta'));
    dialog.append(this.button(this.tr('Luk', 'Close'), () => { this._helpItem = null; this.render(); }, 'primary'));
    overlay.append(dialog);
    this.shadowRoot.append(overlay);
  }
  week(card) {
    this.settings(card);
    const box = el('section');
    box.append(el('h3', this.tr('Fabriksprogrammernes indhold', 'Factory program contents')));
    box.append(el('p', this.tr('Tiderne kan ikke læses fra anlægget på protokol 9. Teksten er fra manualen.', 'The times cannot be read from the unit on protocol 9. The text is from the manual.'), 'explain'));
    for (const [da, en, text] of NilanSettings.WEEK_TEXT) {
      box.append(el('strong', this.tr(da, en)));
      box.append(el('p', text, 'explain'));
    }
    card.append(box);
  }
  alarms(card) {
    const since = this.num('filter_days_since');
    const left = this.num('filter_days_left');
    const box = el('section');
    box.append(el('h3', this.tr('Filter', 'Filter')));
    box.append(el('p', this.tr(
      `Dage siden ${since ?? '—'} · dage til ${left ?? '—'} · interval ${since != null && left != null ? since + left : '—'} dage. Filterintervallet kan ikke skrives på protokol 9.`,
      `Days since ${since ?? '—'} · days left ${left ?? '—'} · interval ${since != null && left != null ? since + left : '—'} days. The filter interval cannot be written on protocol 9.`,
    ), 'explain'));
    const filter = NilanSettings.SETTINGS.find((item) => item.key === 'ctrl_reset_filter');
    if (filter) box.append(this.settingRow(filter));
    card.append(box);
    const alarms = el('section');
    alarms.append(el('h3', this.tr('Aktive alarmer', 'Active alarms')));
    for (const key of ['alarm_1', 'alarm_2', 'alarm_3']) {
      const match = this.find(key);
      if (!match) continue;
      const attrs = match[1].attributes || {};
      if (!attrs.code) continue;
      const row = el('div', undefined, 'alarm');
      row.append(el('strong', this.lang() === 'da' ? (attrs.name_da || this.text(key)) : (attrs.name_en || this.text(key))));
      const detail = this.lang() === 'da' ? attrs.description_da : attrs.description_en;
      if (detail) row.append(el('p', detail, 'explain'));
      const reset = this.button(this.tr('Nulstil', 'Reset'), () => {
        const item = { key: 'ctrl_reset_alarm', kind: 'button', name: ['Nulstil alarm', 'Reset alarm'], explain: ['Kvitterer alarmen.', 'Acknowledges the alarm.'], help: ['', ''], range: `1${attrs.code}`, register: 'H400 Alarm.Reset', address: 400, risk: 'low', high: [] };
        this.openConfirm(item, attrs.code);
      }, 'primary');
      if (!this.isAdmin()) reset.disabled = true;
      row.append(reset);
      alarms.append(row);
    }
    const all = NilanSettings.SETTINGS.find((item) => item.key === 'ctrl_reset_all');
    if (all) alarms.append(this.settingRow(all));
    card.append(alarms);
  }
  service(card) {
    const plant = this.resolvedPlant();
    const box = el('section');
    box.append(el('h3', this.tr('Udstyr', 'Equipment')));
    box.append(el('p', this.tr('Ændrer kun tegning og entiteter. Der skrives ikke til anlægget. El- og vand-eftervarmer udelukker hinanden.', 'Changes only the drawing and the entities. Nothing is written to the unit. Electric and water reheater exclude each other.'), 'explain'));
    for (const [key, da, en] of [
      ['preheater', 'El-forvarmer', 'Electric preheater'],
      ['reheater_electric', 'El-eftervarmer', 'Electric reheater'],
      ['reheater_water', 'Vand-eftervarmer', 'Water reheater'],
      ['options_board', 'Optionsprint', 'Option board'],
      ['co2', 'CO₂-føler', 'CO₂ sensor'],
      ['t10', 'T10 ekstern rumføler', 'T10 external room sensor'],
      ['experimental', 'Eksperimentel', 'Experimental'],
    ]) {
      const label = el('label', this.tr(da, en), 'toggle');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!plant[key];
      input.disabled = !this.isAdmin();
      input.onchange = () => this.togglePlant(key, input.checked);
      label.append(input);
      box.append(label);
    }
    if (this.isAdmin()) box.append(this.button(this.tr('Gem udstyr', 'Save equipment'), () => this.savePlant(this._plantDraft || plant), 'primary'));
    card.append(box);
    const clock = el('section');
    clock.append(el('h3', this.tr('Ur', 'Clock')));
    clock.append(el('p', `${this.tr('Regulatorens ur', 'Controller clock')}: ${this.text('controller_time')}`, 'explain'));
    const sync = NilanSettings.SETTINGS.find((item) => item.key === 'ctrl_sync_clock');
    if (sync) clock.append(this.settingRow(sync));
    card.append(clock);
    const link = el('section');
    link.append(el('h3', this.tr('Forbindelse', 'Connection')));
    link.append(el('p', `protokol ${this.text('protocol_version')} · SW ${this.text('sw_version')} · slave ${this.find('t8_outdoor')?.[1].attributes?.slave_id || '10'}`, 'explain'));
    card.append(link);
    const missing = el('section');
    missing.append(el('h3', this.tr('Ikke tilgængeligt på protokol 9', 'Not available on protocol 9')));
    for (const [title, text] of NilanSettings.UNAVAILABLE) {
      missing.append(el('strong', title));
      missing.append(el('p', text, 'explain'));
    }
    card.append(missing);
  }
  togglePlant(key, on) {
    const draft = { ...(this._plantDraft || this.resolvedPlant()) };
    draft[key] = on;
    if (key === 'reheater_electric' && on) draft.reheater_water = false;
    if (key === 'reheater_water' && on) draft.reheater_electric = false;
    this._plantDraft = draft;
    this.render();
  }
  async savePlant(plant) {
    const normalized = NilanPlant.normalize(plant);
    const id = await this.entryId();
    if (!id || !this._hass?.callWS) return;
    const question = this.tr('Gem udstyr på kortet? Der skrives ikke til anlægget.', 'Save the equipment on the card? Nothing is written to the unit.');
    if (!confirm(question)) return;
    await this._hass.callWS({ type: 'nilan_cts602/plant/set', entry_id: id, plant: normalized });
    this.remotePlant = normalized;
    this._plantDraft = null;
    this._notice = { ok: true, text: this.tr('Udstyr gemt. Home Assistant genindlæser entiteterne.', 'Equipment saved. Home Assistant reloads the entities.') };
    this.render();
  }
  openHistory(key) {
    this._historyKey = key;
    this.ensureHistory().then(() => {
      const overlay = el('div', undefined, 'overlay');
      const dialog = el('div', undefined, 'dialog');
      dialog.append(el('h3', this.tr('Seneste 24 timer', 'Last 24 hours')));
      const host = el('div', undefined, 'history');
      const series = [this.series(key, key, '')];
      const empty = this.tr('Ingen historik endnu. Den kommer, når Home Assistant har optaget målingerne.', 'No history yet. It appears after Home Assistant has recorded the measurements.');
      host.innerHTML = globalThis.NilanChart ? NilanChart.history(series, { comma: this.comma(), maxLabel: this.tr('Maks', 'Max'), empty }) : '';
      if (!(series[0].points || []).length) host.append(el('p', empty, 'chart-empty'));
      dialog.append(host);
      dialog.append(this.button(this.tr('Luk', 'Close'), () => overlay.remove(), 'primary'));
      overlay.append(dialog);
      this.shadowRoot.append(overlay);
    });
  }
  series(id, name, unit) {
    const history = (this._history || []).find((item) => item.id === id);
    return { id, name, unit, current: this.num(id), points: history?.points || [] };
  }
  async ensureHistory() {
    if (this._loadingHistory || !this._hass?.callWS) return;
    if (this._historyAt && Date.now() - this._historyAt < 60000) return;
    const wanted = ['t8_outdoor', 't3_extract', 't7_supply', 't4_exhaust', 'efficiency', 'humidity', 't15_panel'].map((key) => {
      const match = this.find(key);
      if (!match) return null;
      return { key, entity: match[0], stateClass: match[1].attributes?.state_class || '' };
    }).filter(Boolean);
    if (!wanted.length) return;
    this._loadingHistory = true;
    const end = new Date();
    const start = new Date(Date.now() - 86400000);
    try {
      let rows = null;
      try {
        rows = await this._hass.callWS({
          type: 'history/history_during_period',
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          entity_ids: wanted.map((item) => item.entity),
          minimal_response: true,
          no_attributes: true,
          significant_changes_only: false,
        });
      } catch { rows = null; }
      const parsed = globalThis.NilanChart ? NilanChart.parseHistory(rows) : {};
      const missing = () => wanted.filter((item) => item.stateClass && !(parsed[item.entity] || []).length);
      for (const period of ['5minute', 'hour']) {
        const still = missing();
        if (!still.length || !globalThis.NilanChart) break;
        try {
          const stats = await this._hass.callWS({
            type: 'recorder/statistics_during_period',
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            statistic_ids: still.map((item) => item.entity),
            period,
            types: ['mean', 'state'],
          });
          const fromStats = NilanChart.parseStatistics(stats);
          for (const item of still) {
            if ((fromStats[item.entity] || []).length) parsed[item.entity] = fromStats[item.entity];
          }
        } catch { /* the next period is the fallback */ }
      }
      this._history = wanted.map((item) => ({ id: item.key, points: parsed[item.entity] || [] }));
      this._historyAt = Date.now();
    } catch {
      this._history = wanted.map((item) => ({ id: item.key, points: [] }));
      this._historyAt = Date.now();
    } finally {
      this._loadingHistory = false;
    }
  }
}

function roundStep(value, step) {
  const places = String(step).includes('.') ? 1 : 0;
  const snapped = Math.round(value / step) * step;
  return Number(snapped.toFixed(places));
}

const CARD_CSS = `
:host{
  display:block;width:100%;min-width:0;container-type:inline-size;
  color:var(--primary-text-color,#1c2830);font-family:var(--ha-font-family-body,system-ui,sans-serif);
  --card-bg:#f4f7fa;
  --hmi-housing:#f7fafc;--hmi-box:#ffffff;--hmi-ink:#1c2830;--hmi-muted:#5c6b7a;
  --hmi-line:#c5d0dc;--hmi-outline:#6e7d8c;--hmi-frame:#b7c3d0;--hmi-bore:#f4f7fb;
  --hx-fill:#f3faf6;--hx-line:#2f8a4a;
  --plaque:#e7f6ee;--plaque-line:#2f8a4a;--panel:#fff7e8;--panel-line:#e0b15a;
  --filter-fill:#e5f6ee;--filter-stroke:#2f8a4a;--alarm:#c4473a;--drop:#7eb7d8;
  --flow-outdoor:#2f6fe0;--flow-extract:#d4533a;--flow-exhaust:#6b5bd0;--flow-supply:#e08a2c
}
:host([data-hmi="dark"]){
  color:#e7eef4;
  --card-bg:#12181e;
  --hmi-housing:#1b222c;--hmi-box:#1b222c;--hmi-ink:#e7eef4;--hmi-muted:#b7c5d3;
  --hmi-line:#3a4858;--hmi-outline:#c5d3e0;--hmi-frame:#8aa0b4;--hmi-bore:#12181e;
  --hx-fill:#15241c;--hx-line:#8fd4a8;
  --plaque:#163228;--plaque-line:#3d9a62;--panel:#3a2e18;--panel-line:#e0b15a;
  --filter-fill:#1a3328;--filter-stroke:#8fd4a8;--alarm:#ff8d82;--drop:#8ec8e6;
  --flow-outdoor:#7eb0ff;--flow-extract:#ff8d72;--flow-exhaust:#c4b6f5;--flow-supply:#ffb15a
}
ha-card{display:block;background:var(--card-bg,#f4f7fa);border-radius:18px;padding:14px 14px 8px;overflow:hidden}
header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;min-width:0}
.brand{min-width:0}
.head-tools{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;max-width:100%}
h2{margin:0;font-size:1.15rem} h3{margin:0 0 8px;font-size:.95rem}
small,.muted,.explain,.meta{color:var(--secondary-text-color,#5c6b7a)}
.explain{margin:4px 0;font-size:.86rem;line-height:1.35}
.meta{margin:0 0 8px;font-size:.75rem}
.mode-pill,.admin{border-radius:999px;padding:6px 10px;background:#e5f6ea;color:#14663a;font-size:.78rem;font-weight:650}
.admin{background:#e7eef6;color:#245;margin-left:6px}
:host([data-hmi="dark"]) .mode-pill{background:#1c3b2c;color:#b7ebc9}
:host([data-hmi="dark"]) small,:host([data-hmi="dark"]) .muted,:host([data-hmi="dark"]) .explain,:host([data-hmi="dark"]) .meta{color:#b7c5d3}
.tabs{position:relative}
nav{display:flex;gap:6px;overflow-x:auto;padding:10px 28px 12px 0;scrollbar-width:none}
nav::-webkit-scrollbar{display:none}
nav button{border:0;background:transparent;color:inherit;padding:8px 10px;border-radius:999px;white-space:nowrap}
nav button.active{background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08);font-weight:700}
:host([data-hmi="dark"]) nav button.active{background:#1c2630}
.tab-fade{display:none}
.diagram{width:100%;min-width:0}
.diagram svg{width:100%;height:auto;display:block}
section{background:#fff;border:1px solid #e1e7ee;border-radius:16px;padding:14px;margin:0 0 12px}
:host([data-hmi="dark"]) section{background:#171e27;border-color:#2a3644}
.setting{padding:10px 0;border-top:1px solid #eef2f6}
.sheet{display:grid;gap:12px;align-items:start}
@container (min-width: 760px){.sheet{grid-template-columns:1fr 1fr}}
.setting-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.setting-title{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.badge{font-size:.68rem;letter-spacing:.04em;font-weight:700;color:#6d28d9;background:#f3e8ff;border-radius:999px;padding:2px 8px}
.segments{display:flex;gap:6px;flex-wrap:wrap}
.segments button,.stepper button,button.primary,button.info{border:1px solid #d5dee8;background:#f7f9fb;border-radius:10px;padding:8px 12px;color:inherit}
.segments button.active,button.primary{background:#1f8a4c;color:#fff;border-color:#1f8a4c}
.stepper{display:flex;gap:8px;align-items:center}
.stepper input,select{border:1px solid #d5dee8;border-radius:10px;padding:8px;background:#fff;color:inherit;min-width:4.5rem}
.readonly{font-weight:700}
.overlay{position:fixed;inset:0;background:rgba(15,23,32,.45);display:grid;place-items:center;z-index:20;padding:16px}
.dialog{background:#fff;color:#1c2830;border-radius:18px;padding:18px;max-width:460px;width:min(100%,460px);box-shadow:0 16px 50px rgba(0,0,0,.2)}
:host([data-hmi="dark"]) .dialog{background:#171e27;color:#e7eef4}
.kicker{letter-spacing:.08em;font-size:.72rem;color:#5c6b7a;margin:0}
dl{display:grid;grid-template-columns:8rem 1fr;gap:6px 10px;margin:10px 0}
dt{color:#5c6b7a} dd{margin:0;font-weight:650}
.risk{display:inline-block;border-radius:999px;padding:2px 8px;font-size:.78rem;font-weight:700}
.risk.low{background:#e5f6ea;color:#14663a}
.risk.medium{background:#fff4d6;color:#8a5a00}
.risk.high{background:#fde8e6;color:#8d2a22}
.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.saved{background:#e5f6ea;color:#14663a;border-radius:12px;padding:10px 12px}
.error{background:#fde8e6;color:#8d2a22;border-radius:12px;padding:10px 12px}
footer{display:flex;justify-content:space-between;gap:8px;font-size:.75rem;color:#5c6b7a;padding:6px 2px 2px}
.chips{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:8px}
.chip{background:#fff;border:1px solid #e1e7ee;border-radius:14px;padding:8px 10px;min-width:0}
.chip.warm{background:#fff7e8;border-color:#e0b15a}
.chip small{display:block;color:#5c6b7a;font-size:.72rem}
.chip strong{display:block;font-size:1rem;overflow-wrap:anywhere}
.value-grid{display:none;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.tile{text-align:left;border:1px solid #e1e7ee;background:#fff;border-radius:14px;padding:10px}
.tile small{display:block;color:#5c6b7a} .tile strong{font-size:1.2rem}
:host([data-narrow]) header{flex-direction:column;align-items:stretch}
:host([data-narrow]) .head-tools{justify-content:flex-start}
:host([data-narrow]) .mode-pill{white-space:normal;max-width:100%}
:host([data-narrow]) .channel-value{display:none}
:host([data-narrow]) .chips{display:none}
:host([data-narrow]) .value-grid{display:grid}
:host([data-narrow]) .tab-fade{
  display:flex;align-items:center;justify-content:flex-end;
  position:absolute;right:0;top:4px;bottom:4px;width:46px;pointer-events:none;
  background:linear-gradient(90deg,transparent,var(--card-bg) 58%);
  color:var(--hmi-muted);font-weight:700;font-size:1.15rem
}
:host([data-hmi="dark"]) .chip,:host([data-hmi="dark"]) .tile{background:#171e27;border-color:#2a3644;color:#e7eef4}
:host([data-hmi="dark"]) .chip.warm{background:#3a2e18;border-color:#e0b15a}
:host([data-hmi="dark"]) .stepper input,:host([data-hmi="dark"]) select,:host([data-hmi="dark"]) .segments button,:host([data-hmi="dark"]) button.info{background:#12181e;border-color:#2a3644;color:#e7eef4}
:host([data-hmi="dark"]) .segments button.active,:host([data-hmi="dark"]) button.primary{background:#1f8a4c;color:#fff;border-color:#1f8a4c}
:host([data-hmi="dark"]) .badge{background:#3b2760;color:#e9d5ff}
.toggle{display:flex;justify-content:space-between;gap:12px;padding:8px 0;align-items:center}
.alarm{padding:8px 0;border-top:1px solid #eef2f6}
.history{min-height:180px}
.chart-empty{margin:8px 0;color:#5c6b7a}
.info{width:28px;height:28px;border-radius:50%;padding:0}
.check{display:flex;gap:8px;align-items:center;margin:8px 0}
`;

class NilanCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this.render(); }
  set hass(hass) { this._hass = hass; }
  render() {
    if (!this._config) return;
    this.replaceChildren();
    const theme = document.createElement('select');
    for (const [value, label] of [['light', 'Lys'], ['dark', 'Mørk'], ['auto', 'Auto']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      theme.append(option);
    }
    theme.value = this._config.theme || 'light';
    theme.onchange = () => this._commit({ theme: theme.value });
    const language = document.createElement('select');
    for (const [value, label] of [['', 'Home Assistant'], ['da', 'Dansk'], ['en', 'English']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      language.append(option);
    }
    language.value = this._config.language || '';
    language.onchange = () => this._commit({ language: language.value });
    this.append(el('label', 'Tema '), theme, el('label', ' Sprog '), language);
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
  name: 'Nilan CTS602 by Juulsen',
  description: 'Comfort 300 LR counterflow overview and settings by Juulsen',
  preview: true,
});

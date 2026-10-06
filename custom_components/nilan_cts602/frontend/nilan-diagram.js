// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Single-line counterflow schematic.
   Outdoor air enters top-left and leaves as supply bottom-right.
   Extract air enters top-right and leaves as exhaust bottom-left. */
(function (root) {
  const STYLE = `
      .housing{fill:var(--hmi-housing);stroke:var(--hmi-outline);stroke-width:3}
      .split{fill:none;stroke:var(--hmi-outline);stroke-width:2.6}
      .duct{fill:none;stroke-width:3.2;stroke-linecap:round}
      .duct.outdoor{stroke:var(--flow-outdoor)}
      .duct.extract{stroke:var(--flow-extract)}
      .duct.exhaust{stroke:var(--flow-exhaust)}
      .duct.supply{stroke:var(--flow-supply)}
      .hx-hex{fill:none;stroke:var(--hx-line);stroke-width:3}
      .hx-hatch{fill:none;stroke:var(--hx-line);stroke-width:1.1;opacity:.35}
      .filter-panel{fill:none;stroke:var(--filter-stroke);stroke-width:3}
      .filter.alarm .filter-panel{stroke:var(--alarm)}
      .sensor{fill:var(--hmi-box);stroke-width:2.6}
      .sensor.outdoor{stroke:var(--flow-outdoor)}
      .sensor.extract{stroke:var(--flow-extract)}
      .sensor.exhaust{stroke:var(--flow-exhaust)}
      .sensor.supply{stroke:var(--flow-supply)}
      .sensor-label{font-weight:750;text-anchor:middle}
      .sensor-label.outdoor{fill:var(--flow-outdoor)}
      .sensor-label.extract{fill:var(--flow-extract)}
      .sensor-label.exhaust{fill:var(--flow-exhaust)}
      .sensor-label.supply{fill:var(--flow-supply)}
      .fan{fill:var(--hmi-box);stroke:var(--hmi-ink);stroke-width:2.8}
      .blades{fill:var(--hmi-ink)}
      .hub{fill:var(--hmi-box);stroke:var(--hmi-ink);stroke-width:1.4}
      .fan-unit[style] .blades{animation:nilan-spin linear infinite;transform-origin:0 0}
      .tag{font-weight:650;fill:var(--hmi-ink)}
      .side{font-weight:650;fill:var(--hmi-muted)}
      .muted{fill:var(--hmi-muted)}
      .value-text{font-weight:750;fill:var(--hmi-ink)}
      .duct-temp.out{fill:var(--flow-outdoor)}
      .duct-temp.ext{fill:var(--flow-extract)}
      .duct-temp.exh{fill:var(--flow-exhaust)}
      .duct-temp.sup{fill:var(--flow-supply)}
      .eff-value{fill:var(--hx-line)}
      .plaque,.panel{fill:var(--hmi-box)}
      .plaque{stroke:var(--plaque-line);stroke-width:1.6}
      .panel{stroke:var(--hmi-muted);stroke-width:1.5}
      .damper-ring{fill:var(--hmi-box);stroke:var(--hmi-ink);stroke-width:2.6}
      .damper{fill:none;stroke:var(--hmi-ink);stroke-width:3;stroke-linecap:round}
      .coil{fill:none;stroke:var(--alarm);stroke-width:2.6}
      @media (prefers-reduced-motion: reduce){.fan-unit[style] .blades{animation:none}}
      @keyframes nilan-spin{to{transform:rotate(360deg)}}
  `;

  function markup(plant, state) {
    const data = state || {};
    if (data.compact) return draw(plant, data, phone());
    return draw(plant, data, desk());
  }

  function desk() {
    return {
      compact: false,
      vb: '0 0 1100 660',
      housing: [48, 86, 1004, 520],
      splitY: 346,
      centreX: 550,
      yIn: 196,
      yOut: 470,
      tempTop: 176,
      tempBottom: 548,
      nameTop: 138,
      nameBottom: 582,
      bypassY: 118,
      xL: 16,
      xR: 1084,
      ductIn: 210,
      temp: 34,
      name: 16,
      badge: 20,
      badgeR: 18,
      fanR: 26,
      fanText: 18,
      bypass: 18,
    };
  }

  function phone() {
    return {
      compact: true,
      vb: '0 0 500 470',
      housing: [28, 128, 444, 286],
      splitY: 270,
      centreX: 250,
      yIn: 172,
      yOut: 360,
      tempTop: 66,
      tempBottom: 432,
      nameTop: 40,
      nameBottom: 456,
      bypassY: 92,
      xL: 8,
      xR: 492,
      ductIn: 118,
      temp: 28,
      name: 13,
      badge: 20,
      badgeR: 16,
      fanR: 18,
      fanText: 22,
      bypass: 20,
    };
  }

  function draw(plant, data, box) {
    const [hx, hy, hw, hh] = box.housing;
    const right = hx + hw;
    const bottom = hy + hh;
    const tempL = hx + 16;
    const tempR = right - 16;
    const nameY = box.nameTop;
    const bottomName = box.nameBottom;
    const plaques = box.compact ? '' : `
  <g class="channel-value">
    <rect class="plaque" x="16" y="10" width="250" height="64" rx="10"/>
    <text class="tag" font-size="15" x="28" y="32">Varmegenvinding</text>
    <text class="muted" font-size="12" x="28" y="48">(T3−T4)/(T3−T8)</text>
    <text class="value-text eff-value" font-size="22" x="250" y="52" text-anchor="end" data-live="efficiency">${escape(data.eff || '—')}</text>
    <rect class="panel" x="820" y="10" width="264" height="64" rx="10"/>
    <text class="tag" font-size="15" x="836" y="36">CTS-panel · T15</text>
    <text class="muted" font-size="12" x="836" y="54">loft</text>
    <text class="value-text" font-size="22" x="1068" y="50" text-anchor="end" data-live="t15_panel">${escape(data.t15 || '—')}</text>
  </g>`;
    return `
<svg class="${box.compact ? 'compact' : 'desk'}" viewBox="${box.vb}" data-diagram="counterflow" role="img">
  <title>Modstrømsveksler</title>
  ${defs()}
  ${plaques}
  <rect class="housing" x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="16" data-part="housing"/>
  <line class="split" x1="${hx}" y1="${box.splitY}" x2="${right}" y2="${box.splitY}"/>
  <line class="split" x1="${box.centreX}" y1="${box.splitY}" x2="${box.centreX}" y2="${bottom}" data-part="centre-split"/>
  ${fitCoils(plant, box)}
  ${roofFilters(data.filterAlarm, box)}
  ${hexagon(box)}
  <line class="duct outdoor" x1="${box.xL}" y1="${box.yIn}" x2="${box.ductIn}" y2="${box.yIn}" marker-end="url(#arr-outdoor)"/>
  <line class="duct extract" x1="${box.xR}" y1="${box.yIn}" x2="${right - (box.ductIn - hx)}" y2="${box.yIn}" marker-end="url(#arr-extract)"/>
  <line class="duct exhaust" x1="${box.ductIn}" y1="${box.yOut}" x2="${box.xL}" y2="${box.yOut}" marker-end="url(#arr-exhaust)"/>
  <line class="duct supply" x1="${right - (box.ductIn - hx)}" y1="${box.yOut}" x2="${box.xR}" y2="${box.yOut}" marker-end="url(#arr-supply)"/>
  ${sensor(box.centreX - box.badgeR * 4.2, box.yIn + 8, 'T8', 't8_outdoor', 'outdoor', box)}
  ${sensor(box.centreX + box.badgeR * 3.2, box.yIn + 8, 'T3', 't3_extract', 'extract', box)}
  ${sensor(box.centreX + box.badgeR * 6.1, box.yIn + box.badgeR * 2.6, 'RH', 'humidity', 'extract', box)}
  ${sensor(box.centreX - box.badgeR * 5.2, box.yOut - box.badgeR * 1.1, 'T4', 't4_exhaust', 'exhaust', box)}
  ${sensor(box.centreX + box.badgeR * 5.2, box.yOut - box.badgeR * 1.1, 'T7', 't7_supply', 'supply', box)}
  ${damper(box, data)}
  ${fan(box.ductIn - 8, box.yOut, 'extract_fan', data.extractSpin, data.m3, box)}
  ${fan(right - (box.ductIn - hx) + 8, box.yOut, 'supply_fan', data.supplySpin, data.m4, box)}
  <text class="side" font-size="${box.name}" x="${tempL}" y="${nameY}">Udeluft</text>
  <text class="side" font-size="${box.name}" x="${tempR}" y="${nameY}" text-anchor="end">Fraluft</text>
  <text class="duct-temp value-text out" font-size="${box.temp}" x="${tempL}" y="${box.tempTop}" data-live="t8_outdoor">${escape(data.t8 || '—')}</text>
  <text class="duct-temp value-text ext" font-size="${box.temp}" x="${tempR}" y="${box.tempTop}" text-anchor="end" data-live="t3_extract">${escape(data.t3 || '—')}</text>
  <text class="duct-temp value-text exh" font-size="${box.temp}" x="${tempL}" y="${box.tempBottom}" data-live="t4_exhaust">${escape(data.t4 || '—')}</text>
  <text class="duct-temp value-text sup" font-size="${box.temp}" x="${tempR}" y="${box.tempBottom}" text-anchor="end" data-live="t7_supply">${escape(data.t7 || '—')}</text>
  <text class="side" font-size="${box.name}" x="${tempL}" y="${bottomName}">Afkast</text>
  <text class="side" font-size="${box.name}" x="${tempR}" y="${bottomName}" text-anchor="end">Tilluft</text>
</svg>`;
  }

  function fitCoils(plant, box) {
    const fit = plant || {};
    const [hx, , hw] = box.housing;
    const pre = fit.preheater ? coil(hx + 28, box.yIn - 8, 'preheater') : '';
    const post = fit.reheater === 'water'
      ? `${coil(hx + hw - 92, box.yOut - 8, 'reheater')}${valve(hx + hw - 64, box.yOut + 16)}`
      : fit.reheater === 'electric'
        ? coil(hx + hw - 92, box.yOut - 8, 'reheater')
        : '';
    return `${pre}${post}`;
  }

  function hexagon(box) {
    const cx = box.centreX;
    const cy = box.splitY + (box.compact ? 8 : 10);
    const w = box.compact ? 78 : 150;
    const h = box.compact ? 92 : 176;
    const points = [
      [cx, cy - h / 2],
      [cx + w / 2, cy - h / 4],
      [cx + w / 2, cy + h / 4],
      [cx, cy + h / 2],
      [cx - w / 2, cy + h / 4],
      [cx - w / 2, cy - h / 4],
    ].map((pair) => pair.map((n) => Math.round(n)).join(',')).join(' ');
    const hatch = [
      `M ${cx - w / 4} ${cy - h / 5} L ${cx + w / 4} ${cy + h / 5}`,
      `M ${cx + w / 4} ${cy - h / 5} L ${cx - w / 4} ${cy + h / 5}`,
      `M ${cx} ${cy - h / 3} L ${cx} ${cy + h / 3}`,
    ].join(' ');
    return `<polygon class="hx-hex" points="${points}" data-part="exchanger"/>
  <path class="hx-hatch" d="${hatch}"/>`;
  }

  function roofFilters(alarm, box) {
    const cls = alarm ? 'filter alarm' : 'filter';
    const cx = box.centreX;
    const apex = box.yIn - (box.compact ? 6 : 10);
    const foot = box.splitY - (box.compact ? 18 : 28);
    const half = box.compact ? 108 : 210;
    const thick = box.compact ? 12 : 18;
    const left = `M ${cx - 10} ${apex + 6} L ${cx - half} ${foot} L ${cx - half + thick} ${foot + 6} L ${cx + 2} ${apex + 16} Z`;
    const right = `M ${cx + 10} ${apex + 6} L ${cx + half} ${foot} L ${cx + half - thick} ${foot + 6} L ${cx - 2} ${apex + 16} Z`;
    return `<g data-part="filter" data-filter="outdoor" class="${cls}"><path class="filter-panel" d="${left}"/></g>
    <g data-part="filter" data-filter="extract" class="${cls}"><path class="filter-panel" d="${right}"/></g>`;
  }

  function damper(box, data) {
    const bypass = data.bypass || 'closed';
    const cx = box.centreX;
    const cy = box.yIn - (box.compact ? 18 : 28);
    const open = `M ${cx - 12} ${cy} H ${cx + 12}`;
    const shut = `M ${cx - 9} ${cy + 9} L ${cx + 9} ${cy - 9}`;
    const d = bypass === 'open' ? open : shut;
    const stateLine = data.bypassLabel || (bypass === 'open' ? 'åben' : bypass === 'closed' ? 'lukket' : '');
    const labelY = box.bypassY;
    return `<circle class="damper-ring" cx="${cx}" cy="${cy}" r="${box.compact ? 11 : 14}"/>
  <path class="damper" d="${d}" data-part="bypass" data-state="${bypass}" data-open="${open}" data-closed="${shut}"/>
  <text class="tag" font-size="${box.bypass}" x="${cx}" y="${labelY}" text-anchor="middle">Bypass</text>
  <text class="muted" font-size="${box.bypass}" x="${cx}" y="${labelY + box.bypass + 2}" text-anchor="middle" data-live="fmt:bypass">${escape(stateLine)}</text>`;
  }

  function defs() {
    const marker = (id, color) => `<marker id="${id}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="var(${color})"/></marker>`;
    return `
  <defs>
    ${marker('arr-outdoor', '--flow-outdoor')}
    ${marker('arr-extract', '--flow-extract')}
    ${marker('arr-exhaust', '--flow-exhaust')}
    ${marker('arr-supply', '--flow-supply')}
    <style>${STYLE}</style>
  </defs>`;
  }

  function sensor(x, y, name, key, tone, box) {
    const px = Math.round(x);
    const py = Math.round(y);
    return `<g data-sensor="${key}">
      <circle class="sensor ${tone}" cx="${px}" cy="${py}" r="${box.badgeR}"/>
      <text class="sensor-label ${tone}" font-size="${box.badge}" x="${px}" y="${py + Math.round(box.badge * 0.34)}">${name}</text>
    </g>`;
  }

  function fan(cx, cy, part, spin, speed, box) {
    const motion = spin ? ` style="animation-duration:${spin}s"` : '';
    const speedKey = part === 'extract_fan' ? 'extract_fan_speed' : 'supply_fan_speed';
    return `<g data-part="${part}" class="fan-unit" transform="translate(${cx} ${cy})"${motion}>
      <circle class="fan" r="${box.fanR}"/>
      <path class="blades" d="M0,-3 C10,-6 18,-22 6,-24 C-2,-14 -1,-6 0,-3 Z"/>
      <path class="blades" d="M0,-3 C10,-6 18,-22 6,-24 C-2,-14 -1,-6 0,-3 Z" transform="rotate(120)"/>
      <path class="blades" d="M0,-3 C10,-6 18,-22 6,-24 C-2,-14 -1,-6 0,-3 Z" transform="rotate(240)"/>
      <circle class="hub" r="4.5"/>
    </g>
  <text class="muted fan-speed" font-size="${box.fanText}" x="${cx}" y="${cy - box.fanR - 6}" text-anchor="middle" data-live="${speedKey}">${escape(speed || '')}</text>`;
  }

  function coil(x, y, part) {
    return `<path class="coil" data-part="${part}" d="M ${x} ${y} q 8 -14 16 0 t 16 0 t 16 0"/>`;
  }

  function valve(x, y) {
    return `<path data-part="valve" d="M ${x} ${y} l 14 -8 v 16 z" fill="var(--drop)"/>`;
  }

  function escape(value) {
    return String(value ?? '').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
  }

  root.NilanDiagram = { markup };
})(typeof globalThis === 'undefined' ? window : globalThis);

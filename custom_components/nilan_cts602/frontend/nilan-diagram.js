// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Counterflow cross-section matching the approved principle drawing.
   Outdoor air enters top-left and leaves as supply bottom-right.
   Extract air enters top-right and leaves as exhaust bottom-left. */
(function (root) {
  const STYLE = `
      .housing{fill:var(--hmi-housing);stroke:var(--hmi-outline);stroke-width:2.2}
      .split{fill:none;stroke:var(--hmi-outline);stroke-width:1.6}
      .duct{fill:none;stroke:var(--hmi-frame);stroke-width:30;stroke-linecap:round}
      .flow{fill:none;stroke-width:5.5;stroke-linecap:round;stroke-linejoin:round}
      .flow.outdoor{stroke:var(--flow-outdoor)}
      .flow.extract{stroke:var(--flow-extract)}
      .flow.exhaust{stroke:var(--flow-exhaust)}
      .flow.supply{stroke:var(--flow-supply)}
      .moving{stroke-dasharray:10 12;animation:nilan-flow 1.15s linear infinite}
      .big-arrow{stroke:none}
      .big-arrow.outdoor{fill:var(--flow-outdoor)}
      .big-arrow.extract{fill:var(--flow-extract)}
      .big-arrow.exhaust{fill:var(--flow-exhaust)}
      .big-arrow.supply{fill:var(--flow-supply)}
      .hx-hex{fill:var(--hx-fill);stroke:var(--hx-line);stroke-width:2.4}
      .hx-hatch{fill:url(#nilan-hex);stroke:none}
      .hx-label{font-size:16px;font-weight:700;fill:var(--hmi-ink);text-anchor:middle}
      .cts-tag{fill:var(--hmi-box);stroke:var(--hmi-line);stroke-width:1.2}
      .filter-panel{fill:var(--filter-fill);stroke:var(--filter-stroke);stroke-width:2}
      .filter-pleat{fill:none;stroke:var(--filter-stroke);stroke-width:1.3}
      .filter.alarm .filter-panel,.filter.alarm .filter-pleat{stroke:var(--alarm)}
      .sensor{fill:var(--hmi-box);stroke-width:2.4}
      .sensor.outdoor{stroke:var(--flow-outdoor)}
      .sensor.extract{stroke:var(--flow-extract)}
      .sensor.exhaust{stroke:var(--flow-exhaust)}
      .sensor.supply{stroke:var(--flow-supply)}
      .sensor-label{font-size:13px;font-weight:750;text-anchor:middle}
      .sensor-label.outdoor{fill:var(--flow-outdoor)}
      .sensor-label.extract{fill:var(--flow-extract)}
      .sensor-label.exhaust{fill:var(--flow-exhaust)}
      .sensor-label.supply{fill:var(--flow-supply)}
      .fan{fill:var(--hmi-box);stroke:var(--hmi-ink);stroke-width:2}
      .blades{fill:var(--hmi-ink)}
      .hub{fill:var(--hmi-box);stroke:var(--hmi-ink);stroke-width:1.2}
      .fan-unit[style] .blades{animation:nilan-spin linear infinite;transform-origin:0 0}
      .tag{font-size:14px;font-weight:650;fill:var(--hmi-ink)}
      .side{font-size:16px;font-weight:750;fill:var(--hmi-ink)}
      .muted{font-size:13px;fill:var(--hmi-muted)}
      .value-text{font-size:32px;font-weight:750}
      .out .value-text{fill:var(--flow-outdoor)}
      .ext .value-text{fill:var(--flow-extract)}
      .exh .value-text{fill:var(--flow-exhaust)}
      .sup .value-text{fill:var(--flow-supply)}
      .eff-value{fill:var(--hx-line)}
      .vbox,.plaque,.panel{fill:var(--hmi-box)}
      .vbox{stroke-width:2}
      .vbox.out{stroke:var(--flow-outdoor)}
      .vbox.ext{stroke:var(--flow-extract)}
      .vbox.exh{stroke:var(--flow-exhaust)}
      .vbox.sup{stroke:var(--flow-supply)}
      .plaque{stroke:var(--plaque-line);stroke-width:1.6}
      .panel{stroke:var(--hmi-muted);stroke-width:1.5;stroke-dasharray:5 4}
      .swatch{fill:var(--plaque-line)}
      .leader{fill:none;stroke:var(--hmi-muted);stroke-width:1.4;stroke-dasharray:4 4}
      .damper-ring{fill:var(--hmi-box);stroke:var(--hmi-ink);stroke-width:1.8}
      .damper{fill:none;stroke:var(--hmi-ink);stroke-width:2.4;stroke-linecap:round}
      .drop{fill:var(--drop)}
      .coil{fill:none;stroke:var(--alarm);stroke-width:2.2}
      svg.compact .hx-label{font-size:22px}
      svg.compact .tag{font-size:18px}
      svg.compact .sensor-label{font-size:16px}
      svg.compact .verbose{display:none}
      @media (prefers-reduced-motion: reduce){.moving,.fan-unit[style] .blades{animation:none}}
      @keyframes nilan-flow{to{stroke-dashoffset:-44}}
      @keyframes nilan-spin{to{transform:rotate(360deg)}}
  `;

  const HEX = '380,108 498,178 498,324 380,394 262,324 262,178';

  function markup(plant, state) {
    const data = state || {};
    if (data.compact) return compact(plant, data);
    return desktop(plant, data);
  }

  function desktop(plant, data) {
    const move = data.running ? 'moving' : '';
    return `
<svg viewBox="0 0 1100 690" data-diagram="counterflow" role="img">
  <title>Modstrømsveksler</title>
  ${defs()}
  <g class="channel-value">
    <rect class="plaque" x="12" y="8" width="250" height="112" rx="12"/>
    <text class="tag" x="26" y="32">Varmegenvinding</text>
    <text class="muted" x="26" y="52">(T3−T4)/(T3−T8)</text>
    <text class="value-text eff-value" font-size="32" x="26" y="100" data-sensor="efficiency">${escape(data.eff || '—')}</text>
    <rect class="panel" x="400" y="8" width="300" height="112" rx="12"/>
    <rect class="swatch" x="416" y="28" width="18" height="18" rx="3"/>
    <text class="tag" x="442" y="42">CTS-panel · T15</text>
    <text class="muted" x="442" y="64">loft</text>
    <text class="value-text" font-size="32" x="684" y="78" text-anchor="end" data-sensor="t15_panel">${escape(data.t15 || '—')}</text>
    <line class="leader" x1="550" y1="120" x2="550" y2="191"/>
  </g>
  <text class="side" x="16" y="200">Udeluft</text>
  <text class="muted" x="16" y="218">fra det fri</text>
  <text class="side" x="1084" y="200" text-anchor="end">Fraluft</text>
  <text class="muted" x="1084" y="218" text-anchor="end">fra boligen</text>
  <text class="side" x="16" y="448">Afkast</text>
  <text class="muted" x="16" y="466">til det fri</text>
  <text class="side" x="1084" y="448" text-anchor="end">Tilluft</text>
  <text class="muted" x="1084" y="466" text-anchor="end">til boligen</text>
  <g class="channel-value out">
    <rect class="vbox out" x="12" y="232" width="148" height="92" rx="12"/>
    <text class="value-text" font-size="32" x="24" y="278">${escape(data.t8 || '—')}</text>
    <text class="muted" x="24" y="306">T8 udeluft</text>
  </g>
  <g class="channel-value ext">
    <rect class="vbox ext" x="940" y="232" width="148" height="92" rx="12"/>
    <text class="value-text" font-size="32" x="952" y="278">${escape(data.t3 || '—')}</text>
    <text class="muted" x="952" y="306">T3 · RH ${escape(data.rh || '')}</text>
  </g>
  <g class="channel-value exh">
    <rect class="vbox exh" x="12" y="478" width="148" height="92" rx="12"/>
    <text class="value-text" font-size="32" x="24" y="524">${escape(data.t4 || '—')}</text>
    <text class="muted" x="24" y="552">T4 afkast</text>
  </g>
  <g class="channel-value sup">
    <rect class="vbox sup" x="940" y="478" width="148" height="92" rx="12"/>
    <text class="value-text" font-size="32" x="952" y="524">${escape(data.t7 || '—')}</text>
    <text class="muted" x="952" y="552">T7 tilluft</text>
  </g>
  <g transform="translate(170 155)">${scene(plant, data, move, false)}</g>
  <path class="drop" d="M550 648 c8 12 8 18 0 26 c-8 -8 -8 -14 0 -26z"/>
  <text class="muted" x="568" y="672">Kondensafløb</text>
</svg>`;
  }

  function compact(plant, data) {
    const move = data.running ? 'moving' : '';
    return `
<svg class="compact" viewBox="0 0 760 500" data-diagram="counterflow" role="img">
  <title>Modstrømsveksler</title>
  ${defs()}
  ${scene(plant, data, move, true)}
</svg>`;
  }

  function scene(plant, data, move, tight) {
    const fit = plant || {};
    const bypass = data.bypass || 'closed';
    const filterClass = data.filterAlarm ? 'filter alarm' : 'filter';
    const damper = bypass === 'open' ? 'M 443 118 H 467' : 'M 446 126 L 464 110';
    const stateLine = bypass === 'open'
      ? 'åben (H102/H103)'
      : bypass === 'closed'
        ? 'lukket (H102/H103)'
        : (data.bypassLabel || '');
    const leftName = tight ? 'G4 IF' : 'Udeluftfilter G4 (IF)';
    const rightName = tight ? 'G4 UF' : 'Fraluftfilter G4 (UF)';
    const pre = fit.preheater ? coil(118, 128, 'preheater') : '';
    const post = fit.reheater === 'water'
      ? `${coil(668, 360, 'reheater')}${valve(692, 384)}`
      : fit.reheater === 'electric'
        ? coil(668, 360, 'reheater')
        : '';
    return `
  <path class="duct" d="M4 128 H78 M682 128 H756 M78 372 H4 M682 372 H756"/>
  <polygon class="big-arrow outdoor" points="8,104 58,128 8,152"/>
  <polygon class="big-arrow extract" points="752,104 702,128 752,152"/>
  <polygon class="big-arrow exhaust" points="54,348 4,372 54,396"/>
  <polygon class="big-arrow supply" points="706,348 756,372 706,396"/>
  <rect class="housing" x="78" y="28" width="604" height="440" rx="16" data-part="housing"/>
  <line class="split" x1="78" y1="251" x2="682" y2="251"/>
  <path class="flow outdoor ${move}" data-flow="outdoor" data-part="outdoor" d="M78 128 H150 C210 128 248 158 292 188 C330 214 352 236 380 251"/>
  <path class="flow supply ${move}" data-flow="supply" data-part="supply" d="M380 251 C430 286 500 340 560 362 C610 372 650 372 756 372"/>
  <path class="flow extract ${move}" data-flow="extract" data-part="extract" d="M682 128 H590 C530 128 492 160 452 192 C424 214 404 236 380 251"/>
  <path class="flow exhaust ${move}" data-flow="exhaust" data-part="exhaust" d="M380 251 C340 286 270 342 210 362 C160 372 110 372 4 372"/>
  ${pre}
  ${filterBank(118, 158, -38, filterClass, 'outdoor')}
  <text class="tag" x="130" y="96" text-anchor="middle">${leftName}</text>
  ${filterBank(642, 158, 38, filterClass, 'extract')}
  <text class="tag" x="630" y="96" text-anchor="middle">${rightName}</text>
  <polygon class="hx-hex" points="${HEX}" data-part="exchanger"/>
  <polygon class="hx-hatch" points="${HEX}"/>
  <rect class="cts-tag" x="342" y="92" width="76" height="26" rx="6"/>
  <text class="tag" x="380" y="110" text-anchor="middle">CTS 602</text>
  <text class="hx-label" x="380" y="268">Modstrømsveksler</text>
  ${sensor(214, 152, 'T8', 't8_outdoor', 'outdoor', 16)}
  ${sensor(530, 140, 'T3', 't3_extract', 'extract', 16)}
  ${sensor(548, 188, 'RH', 'humidity', 'extract', 14)}
  ${sensor(214, 348, 'T4', 't4_exhaust', 'exhaust', 16)}
  ${sensor(546, 348, 'T7', 't7_supply', 'supply', 16)}
  <circle class="damper-ring" cx="455" cy="118" r="12"/>
  <path class="damper" d="${damper}" data-part="bypass" data-state="${bypass}"/>
  <text class="tag bypass-label" x="478" y="52">Bypass M7</text>
  <text class="muted bypass-label" x="478" y="70">${escape(stateLine)}</text>
  ${fan(148, 372, 'extract_fan', data.extractSpin)}
  <text class="tag" x="148" y="428" text-anchor="middle">M3 fraluft</text>
  <text class="muted" x="148" y="446" text-anchor="middle">${escape(data.m3 || '')}</text>
  ${fan(612, 372, 'supply_fan', data.supplySpin)}
  <text class="tag" x="612" y="428" text-anchor="middle">M4 tilluft</text>
  <text class="muted" x="612" y="446" text-anchor="middle">${escape(data.m4 || '')}</text>
  ${post}`;
  }

  function defs() {
    return `
  <defs>
    <pattern id="nilan-hex" width="11" height="11" patternUnits="userSpaceOnUse">
      <path d="M0 11 L11 0 M0 0 L11 11" stroke="var(--hx-line)" stroke-width="0.7"/>
    </pattern>
    <style>${STYLE}</style>
  </defs>`;
  }

  function filterBank(x, y, angle, cls, which) {
    return `<g data-part="filter" data-filter="${which}" class="${cls}" transform="translate(${x} ${y}) rotate(${angle})">
      <rect class="filter-panel" x="-62" y="-20" width="124" height="40" rx="5"/>
      <path class="filter-pleat" d="M-48 -8 H48 M-48 2 H48 M-48 12 H48"/>
    </g>`;
  }

  function sensor(x, y, name, key, tone, radius) {
    return `<g data-sensor="${key}">
      <circle class="sensor ${tone}" cx="${x}" cy="${y}" r="${radius}"/>
      <text class="sensor-label ${tone}" x="${x}" y="${y + 5}">${name}</text>
    </g>`;
  }

  function fan(cx, cy, part, spin) {
    const motion = spin ? ` style="animation-duration:${spin}s"` : '';
    return `<g data-part="${part}" class="fan-unit" transform="translate(${cx} ${cy})"${motion}>
      <circle class="fan" r="28"/>
      <path class="blades" d="M0,-4 C12,-8 22,-28 7,-30 C-2,-18 -1,-8 0,-4 Z"/>
      <path class="blades" d="M0,-4 C12,-8 22,-28 7,-30 C-2,-18 -1,-8 0,-4 Z" transform="rotate(120)"/>
      <path class="blades" d="M0,-4 C12,-8 22,-28 7,-30 C-2,-18 -1,-8 0,-4 Z" transform="rotate(240)"/>
      <circle class="hub" r="5.5"/>
    </g>`;
  }

  function coil(x, y, part) {
    return `<path class="coil" data-part="${part}" d="M ${x} ${y} q 8 -16 18 0 t 18 0 t 18 0"/>`;
  }

  function valve(x, y) {
    return `<path data-part="valve" d="M ${x} ${y} l 16 -9 v 18 z" fill="var(--drop)"/>`;
  }

  function escape(value) {
    return String(value ?? '').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
  }

  root.NilanDiagram = { markup };
})(typeof globalThis === 'undefined' ? window : globalThis);

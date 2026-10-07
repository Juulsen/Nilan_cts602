// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Counterflow cross-section matching the approved principle drawing.
   Outdoor air enters top-left and leaves as supply bottom-right.
   Extract air enters top-right and leaves as exhaust bottom-left. */
(function (root) {
  const STYLE = `
      .housing{fill:var(--hmi-housing);stroke:var(--hmi-outline);stroke-width:2.2}
      .split{fill:none;stroke:var(--hmi-outline);stroke-width:1.6}
      .duct-body{fill:var(--hmi-frame);stroke:var(--hmi-outline);stroke-width:1.2}
      .big-arrow{stroke:none}
      .big-arrow.outdoor{fill:var(--flow-outdoor)}
      .big-arrow.extract{fill:var(--flow-extract)}
      .big-arrow.exhaust{fill:var(--flow-exhaust)}
      .big-arrow.supply{fill:var(--flow-supply)}
      .hx-hex{fill:var(--hx-fill);stroke:var(--hx-line);stroke-width:2.4}
      .hx-hatch{fill:url(#nilan-hex);stroke:none}
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
      .value-text{font-size:32px;font-weight:750;fill:var(--hmi-ink)}
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
      .callout{fill:none;stroke:var(--hmi-muted);stroke-width:1.35}
      .damper-ring{fill:var(--hmi-box);stroke:var(--hmi-ink);stroke-width:1.8}
      .damper{fill:none;stroke:var(--hmi-ink);stroke-width:2.4;stroke-linecap:round}
      .drop{fill:var(--drop)}
      .coil{fill:none;stroke:var(--alarm);stroke-width:2.2}
      svg.compact .bypass-label{font-size:14px}
      svg.compact .tag{font-size:18px}
      svg.compact .sensor-label{font-size:16px}
      svg.compact .fan-speed{font-size:16px}
      svg.compact .verbose{display:none}
      @media (prefers-reduced-motion: reduce){.fan-unit[style] .blades{animation:none}}
      @keyframes nilan-spin{to{transform:rotate(360deg)}}
  `;

  const HEX = '380,108 498,178 498,324 380,394 262,324 262,178';

  function markup(plant, state) {
    const data = state || {};
    if (data.compact) return compact(plant, data);
    return desktop(plant, data);
  }

  function desktop(plant, data) {
    return `
<svg viewBox="0 0 1100 690" data-diagram="counterflow" role="img">
  <title>Modstrømsveksler</title>
  ${defs()}
  <g class="channel-value">
    <rect class="plaque" x="12" y="8" width="250" height="112" rx="12"/>
    <text class="tag" x="26" y="32">Varmegenvinding</text>
    <text class="muted" x="26" y="52">(T3−T4)/(T3−T8)</text>
    <text class="value-text eff-value" font-size="32" x="26" y="100" data-sensor="efficiency">${escape(data.eff || '—')}</text>
    <rect class="panel" x="401.43185" y="14.110375" width="300.25497" height="77.170021" rx="12.010198"/>
    <rect class="swatch" x="416" y="28" width="18" height="18" rx="3"/>
    <text class="tag" x="442" y="42">CTS-panel · T15</text>
    <text class="muted" x="442" y="64">loft</text>
    <text class="value-text" font-size="32" x="671.52545" y="50.711864" text-anchor="end" data-sensor="t15_panel">${escape(data.t15 || '—')}</text>
    <line class="leader" x1="550" y1="92.711861" x2="550" y2="201"/>
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
  <g transform="translate(170 155)">${scene(plant, data)}</g>
  <path class="drop" d="M550 648 c8 12 8 18 0 26 c-8 -8 -8 -14 0 -26z"/>
  <text class="muted" x="568" y="672">Kondensafløb</text>
</svg>`;
  }

  function compact(plant, data) {
    return `
<svg class="compact" viewBox="0 0 760 500" data-diagram="counterflow" role="img">
  <title>Modstrømsveksler</title>
  ${defs()}
  ${scene(plant, data)}
</svg>`;
  }

  function scene(plant, data) {
    const fit = plant || {};
    const bypass = data.bypass || 'closed';
    const filterClass = data.filterAlarm ? 'filter alarm' : 'filter';
    const damper = bypass === 'open'
      ? 'M 368.72879 90.711868 H 390.72879'
      : 'm 371.16949,97.711865 14,-14';
    const stateLine = bypass === 'open'
      ? 'åben (H102/H103)'
      : bypass === 'closed'
        ? 'lukket (H102/H103)'
        : (data.bypassLabel || '');
    const pre = fit.preheater ? coil(118, 128, 'preheater') : '';
    const post = fit.reheater === 'water'
      ? `${coil(668, 360, 'reheater')}${valve(692, 384)}`
      : fit.reheater === 'electric'
        ? coil(668, 360, 'reheater')
        : '';
    return `
  <rect class="duct-body" x="0.04801029" y="104.04801" width="100.71754" height="47.903976" rx="11.711342"/>
  <rect class="duct-body" x="674" y="104" width="86" height="48" rx="10"/>
  <rect class="duct-body" x="0" y="348" width="86" height="48" rx="10"/>
  <rect class="duct-body" x="674" y="348" width="86" height="48" rx="10"/>
  <polygon class="big-arrow outdoor" points="10,108 62,128 10,148"/>
  <polygon class="big-arrow extract" points="750,108 698,128 750,148"/>
  <polygon class="big-arrow exhaust" points="62,352 10,372 62,392"/>
  <polygon class="big-arrow supply" points="698,352 750,372 698,392"/>
  <rect class="housing" x="78" y="46" width="604" height="422" rx="16" data-part="housing"/>
  <line class="split" x1="78" y1="251" x2="682" y2="251"/>
  <line class="split" x1="380.64856" y1="47.382591" x2="380.64856" y2="469.0097" data-part="centre-split"/>
  ${pre}
  ${roofFilters(filterClass)}
  <polygon class="hx-hex" points="${HEX}" data-part="exchanger"/>
  <polygon class="hx-hatch" points="${HEX}"/>
  ${sensor(306, 128, 'T8', 't8_outdoor', 'outdoor', 14, '-109.15254,-61.59322')}
  ${sensor(454, 128, 'T3', 't3_extract', 'extract', 14, '42.101695,-60.813559')}
  ${sensor(478, 146, 'RH', 'humidity', 'extract', 13, '58.474576,-79.525424')}
  ${sensor(210, 362, 'T4', 't4_exhaust', 'exhaust', 16, '-14.813559,79.525424')}
  ${sensor(548, 362, 'T7', 't7_supply', 'supply', 16, '8.5762712,74.847458')}
  <circle class="damper-ring" cx="379.72879" cy="90.711868" r="11"/>
  <path class="damper" d="${damper}" data-part="bypass" data-state="${bypass}"/>
  <line class="callout" x1="453.28708" y1="37.552711" x2="389.00107" y2="81.362549"/>
  <text class="tag bypass-label" x="462" y="24">Bypass</text>
  <text class="muted bypass-label" x="462" y="40">${escape(stateLine)}</text>
  ${fan(108.23729, 375.11864, 'extract_fan', data.extractSpin)}
  <text class="muted fan-speed" x="109.79661" y="339.96609" text-anchor="middle">${escape(data.m3 || '')}</text>
  ${fan(654.88136, 376.67797, 'supply_fan', data.supplySpin)}
  <text class="muted fan-speed" x="656.44067" y="340.74576" text-anchor="middle">${escape(data.m4 || '')}</text>
  ${post}`;
  }

  function roofFilters(cls) {
    return `<g data-part="filter" data-filter="outdoor" class="${cls}" transform="matrix(1.2729517,0,0,1.1305313,-48.471348,-30.151851)">
      <polygon class="filter-panel" points="323.5,65.2 101.5,229.2 114.5,246.8 336.5,82.8" transform="matrix(1.0001078,0,0,0.98185809,-0.02361236,4.490092)"/>
      <path class="filter-pleat" d="m 298.7,89.7 7.1,9.6 m -34.9,10.9 7.2,9.6 m -34.9,10.9 7.1,9.6 m -34.9,10.9 7.2,9.6 m -34.9,10.9 7.1,9.6 m -34.9,10.9 7.2,9.6 m -34.9,10.9 7.1,9.6"/>
    </g>
    <g data-part="filter" data-filter="extract" class="${cls}" transform="matrix(1.2662739,0,0,1.1147943,-153.02027,-24.535026)">
      <polygon class="filter-panel" points="645.5,246.8 658.5,229.2 436.5,65.2 423.5,82.8"/>
      <path class="filter-pleat" d="m 454.2,99.3 7.1,-9.6 m 20.6,30.1 7.2,-9.6 m 20.6,30.1 7.1,-9.6 m 20.6,30.1 7.2,-9.6 m 20.6,30.1 7.1,-9.6 m 20.6,30.1 7.2,-9.6 m 20.6,30.1 7.1,-9.6"/>
    </g>`;
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

  function sensor(x, y, name, key, tone, radius, shift) {
    const move = shift ? ` transform="translate(${shift})"` : '';
    return `<g data-sensor="${key}"${move}>
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

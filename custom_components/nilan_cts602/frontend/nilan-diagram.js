// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Counterflow cross-section, same orientation as Nilan's principle diagram.
   Outdoor air enters top-left, exhaust leaves bottom-left, extract air
   enters top-right and supply air leaves bottom-right. */
(function (root) {
  const STYLE = `
      .housing{fill:var(--hmi-housing);stroke:var(--hmi-outline);stroke-width:2}
      .housing-inner{fill:none;stroke:var(--hmi-line);stroke-width:1}
      .duct{fill:none;stroke:var(--hmi-frame);stroke-width:36;stroke-linecap:round}
      .duct-bore{fill:none;stroke:var(--hmi-bore);stroke-width:22;stroke-linecap:round}
      .flow{fill:none;stroke-width:7;stroke-linecap:round}
      .flow.outdoor{stroke:var(--flow-outdoor)}
      .flow.extract{stroke:var(--flow-extract)}
      .flow.exhaust{stroke:var(--flow-exhaust)}
      .flow.supply{stroke:var(--flow-supply)}
      .arrow{stroke:none}
      .arrow.outdoor{fill:var(--flow-outdoor)}
      .arrow.extract{fill:var(--flow-extract)}
      .arrow.exhaust{fill:var(--flow-exhaust)}
      .arrow.supply{fill:var(--flow-supply)}
      .moving{stroke-dasharray:9 11;animation:nilan-flow 1.1s linear infinite}
      .hx-hex{fill:var(--hx-fill);stroke:var(--hx-line);stroke-width:2.6}
      .hx-hatch{fill:url(#nilan-hex);stroke:none}
      .hx-plate{fill:var(--hx-fill);stroke:none}
      .hx-label{font-size:16px;font-weight:700;fill:var(--hmi-ink);text-anchor:middle}
      .tag,.side{font-size:13px;fill:var(--hmi-ink)}
      .side{font-weight:700;font-size:16px}
      .muted{font-size:12px;fill:var(--hmi-muted)}
      .value-text{font-size:32px;font-weight:750;fill:var(--hmi-ink)}
      .card{fill:var(--hmi-box);stroke:var(--hmi-line)}
      .fan{fill:var(--hmi-box);stroke:var(--hmi-outline);stroke-width:1.8}
      .blades{fill:var(--hmi-ink)}
      .hub{fill:var(--hmi-box);stroke:var(--hmi-outline);stroke-width:1.2}
      .fan-unit[style] .blades{animation:nilan-spin linear infinite;transform-origin:0 0}
      .cassette{fill:var(--filter-fill);stroke:var(--filter-stroke);stroke-width:1.8}
      .pleat{fill:none;stroke:var(--filter-stroke);stroke-width:1.3}
      .filter.alarm .cassette,.filter.alarm .pleat{stroke:var(--alarm)}
      .plaque{fill:var(--plaque);stroke:var(--plaque-line)}
      .panel{fill:var(--panel);stroke:var(--panel-line)}
      .drop{fill:var(--drop)}
      .damper{fill:none;stroke:var(--hmi-ink);stroke-width:4;stroke-linecap:round}
      .pivot{fill:var(--hmi-ink)}
      .coil{fill:none;stroke:var(--alarm);stroke-width:2.2}
      svg.compact .side,svg.compact .hx-label,svg.compact .bypass-label{font-size:26px}
      svg.compact .fine{display:none}
      @media (prefers-reduced-motion: reduce){.moving,.fan-unit[style] .blades{animation:none}}
      @keyframes nilan-flow{to{stroke-dashoffset:-40}}
      @keyframes nilan-spin{to{transform:rotate(360deg)}}
  `;

  function markup(plant, state) {
    const data = state || {};
    if (data.compact) return compact(plant, data);
    return desktop(plant, data);
  }

  function desktop(plant, data) {
    const fit = plant || {};
    const bypass = data.bypass || 'closed';
    const filterClass = data.filterAlarm ? 'filter alarm' : 'filter';
    const pre = fit.preheater ? coil(236, 198, 'preheater') : '';
    const post = fit.reheater === 'water'
      ? `${coil(760, 432, 'reheater')}${valve(786, 468)}`
      : fit.reheater === 'electric'
        ? coil(760, 432, 'reheater')
        : '';
    const option = fit.options_board ? '<text class="tag" x="214" y="188">Option</text>' : '';
    const damper = bypass === 'open' ? 'M 455 158 H 548' : 'M 468 146 L 548 178';
    const HEX = '490,178 636,252 636,414 490,488 344,414 344,252';
    return `
<svg viewBox="0 0 980 640" data-diagram="counterflow" role="img">
  <title>Modstrømsveksler</title>
  <defs>
    <pattern id="nilan-hex" width="9" height="9" patternUnits="userSpaceOnUse">
      <path d="M0 9 L9 0" stroke="var(--hx-line)" stroke-width="0.8"/>
    </pattern>
    <style>${STYLE}</style>
  </defs>
  <g class="channel-value">
    <rect class="plaque" x="16" y="12" width="200" height="76" rx="12"/>
    <text class="muted" x="28" y="36">Varmegenvinding</text>
    <text class="value-text" font-size="32" x="28" y="72" data-sensor="efficiency">${escape(data.eff || '—')}</text>
    <rect class="panel" x="390" y="12" width="210" height="76" rx="12"/>
    <text class="muted" x="404" y="36">CTS-panel · T15</text>
    <text class="tag" x="404" y="54">loft</text>
    <text class="value-text" font-size="32" x="500" y="72" data-sensor="t15_panel">${escape(data.t15 || '—')}</text>
  </g>
  <text class="tag bypass-label" x="400" y="112">Bypass M7</text>
  <text class="tag bypass-label" x="500" y="112">${escape(data.bypassLabel || '')}</text>
  <text class="side" x="16" y="116">Udeluft</text>
  <text class="muted" x="16" y="132">fra det fri</text>
  <text class="side" x="16" y="568">Afkast</text>
  <text class="muted" x="16" y="584">til det fri</text>
  <text class="side" x="964" y="116" text-anchor="end">Fraluft</text>
  <text class="muted" x="964" y="132" text-anchor="end">fra boligen</text>
  <text class="side" x="964" y="568" text-anchor="end">Tilluft</text>
  <text class="muted" x="964" y="584" text-anchor="end">til boligen</text>
  <rect class="housing" x="196" y="150" width="588" height="404" rx="22" data-part="housing"/>
  <rect class="housing-inner" x="206" y="160" width="568" height="384" rx="16"/>
  <path class="duct" d="M178 214 H430 M550 214 H802 M178 448 H430 M550 448 H802"/>
  <path class="duct-bore" d="M178 214 H430 M550 214 H802 M178 448 H430 M550 448 H802"/>
  <path class="flow outdoor ${data.running ? 'moving' : ''}" data-flow="outdoor" data-part="outdoor" d="M170 214 H400"/>
  <path class="arrow outdoor" d="M388 206 h18 l14 8 l-14 8 h-18 z"/>
  <path class="flow extract ${data.running ? 'moving' : ''}" data-flow="extract" data-part="extract" d="M810 214 H580"/>
  <path class="arrow extract" d="M592 206 h-18 l-14 8 l14 8 h18 z"/>
  <path class="flow exhaust ${data.running ? 'moving' : ''}" data-flow="exhaust" data-part="exhaust" d="M400 448 H170"/>
  <path class="arrow exhaust" d="M196 440 h-18 l-14 8 l14 8 h18 z"/>
  <path class="flow supply ${data.running ? 'moving' : ''}" data-flow="supply" data-part="supply" d="M580 448 H810"/>
  <path class="arrow supply" d="M784 440 h18 l14 8 l-14 8 h-18 z"/>
  ${pre}
  ${cassette(292, 214, filterClass, 'outdoor')}
  <text class="tag" x="232" y="176">G4 IF</text>
  <text class="tag" x="360" y="176" data-sensor="t8_outdoor">T8</text>
  ${cassette(708, 214, filterClass, 'extract')}
  <text class="tag" x="704" y="278">G4 UF</text>
  <text class="tag" x="600" y="176" data-sensor="t3_extract">T3</text>
  <text class="tag" x="690" y="340" data-sensor="humidity">RH</text>
  <polygon class="hx-hex" points="${HEX}" data-part="exchanger"/>
  <polygon class="hx-hatch" points="${HEX}"/>
  <path class="flow outdoor" d="M400 230 C 450 250 470 360 590 430" opacity="0.9"/>
  <path class="flow extract" d="M580 230 C 530 250 510 360 390 430" opacity="0.9"/>
  <rect class="hx-plate" x="416" y="322" width="148" height="36" rx="8"/>
  <text class="hx-label" x="490" y="346">Modstrømsveksler</text>
  ${option}
  <path class="damper" d="${damper}" data-part="bypass" data-state="${bypass}"/>
  <circle class="pivot" cx="552" cy="178" r="6"/>
  ${fan(268, 448, 'extract_fan', data.extractSpin)}
  <text class="tag" x="228" y="508">M3 fraluft</text>
  <text class="tag" x="228" y="524">${escape(data.m3 || '')}</text>
  <text class="tag" x="300" y="378" data-sensor="t4_exhaust">T4</text>
  ${fan(712, 448, 'supply_fan', data.supplySpin)}
  <text class="tag" x="668" y="508">M4 tilluft</text>
  <text class="tag" x="668" y="524">${escape(data.m4 || '')}</text>
  <text class="tag" x="660" y="400" data-sensor="t7_supply">T7</text>
  ${post}
  <path class="drop" d="M490 556 c8 10 8 16 0 22 c-8 -6 -8 -12 0 -22z"/>
  <text class="muted" x="508" y="592">Kondensafløb</text>
  <g class="channel-value">
    <rect class="card" x="8" y="174" width="148" height="80" rx="12"/>
    <text class="value-text" font-size="32" x="20" y="214">${escape(data.t8 || '—')}</text>
    <text class="muted" x="20" y="238">T8 udeluft</text>
    <rect class="card" x="8" y="408" width="148" height="80" rx="12"/>
    <text class="value-text" font-size="32" x="20" y="448">${escape(data.t4 || '—')}</text>
    <text class="muted" x="20" y="472">T4 afkast</text>
    <rect class="card" x="824" y="174" width="148" height="80" rx="12"/>
    <text class="value-text" font-size="32" x="836" y="214">${escape(data.t3 || '—')}</text>
    <text class="muted" x="836" y="238">T3 fraluft ${escape(data.rh || '')}</text>
    <rect class="card" x="824" y="408" width="148" height="80" rx="12"/>
    <text class="value-text" font-size="32" x="836" y="448">${escape(data.t7 || '—')}</text>
    <text class="muted" x="836" y="472">T7 tilluft</text>
  </g>
</svg>`;
  }

  function compact(plant, data) {
    const fit = plant || {};
    const bypass = data.bypass || 'closed';
    const filterClass = data.filterAlarm ? 'filter alarm' : 'filter';
    const pre = fit.preheater ? coil(150, 168, 'preheater') : '';
    const post = fit.reheater === 'water'
      ? `${coil(590, 348, 'reheater')}${valve(612, 376)}`
      : fit.reheater === 'electric'
        ? coil(590, 348, 'reheater')
        : '';
    const damper = bypass === 'open' ? 'M 330 118 H 430' : 'M 348 108 L 430 142';
    const HEX = '380,132 500,196 500,332 380,396 260,332 260,196';
    return `
<svg class="compact" viewBox="0 0 760 500" data-diagram="counterflow" role="img">
  <title>Modstrømsveksler</title>
  <defs>
    <pattern id="nilan-hex" width="9" height="9" patternUnits="userSpaceOnUse">
      <path d="M0 9 L9 0" stroke="var(--hx-line)" stroke-width="0.8"/>
    </pattern>
    <style>${STYLE}</style>
  </defs>
  <text class="side" x="16" y="52">Udeluft</text>
  <text class="side" x="744" y="52" text-anchor="end">Fraluft</text>
  <text class="side" x="16" y="470">Afkast</text>
  <text class="side" x="744" y="470" text-anchor="end">Tilluft</text>
  <text class="bypass-label" x="300" y="84" text-anchor="middle">Bypass ${escape(data.bypassLabel || '')}</text>
  <rect class="housing" x="78" y="96" width="604" height="340" rx="20" data-part="housing"/>
  <path class="duct" d="M24 188 H250 M510 188 H736 M24 360 H250 M510 360 H736"/>
  <path class="duct-bore" d="M24 188 H250 M510 188 H736 M24 360 H250 M510 360 H736"/>
  <path class="flow outdoor ${data.running ? 'moving' : ''}" data-flow="outdoor" data-part="outdoor" d="M16 188 H230"/>
  <path class="arrow outdoor" d="M214 180 h16 l12 8 l-12 8 h-16 z"/>
  <path class="flow extract ${data.running ? 'moving' : ''}" data-flow="extract" data-part="extract" d="M744 188 H530"/>
  <path class="arrow extract" d="M546 180 h-16 l-12 8 l12 8 h16 z"/>
  <path class="flow exhaust ${data.running ? 'moving' : ''}" data-flow="exhaust" data-part="exhaust" d="M230 360 H16"/>
  <path class="arrow exhaust" d="M40 352 h-16 l-12 8 l12 8 h16 z"/>
  <path class="flow supply ${data.running ? 'moving' : ''}" data-flow="supply" data-part="supply" d="M530 360 H744"/>
  <path class="arrow supply" d="M720 352 h16 l12 8 l-12 8 h-16 z"/>
  ${pre}
  ${cassette(168, 188, filterClass, 'outdoor')}
  ${cassette(592, 188, filterClass, 'extract')}
  <polygon class="hx-hex" points="${HEX}" data-part="exchanger"/>
  <polygon class="hx-hatch" points="${HEX}"/>
  <path class="flow outdoor" d="M250 200 C 300 220 320 310 500 350"/>
  <path class="flow extract" d="M510 200 C 460 220 440 310 270 350"/>
  <rect class="hx-plate" x="258" y="242" width="244" height="44" rx="10"/>
  <text class="hx-label" x="380" y="272">Modstrømsveksler</text>
  <path class="damper" d="${damper}" data-part="bypass" data-state="${bypass}"/>
  <circle class="pivot" cx="434" cy="142" r="6"/>
  ${fan(120, 360, 'extract_fan', data.extractSpin)}
  ${fan(640, 360, 'supply_fan', data.supplySpin)}
  ${post}
  <path class="drop" d="M380 440 c6 8 6 12 0 18 c-6 -6 -6 -10 0 -18z"/>
</svg>`;
  }

  function escape(value) {
    return String(value ?? '').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
  }

  function cassette(x, y, cls, which) {
    return `<g data-part="filter" data-filter="${which}" class="${cls}" transform="translate(${x} ${y}) rotate(-16)">
      <rect class="cassette" x="-14" y="-28" width="30" height="56" rx="3"/>
      <path class="pleat" d="M-8 -20 H10 M-8 -10 H10 M-8 0 H10 M-8 10 H10 M-8 20 H10"/>
    </g>`;
  }

  function coil(x, y, part) {
    return `<path class="coil" data-part="${part}" d="M ${x} ${y} q 8 -14 18 0 t 18 0 t 18 0"/>`;
  }

  function valve(x, y) {
    return `<path data-part="valve" d="M ${x} ${y} l 14 -8 v 16 z" fill="var(--drop)"/>`;
  }

  function fan(cx, cy, part, spin) {
    const motion = spin ? ` style="animation-duration:${spin}s"` : '';
    return `<g data-part="${part}" class="fan-unit" transform="translate(${cx} ${cy})" ${motion}>
      <circle class="fan" r="24"/>
      <path class="blades" d="M0,-3 C8,-6 16,-20 5,-22 C-2,-14 -1,-6 0,-3 Z"/>
      <path class="blades" d="M0,-3 C8,-6 16,-20 5,-22 C-2,-14 -1,-6 0,-3 Z" transform="rotate(120)"/>
      <path class="blades" d="M0,-3 C8,-6 16,-20 5,-22 C-2,-14 -1,-6 0,-3 Z" transform="rotate(240)"/>
      <circle class="hub" r="4.5"/>
    </g>`;
  }

  root.NilanDiagram = { markup };
})(typeof globalThis === 'undefined' ? window : globalThis);

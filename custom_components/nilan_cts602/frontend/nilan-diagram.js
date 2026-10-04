// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Counterflow cross-section, same orientation as Nilan's principle diagram.
   Outdoor air enters top-left, exhaust leaves bottom-left, extract air
   enters top-right and supply air leaves bottom-right. */
(function (root) {
  const HEX = '490,176 632,252 632,408 490,484 348,408 348,252';

  function markup(plant, state) {
    const fit = plant || {};
    const data = state || {};
    const bypass = data.bypass || 'closed';
    const filterClass = data.filterAlarm ? 'filter alarm' : 'filter';
    const pre = fit.preheater ? coil(196, 212, 'preheater') : '';
    const post = fit.reheater === 'water'
      ? `${coil(748, 436, 'reheater')}${valve(772, 468)}`
      : fit.reheater === 'electric'
        ? coil(748, 436, 'reheater')
        : '';
    const option = fit.options_board ? '<text class="tag" x="620" y="168">Option</text>' : '';
    const damper = bypass === 'open' ? 'M 592 196 H 652' : 'M 598 184 L 646 214';
    return `
<svg viewBox="0 0 980 640" data-diagram="counterflow" role="img">
  <title>Modstrømsveksler</title>
  <defs>
    <pattern id="nilan-hex" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M0 8 L8 0 M-2 2 L2 -2 M6 10 L10 6" stroke="var(--hx-line,#2f6b45)" stroke-width="0.7"/>
    </pattern>
    <style>
      .housing{fill:var(--hmi-box,#fff);stroke:var(--hmi-ink,#1c2830);stroke-width:1.6}
      .duct{fill:none;stroke:var(--hmi-frame,#8aa0b4);stroke-width:26;stroke-linecap:round}
      .duct-bore{fill:none;stroke:var(--hmi-panel,#f4f7fb);stroke-width:16;stroke-linecap:round}
      .flow{fill:none;stroke-width:6;stroke-linecap:round}
      .flow.outdoor{stroke:#2f6fe0}
      .flow.extract{stroke:#e07a2f}
      .flow.exhaust{stroke:#7a4ea3}
      .flow.supply{stroke:#e07a2f}
      .arrow{stroke:none}
      .arrow.outdoor{fill:#2f6fe0}
      .arrow.extract{fill:#e07a2f}
      .arrow.exhaust{fill:#7a4ea3}
      .arrow.supply{fill:#e07a2f}
      .moving{stroke-dasharray:8 10;animation:nilan-flow 1.1s linear infinite}
      .hx-hex{fill:url(#nilan-hex);stroke:#2a6a40;stroke-width:2.4}
      .hx-label{font-size:16px;font-weight:700;fill:var(--hmi-ink,#1c2830);text-anchor:middle}
      .tag,.side{font-size:13px;fill:var(--hmi-ink,#1c2830)}
      .side{font-weight:700;font-size:15px}
      .muted{font-size:12px;fill:var(--hmi-muted,#5c6b7a)}
      .value-text{font-size:32px;font-weight:750;fill:var(--hmi-ink,#1c2830)}
      .card{fill:var(--hmi-box,#fff);stroke:var(--hmi-line,#c5d0dc)}
      .fan{fill:var(--hmi-box,#fff);stroke:var(--hmi-ink,#1c2830);stroke-width:1.4}
      .blade{stroke:var(--hmi-ink,#1c2830);stroke-width:1.4;fill:none}
      .filter{fill:none;stroke:#3d7a55;stroke-width:1.8}
      .filter.alarm{stroke:#c4473a}
      .plaque{fill:#e7f6ee;stroke:#2f8a4a}
      .panel{fill:#fff7e8;stroke:#e0b15a}
      .drop{fill:#7eb7d8}
      @media (prefers-reduced-motion: reduce){.moving{animation:none}}
      @keyframes nilan-flow{to{stroke-dashoffset:-36}}
    </style>
  </defs>
  <g class="channel-value">
    <rect class="plaque" x="16" y="12" width="188" height="74" rx="12"/>
    <text class="muted" x="28" y="34">Varmegenvinding</text>
    <text class="value-text" font-size="32" x="28" y="70" data-sensor="efficiency">${escape(data.eff || '—')}</text>
    <rect class="panel" x="390" y="12" width="200" height="74" rx="12"/>
    <text class="muted" x="404" y="34">CTS-panel · T15</text>
    <text class="tag" x="404" y="52">loft</text>
    <text class="value-text" font-size="32" x="470" y="74" data-sensor="t15_panel">${escape(data.t15 || '—')}</text>
  </g>
  <text class="side" x="16" y="118">Udeluft</text>
  <text class="muted" x="16" y="134">fra det fri</text>
  <text class="side" x="16" y="548">Afkast</text>
  <text class="muted" x="16" y="564">til det fri</text>
  <text class="side" x="964" y="118" text-anchor="end">Fraluft</text>
  <text class="muted" x="964" y="134" text-anchor="end">fra boligen</text>
  <text class="side" x="964" y="548" text-anchor="end">Tilluft</text>
  <text class="muted" x="964" y="564" text-anchor="end">til boligen</text>
  <rect class="housing" x="168" y="160" width="644" height="392" rx="22" data-part="housing"/>
  <path class="duct" d="M156 228 H360 M620 228 H824 M156 452 H360 M620 452 H824"/>
  <path class="duct-bore" d="M156 228 H360 M620 228 H824 M156 452 H360 M620 452 H824"/>
  <path class="flow outdoor ${data.running ? 'moving' : ''}" data-flow="outdoor" data-part="outdoor" d="M148 228 H340"/>
  <path class="arrow outdoor" d="M332 220 h16 l12 8 l-12 8 h-16 z"/>
  <path class="flow extract ${data.running ? 'moving' : ''}" data-flow="extract" data-part="extract" d="M832 228 H640"/>
  <path class="arrow extract" d="M648 220 h-16 l-12 8 l12 8 h16 z"/>
  <path class="flow exhaust ${data.running ? 'moving' : ''}" data-flow="exhaust" data-part="exhaust" d="M340 452 H148"/>
  <path class="arrow exhaust" d="M164 444 h-16 l-12 8 l12 8 h16 z"/>
  <path class="flow supply ${data.running ? 'moving' : ''}" data-flow="supply" data-part="supply" d="M640 452 H832"/>
  <path class="arrow supply" d="M816 444 h16 l12 8 l-12 8 h-16 z"/>
  <path class="flow outdoor" d="M360 240 C 430 250 450 340 610 430" opacity="0.85"/>
  <path class="flow extract" d="M620 240 C 550 250 530 340 370 430" opacity="0.85"/>
  ${pre}
  ${zigzag(248, 210, filterClass, 'outdoor')}
  <text class="tag" x="226" y="268">G4 IF</text>
  <text class="tag" x="300" y="210" data-sensor="t8_outdoor">T8</text>
  ${zigzag(700, 210, filterClass, 'extract')}
  <text class="tag" x="678" y="268">G4 UF</text>
  <text class="tag" x="600" y="210" data-sensor="t3_extract">T3</text>
  <text class="tag" x="600" y="248" data-sensor="humidity">RH</text>
  <polygon class="hx-hex" points="${HEX}" data-part="exchanger"/>
  <text class="hx-label" x="490" y="340">Modstrømsveksler</text>
  ${option}
  <path d="${damper}" stroke="#1c2830" stroke-width="3" data-part="bypass" data-state="${bypass}"/>
  <circle cx="656" cy="198" r="7" fill="#1c2830"/>
  <text class="tag" x="560" y="168">Bypass M7 ${escape(data.bypassLabel || '')}</text>
  ${fan(250, 452, 'extract_fan', data.extractSpin)}
  <text class="tag" x="210" y="504">M3 fraluft</text>
  <text class="tag" x="210" y="520">${escape(data.m3 || '')}</text>
  <text class="tag" x="300" y="470" data-sensor="t4_exhaust">T4</text>
  ${fan(730, 452, 'supply_fan', data.supplySpin)}
  <text class="tag" x="690" y="504">M4 tilluft</text>
  <text class="tag" x="690" y="520">${escape(data.m4 || '')}</text>
  <text class="tag" x="640" y="470" data-sensor="t7_supply">T7</text>
  ${post}
  <path class="drop" d="M490 548 c8 10 8 16 0 22 c-8 -6 -8 -12 0 -22z"/>
  <text class="muted" x="508" y="566">Kondensafløb</text>
  <g class="channel-value">
    <rect class="card" x="12" y="168" width="140" height="78" rx="12"/>
    <text class="value-text" font-size="32" x="22" y="208">${escape(data.t8 || '—')}</text>
    <text class="muted" x="22" y="232">T8 udeluft</text>
    <rect class="card" x="12" y="412" width="140" height="78" rx="12"/>
    <text class="value-text" font-size="32" x="22" y="452">${escape(data.t4 || '—')}</text>
    <text class="muted" x="22" y="476">T4 afkast</text>
    <rect class="card" x="828" y="168" width="140" height="78" rx="12"/>
    <text class="value-text" font-size="32" x="838" y="208">${escape(data.t3 || '—')}</text>
    <text class="muted" x="838" y="232">T3 fraluft ${escape(data.rh || '')}</text>
    <rect class="card" x="828" y="412" width="140" height="78" rx="12"/>
    <text class="value-text" font-size="32" x="838" y="452">${escape(data.t7 || '—')}</text>
    <text class="muted" x="838" y="476">T7 tilluft</text>
  </g>
</svg>`;
  }

  function escape(value) {
    return String(value ?? '').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
  }

  function zigzag(x, y, cls, which) {
    return `<path class="${cls}" data-part="filter" data-filter="${which}" d="M ${x} ${y} l 10 14 l -10 14 l 10 14 l -10 14"/>`;
  }

  function coil(x, y, part) {
    return `<path data-part="${part}" d="M ${x} ${y} q 8 -12 16 0 t 16 0 t 16 0" fill="none" stroke="#c4473a" stroke-width="2"/>`;
  }

  function valve(x, y) {
    return `<path data-part="valve" d="M ${x} ${y} l 12 -8 v 16 z" fill="#7eb7d8"/>`;
  }

  function fan(cx, cy, part, spin) {
    const motion = spin ? ` style="animation-duration:${spin}s"` : '';
    return `<g data-part="${part}" ${motion}>
      <circle class="fan" cx="${cx}" cy="${cy}" r="26"/>
      <path class="blade" d="M ${cx} ${cy} l 16 -8 M ${cx} ${cy} l -8 16 M ${cx} ${cy} l -14 -10"/>
    </g>`;
  }

  root.NilanDiagram = { markup };
})(typeof globalThis === 'undefined' ? window : globalThis);

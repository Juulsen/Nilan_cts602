/* SCADA diagram for a Comfort 300 LR.

Thick round ducts with flanges and elbows, and a plate cross-flow exchanger:
a beveled box with a rotated, hatched plate pack. The two air paths cross
inside that pack and meet the ducts at the four corners. Outdoor air is T8.
T15 is the loft panel and is not drawn on the ducts.
*/
(function (root) {
  function esc(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function lcd(text) {
    const raw = String(text ?? '').trim();
    if (!raw || raw === '—' || raw === '-') return '—';
    const match = raw.match(/^(.*?)\s+(°C|%|d|ppm|min)$/);
    if (!match) return esc(raw);
    return `${esc(match[1])}<tspan class="unit"> ${esc(match[2])}</tspan>`;
  }

  function pipe(d, flow, part) {
    return `<path class="pipe-shadow" d="${d}"/>
      <path class="pipe-body" d="${d}"/>
      <path class="pipe-bore" d="${d}"/>
      <path class="pipe-flow ${flow}" data-part="${part}" data-flow="${flow}" d="${d}"/>`;
  }

  function flange(x, y, vertical) {
    const rx = vertical ? 13 : 4.2;
    const ry = vertical ? 4.2 : 13;
    return `<g class="flange" transform="translate(${x} ${y})">
      <ellipse class="flange-ring" cx="0" cy="1.2" rx="${rx}" ry="${ry}"/>
      <ellipse class="flange-face" cx="0" cy="0" rx="${rx}" ry="${ry}"/>
      <ellipse class="flange-bore" cx="0" cy="0" rx="${rx * 0.46}" ry="${ry * 0.46}"/>
    </g>`;
  }

  function chevrons(d, tone, count) {
    return Array.from({ length: count }, (_, index) => {
      const delay = (-index / count).toFixed(2);
      return `<g class="chev ${tone}" style="offset-path:path('${d}');animation-delay:${delay}s">
        <path d="M-5.2 -3.4 L1.6 0 L-5.2 3.4"/>
      </g>`;
    }).join('');
  }

  function fan(x, y, part, spinning, pct, step, notesBelow) {
    const noteY = notesBelow ? y + 28 : y - 24;
    const stepY = notesBelow ? noteY + 12 : noteY - 12;
    return `<g data-part="${part}" class="fan" transform="translate(${x} ${y})">
      <circle class="fan-shadow" r="18" cy="1.6"/>
      <circle class="fan-housing" r="17"/>
      <circle class="fan-well" r="12.5"/>
      <g class="${spinning ? 'rotor' : 'rotor stopped'}">
        <path d="M0 0 C3.2 -1.5 5.2 -7.2 1.4 -10.2 C-1.2 -7.4 -0.8 -2.4 0 0"/>
        <path transform="rotate(90)" d="M0 0 C3.2 -1.5 5.2 -7.2 1.4 -10.2 C-1.2 -7.4 -0.8 -2.4 0 0"/>
        <path transform="rotate(180)" d="M0 0 C3.2 -1.5 5.2 -7.2 1.4 -10.2 C-1.2 -7.4 -0.8 -2.4 0 0"/>
        <path transform="rotate(270)" d="M0 0 C3.2 -1.5 5.2 -7.2 1.4 -10.2 C-1.2 -7.4 -0.8 -2.4 0 0"/>
      </g>
      <circle class="hub" r="2.3"/>
    </g>
    ${pct ? `<text class="fan-note" x="${x}" y="${notesBelow ? stepY : noteY}" text-anchor="middle">${esc(pct)}</text>` : ''}
    ${step ? `<text class="fan-note" x="${x}" y="${notesBelow ? noteY : stepY}" text-anchor="middle">${esc(step)}</text>` : ''}`;
  }

  function filter(x, y, alarm, days, daysY) {
    return `<g data-part="filter" class="filter ${alarm ? 'alarm' : 'idle'}" transform="translate(${x} ${y})">
      <rect class="filter-body" x="-13" y="-16" width="26" height="32" rx="3"/>
      <path class="pleat" d="M-8 -11 H8 L-8 -6 H8 L-8 -1 H8 L-8 4 H8 L-8 9 H8"/>
      ${flange(-16, 0, false)}
      ${flange(16, 0, false)}
    </g>
    ${days ? `<text class="symbol-note ${alarm ? 'alarm-note' : ''}" x="${x}" y="${daysY}" text-anchor="middle">${esc(days)}</text>` : ''}`;
  }

  function probe(x, y, part, sensorId, code, value, lcdY) {
    return `<g class="tag" data-part="${part}" data-sensor="${sensorId}">
      <circle class="probe" cx="${x}" cy="${y}" r="8"/>
      <circle class="probe-shine" cx="${x - 2.2}" cy="${y - 2.4}" r="2.1"/>
      <text class="probe-code" x="${x}" y="${y + 3.1}" text-anchor="middle">${esc(code)}</text>
      <rect class="lcd-box" x="${x - 28}" y="${lcdY - 10}" width="56" height="16" rx="3"/>
      <text class="lcd-text" x="${x}" y="${lcdY + 2.4}" text-anchor="middle">${lcd(value)}</text>
    </g>`;
  }

  function endLabel(x, y, anchor, line1, line2, tone) {
    return `<text class="end-label ${tone}" x="${x}" y="${y}" text-anchor="${anchor}">${esc(line1)}</text>
      <text class="end-label ${tone}" x="${x}" y="${y + 16}" text-anchor="${anchor}">${esc(line2)}</text>`;
  }

  function coil(x, y, part) {
    return `<g data-part="${part}" class="coil" transform="translate(${x} ${y})">
      <rect x="-9" y="-15" width="18" height="30" rx="3"/>
      <path d="M-5 -9 H5 M-5 -4.5 H5 M-5 0 H5 M-5 4.5 H5 M-5 9 H5"/>
    </g>`;
  }

  function markup(plant, values) {
    const v = values || {};
    const fitted = plant || {};
    const bypass = v.bypass === 'opening' || v.bypass === 'closing'
      ? v.bypass
      : v.bypass === 'open' ? 'open' : v.bypass === 'closed' ? 'closed' : 'unknown';
    const running = !!v.running;
    const alarm = !!v.filterAlarm;
    const supplySpin = v.supplySpin || '1.70';
    const extractSpin = v.extractSpin || '1.80';
    const flowSpeed = v.flowSpeed || '1.15';
    const blade = bypass === 'open' ? 'M-9 0 H9' : bypass === 'closed' ? 'M0 -9 V9' : bypass === 'unknown' ? '' : 'M-7 -6 L7 6';

    const box = { x: 128, y: 104, w: 184, h: 148 };
    const right = box.x + box.w;
    const bottom = box.y + box.h;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const depth = { x: 16, y: -14 };

    const exhaust = 'M148 104 V78 Q148 62 128 62 H22';
    const extract = 'M418 62 H300 Q276 62 276 80 V104';
    const outdoor = 'M22 312 H112 Q140 312 140 286 V252';
    const supply = 'M292 252 V286 Q292 312 320 312 H418';
    const bypassDuct = 'M96 312 V364 H344 V312';

    const hatch = [];
    for (let i = -78; i <= 78; i += 6.5) hatch.push(`<line x1="${cx - 80}" y1="${cy + i}" x2="${cx + 80}" y2="${cy + i}"/>`);
    const diamond = `${cx},${box.y + 18} ${right - 18},${cy} ${cx},${bottom - 18} ${box.x + 18},${cy}`;

    const pre = fitted.preheater ? coil(86, 312, 'preheater') : '';
    const re = fitted.reheater && fitted.reheater !== 'none' ? coil(348, 312, 'reheater') : '';

    return `<svg viewBox="0 0 440 400" width="100%" data-diagram="scada" class="${running ? 'running' : 'stopped'} bypass-${bypass}" style="--nilan-supply-spin:${supplySpin}s;--nilan-extract-spin:${extractSpin}s;--nilan-flow-speed:${flowSpeed}s" role="img">
      <defs>
        <linearGradient id="nilan-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="color-mix(in srgb, var(--nilan-fg,#e8eef6) 62%, #d5dde4)"/>
          <stop offset="0.42" stop-color="color-mix(in srgb, var(--nilan-fg,#e8eef6) 18%, #8d99a4)"/>
          <stop offset="1" stop-color="color-mix(in srgb, var(--nilan-bg,#14171c) 72%, #3e4852)"/>
        </linearGradient>
        <linearGradient id="nilan-metal-top" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="color-mix(in srgb, var(--nilan-fg,#e8eef6) 20%, #7d8892)"/>
          <stop offset="1" stop-color="color-mix(in srgb, var(--nilan-fg,#e8eef6) 70%, #eef3f6)"/>
        </linearGradient>
        <linearGradient id="nilan-hx" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="color-mix(in srgb, var(--nilan-fg,#e8eef6) 16%, #6a7580)"/>
          <stop offset="0.5" stop-color="color-mix(in srgb, var(--nilan-bg,#14171c) 78%, #2c343c)"/>
          <stop offset="1" stop-color="color-mix(in srgb, var(--nilan-bg,#14171c) 55%, #1a2026)"/>
        </linearGradient>
        <linearGradient id="nilan-supply-flow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#3d8dff"/>
          <stop offset="1" stop-color="#e07a32"/>
        </linearGradient>
        <linearGradient id="nilan-extract-flow" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stop-color="#e08b86"/>
          <stop offset="1" stop-color="#9aa3ab"/>
        </linearGradient>
        <clipPath id="nilan-hx-clip"><polygon points="${diamond}"/></clipPath>
      </defs>
      <style>
        text{font-family:var(--nilan-font,Roboto,ui-sans-serif,system-ui,sans-serif)}
        .pipe-shadow{fill:none;stroke:#000;stroke-opacity:.28;stroke-width:26;stroke-linecap:round;stroke-linejoin:round;transform:translateY(2px)}
        .pipe-body{fill:none;stroke:url(#nilan-metal);stroke-width:22;stroke-linecap:round;stroke-linejoin:round}
        .pipe-bore{fill:none;stroke:color-mix(in srgb, var(--nilan-bg,#14171c) 78%, #000);stroke-width:12;stroke-linecap:round;stroke-linejoin:round}
        .pipe-flow{fill:none;stroke-width:6.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:2 10}
        .pipe-flow.outdoor{stroke:#3d8dff}
        .pipe-flow.supply{stroke:#e07a32}
        .pipe-flow.extract{stroke:#e08b86}
        .pipe-flow.exhaust{stroke:#9aa3ab}
        .pipe-flow.bypass{stroke:#8ea0b3;stroke-opacity:.35}
        .running.bypass-open .pipe-flow.bypass{stroke:#3d8dff;stroke-opacity:1;animation:nilan-flow var(--nilan-flow-speed,1.15s) linear infinite}
        .running .pipe-flow.outdoor,.running .pipe-flow.supply,.running .pipe-flow.extract,.running .pipe-flow.exhaust{animation:nilan-flow var(--nilan-flow-speed,1.15s) linear infinite}
        .flange-ring{fill:#000;fill-opacity:.25}
        .flange-face{fill:url(#nilan-metal);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 35%, #66717b);stroke-width:.6}
        .flange-bore{fill:color-mix(in srgb, var(--nilan-bg,#14171c) 80%, #000)}
        .chev{offset-rotate:auto;offset-distance:0%}
        .running .chev{animation:nilan-march var(--nilan-flow-speed,1.15s) linear infinite}
        .chev path{fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
        .chev.outdoor path{stroke:#7eb6ff}
        .chev.supply path{stroke:#f0a36a}
        .chev.extract path{stroke:#f0b2ad}
        .chev.exhaust path{stroke:#c5ced6}
        .running.bypass-open .chev.bypass{animation:nilan-march var(--nilan-flow-speed,1.15s) linear infinite}
        .chev.bypass path{stroke:#7eb6ff}
        .hx-shadow{fill:#000;fill-opacity:.28}
        .hx-side{fill:color-mix(in srgb, var(--nilan-fg,#e8eef6) 10%, #4d575f);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 22%, #3a434b);stroke-width:1}
        .hx-top{fill:url(#nilan-metal-top);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 45%, #9aa6b0);stroke-width:1}
        .hx-face{fill:url(#nilan-hx);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 28%, #8b97a1);stroke-width:1.4}
        .hx-hatch{stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 28%, #9aa3ab);stroke-width:.7}
        .hx-path{fill:none;stroke-width:9;stroke-linecap:round;stroke-linejoin:round;opacity:.9}
        .hx-path.supply{stroke:url(#nilan-supply-flow)}
        .hx-path.extract{stroke:url(#nilan-extract-flow)}
        .filter-body{fill:color-mix(in srgb, var(--nilan-bg,#14171c) 70%, #66717b);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 40%, #8b97a1);stroke-width:1.2}
        .pleat{fill:none;stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 55%, #c5ced6);stroke-width:1.15;stroke-linejoin:round}
        .filter.alarm .filter-body{stroke:#d15b4a;fill:color-mix(in srgb,#d15b4a 22%, var(--nilan-bg,#14171c))}
        .filter.alarm .pleat,.alarm-note{stroke:#e07a6a;fill:#e07a6a}
        .fan-shadow{fill:#000;fill-opacity:.28}
        .fan-housing{fill:url(#nilan-metal);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 32%, #5c6770);stroke-width:1.3}
        .fan-well{fill:color-mix(in srgb, var(--nilan-bg,#14171c) 88%, #000);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 18%, #000);stroke-width:.6}
        .rotor{fill:color-mix(in srgb, var(--nilan-fg,#e8eef6) 55%, #9aa6b0)}
        .running .rotor{animation:nilan-spin var(--nilan-supply-spin,1.7s) linear infinite;transform-box:fill-box;transform-origin:center}
        .running [data-part="extract_fan"] .rotor{animation-duration:var(--nilan-extract-spin,1.8s)}
        .running .rotor.stopped{animation:none}
        .hub{fill:color-mix(in srgb, var(--nilan-fg,#e8eef6) 75%, #fff);stroke:color-mix(in srgb, var(--nilan-bg,#14171c) 40%, #000);stroke-width:.5}
        .probe{fill:color-mix(in srgb, var(--nilan-bg,#14171c) 30%, #d7e0e7);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 55%, #223);stroke-width:1}
        .probe-shine{fill:#fff;fill-opacity:.55}
        .probe-code{font-size:7.5px;font-weight:750;fill:#1c242c}
        .lcd-box{fill:color-mix(in srgb, var(--nilan-bg,#14171c) 86%, #000);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 22%, #000);stroke-width:.8}
        .lcd-text{font-size:10px;font-weight:700;fill:var(--nilan-fg,#e8eef6);font-variant-numeric:tabular-nums}
        .lcd-text .unit{font-size:7px;font-weight:550;fill:var(--nilan-muted,#93a0b0)}
        .tag{cursor:pointer}
        .fan-note,.symbol-note,.damper-note,.end-label{fill:var(--nilan-muted,#93a0b0);font-size:9px}
        .fan-note{font-variant-numeric:tabular-nums;font-weight:650;fill:var(--nilan-fg,#e8eef6)}
        .end-label{font-size:10px;font-weight:650}
        .end-label.outdoor{fill:#7eb6ff}
        .end-label.supply{fill:#f0a36a}
        .end-label.extract{fill:#f0b2ad}
        .end-label.exhaust{fill:#c5ced6}
        .arrow{fill:none;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}
        .arrow.outdoor{stroke:#7eb6ff}.arrow.supply{stroke:#f0a36a}.arrow.extract{stroke:#f0b2ad}.arrow.exhaust{stroke:#c5ced6}
        .damper-housing{fill:url(#nilan-metal);stroke:color-mix(in srgb, var(--nilan-fg,#e8eef6) 30%, #667);stroke-width:1}
        .damper{stroke:#d7dee4;stroke-width:2.2;stroke-linecap:round;fill:none}
        .bypass-open .damper,.bypass-opening .damper,.bypass-closing .damper{stroke:#e0a15a}
        .eff-kicker{font-size:8px;fill:var(--nilan-muted,#93a0b0);font-weight:650}
        .eff-value{font-size:16px;font-weight:750;fill:var(--nilan-fg,#e8eef6);font-variant-numeric:tabular-nums;cursor:pointer}
        .eff-value .unit{font-size:9px;font-weight:600;fill:var(--nilan-muted,#93a0b0)}
        .coil rect{fill:color-mix(in srgb, var(--nilan-bg,#14171c) 55%, #8a623c);stroke:#c4895a;stroke-width:1}
        .coil path{fill:none;stroke:#e0b48a;stroke-width:1.2}
        .bypass-note{font-size:9px;font-weight:650}
        @keyframes nilan-flow{to{stroke-dashoffset:-24}}
        @keyframes nilan-march{to{offset-distance:100%}}
        @keyframes nilan-spin{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion: reduce){
          .pipe-flow,.chev,.running .rotor,.running.bypass-open .pipe-flow.bypass{animation:none}
        }
      </style>
      ${pipe(bypassDuct, 'bypass', 'bypass-duct')}
      ${pipe(exhaust, 'exhaust', 'exhaust')}
      ${pipe(extract, 'extract', 'extract')}
      ${pipe(outdoor, 'outdoor', 'outdoor')}
      ${pipe(supply, 'supply', 'supply')}
      ${flange(148, 104, true)}
      ${flange(128, 62, false)}
      ${flange(276, 104, true)}
      ${flange(300, 62, false)}
      ${flange(140, 252, true)}
      ${flange(112, 312, false)}
      ${flange(292, 252, true)}
      ${flange(320, 312, false)}
      ${flange(96, 364, true)}
      ${flange(344, 364, true)}
      <g data-part="exchanger">
        <polygon class="hx-shadow" points="${box.x + 4},${box.y + 8} ${right + depth.x},${box.y + 8} ${right + depth.x},${bottom + 8} ${box.x + 4},${bottom + 8}"/>
        <polygon class="hx-side" points="${right},${box.y} ${right + depth.x},${box.y + depth.y} ${right + depth.x},${bottom + depth.y} ${right},${bottom}"/>
        <polygon class="hx-top" points="${box.x},${box.y} ${box.x + depth.x},${box.y + depth.y} ${right + depth.x},${box.y + depth.y} ${right},${box.y}"/>
        <rect class="hx-face" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="8"/>
        <g clip-path="url(#nilan-hx-clip)" class="hx-hatch">
          ${hatch.join('')}
          <g transform="rotate(90 ${cx} ${cy})">${hatch.join('')}</g>
        </g>
        <polygon points="${diamond}" fill="none" stroke="color-mix(in srgb, var(--nilan-fg,#e8eef6) 40%, #9aa3ab)" stroke-width="1.3"/>
        <path class="hx-path supply" d="M${box.x + 24} ${cy + 16} C ${cx - 24} ${cy + 22}, ${cx + 24} ${cy - 22}, ${right - 24} ${cy - 16}"/>
        <path class="hx-path extract" d="M${cx + 16} ${box.y + 24} C ${cx + 22} ${cy - 24}, ${cx - 22} ${cy + 24}, ${cx - 16} ${bottom - 24}"/>
        <text class="eff-kicker" x="${cx}" y="${cy - 8}" text-anchor="middle">${esc(v.efficiencyTitle || 'Varmegenvinding')}</text>
        <text class="eff-value" data-sensor="efficiency" x="${cx}" y="${cy + 12}" text-anchor="middle">${lcd(v.efficiency || '—')}</text>
      </g>
      <g data-part="bypass" data-state="${bypass}" class="bypass-${bypass}" transform="translate(220 364)">
        <circle class="damper-housing" r="13"/>
        ${blade ? `<path class="damper" d="${blade}"/>` : ''}
        <path class="damper" d="M-4.2 -4.2 L4.2 4.2 M-4.2 4.2 L4.2 -4.2" stroke-width="1.1"/>
        <rect x="-3" y="-20" width="6" height="8" rx="1" fill="url(#nilan-metal)"/>
      </g>
      ${v.bypassShort ? `<text class="damper-note bypass-note" x="220" y="392" text-anchor="middle">${esc(v.bypassShort)}</text>` : ''}
      ${filter(70, 312, alarm, v.filterDays, 292)}
      ${filter(338, 62, alarm, v.filterDays, 48)}
      ${fan(104, 62, 'extract_fan', !!v.extractSpin, v.extractPct, v.extractStep, true)}
      ${fan(366, 312, 'supply_fan', !!v.supplySpin, v.supplyPct, v.supplyStep, false)}
      ${pre}${re}
      ${probe(52, 62, 'exhaust', 't4_exhaust', 'T4', v.t4, 96)}
      ${probe(404, 62, 'extract', 't3_extract', 'T3', v.t3, 96)}
      ${probe(378, 136, 'humidity', 'humidity', 'RH', v.humidity, 162)}
      ${probe(48, 312, 'outdoor', 't8_outdoor', 'T8', v.t8, 346)}
      ${probe(400, 312, 'supply', 't7_supply', 'T7', v.t7, 346)}
      ${endLabel(16, 22, 'start', v.exhaust1 || 'Afkast', v.exhaust2 || 'til det fri', 'exhaust')}
      ${endLabel(424, 22, 'end', v.extract1 || 'Udsugning', v.extract2 || 'fra boligen', 'extract')}
      ${endLabel(16, 236, 'start', v.outdoor1 || 'Udeluft', v.outdoor2 || 'fra det fri', 'outdoor')}
      ${endLabel(424, 236, 'end', v.supply1 || 'Indblæsning', v.supply2 || 'til boligen', 'supply')}
      <path class="arrow exhaust" d="M36 48 H16 L22 43 M16 48 L22 53"/>
      <path class="arrow extract" d="M392 48 H412 L406 43 M412 48 L406 53"/>
      <path class="arrow outdoor" d="M16 292 H36 L30 287 M36 292 L30 297"/>
      <path class="arrow supply" d="M392 292 H412 L406 287 M412 292 L406 297"/>
      ${running ? chevrons('M120 62 H28', 'exhaust', 3) : ''}
      ${running ? chevrons('M408 62 H310', 'extract', 3) : ''}
      ${running ? chevrons('M28 312 H100', 'outdoor', 3) : ''}
      ${running ? chevrons('M330 312 H408', 'supply', 3) : ''}
      ${running && bypass === 'open' ? chevrons('M110 364 H330', 'bypass', 3) : ''}
    </svg>`;
  }

  root.NilanDiagram = { markup };
})(typeof globalThis === 'undefined' ? window : globalThis);

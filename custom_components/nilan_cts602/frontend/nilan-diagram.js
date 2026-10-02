/* P&ID schematic for a Comfort 300 LR cross-flow unit.

Thin ducts, small symbols and sensor tags on the lines. Outdoor air on this
controller is T8 (T0 is the controller board; T1 is only an alarm input).
Colour is muted. Amber and red are reserved for an open bypass and a filter alarm.
*/
(function (root) {
  function esc(value) {
    return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function chevron(x, y, dir, tone) {
    const tip = x + dir * 4.5;
    return `<path class="chevron ${tone || ''}" d="M${x} ${y - 2.6} L${tip} ${y} L${x} ${y + 2.6}" />`;
  }

  function valueMarkup(value) {
    const text = String(value ?? '—');
    const match = text.match(/^(.*?)\s+(°C|%|d|ppm|min)$/);
    if (!match) return esc(text);
    return `<tspan>${esc(match[1])}</tspan><tspan class="unit"> ${esc(match[2])}</tspan>`;
  }

  function sensor(x, y, side, part, sensorId, title, value) {
    const titleY = side === 'above' ? y - 34 : y + 18;
    const valueY = side === 'above' ? y - 14 : y + 38;
    const anchor = x < 70 ? 'start' : 'middle';
    const textX = anchor === 'start' ? 8 : x;
    return `<g class="tag" data-part="${part}" data-sensor="${sensorId}">
      <circle class="bubble" cx="${x}" cy="${y}" r="2.4"/>
      <text class="tag-title" x="${textX}" y="${titleY}" text-anchor="${anchor}">${esc(title)}</text>
      <text class="tag-value" x="${textX}" y="${valueY}" text-anchor="${anchor}">${valueMarkup(value)}</text>
    </g>`;
  }

  function filter(x, y, alarm, days, noteX, noteY) {
    return `<g data-part="filter" class="filter ${alarm ? 'alarm' : 'idle'}" transform="translate(${x} ${y})">
      <rect x="-8" y="-9" width="16" height="18" rx="1"/>
      <path d="M-5 -6 H5 L-5 -2 H5 L-5 2 H5 L-5 6 H5"/>
    </g>
    <text class="symbol-note ${alarm ? 'alarm-note' : ''}" x="${noteX}" y="${noteY}" text-anchor="middle">${esc(days || '')}</text>`;
  }

  function fan(x, y, part, running, pct, step, noteY) {
    return `<g data-part="${part}" class="fan" transform="translate(${x} ${y})">
      <circle class="fan-ring" r="9"/>
      <g class="${running ? 'rotor' : 'rotor stopped'}">
        <path d="M0 0 C2.1 -1.4 3.2 -5.4 1.1 -7.2 C-0.7 -5.5 -0.5 -2 0 0"/>
        <path transform="rotate(120)" d="M0 0 C2.1 -1.4 3.2 -5.4 1.1 -7.2 C-0.7 -5.5 -0.5 -2 0 0"/>
        <path transform="rotate(240)" d="M0 0 C2.1 -1.4 3.2 -5.4 1.1 -7.2 C-0.7 -5.5 -0.5 -2 0 0"/>
      </g>
      <circle class="hub" r="1.35"/>
    </g>
    <text class="fan-note" data-part="${part}-note" x="${x}" y="${noteY}" text-anchor="middle">${esc(pct || '')}</text>
    <text class="fan-note" data-part="${part}-note" x="${x}" y="${noteY + 13}" text-anchor="middle">${esc(step || '')}</text>`;
  }

  function coil(x, y, part, label) {
    return `<g data-part="${part}" class="coil" transform="translate(${x} ${y})">
      <path d="M-8 0 C-6 -4.2 -2 -4.2 0 0 S6 -4.2 8 0"/>
    </g>
    <text class="symbol-note" x="${x}" y="${y + 16}" text-anchor="middle">${esc(label)}</text>`;
  }

  function channels(poly) {
    const cold = [];
    const warm = [];
    for (let i = -4; i <= 4; i += 1) {
      const offset = i * 10;
      const coldSeg = clipSeg({ x: 120 + offset, y: 40 }, { x: 230 + offset, y: 170 }, poly);
      const warmSeg = clipSeg({ x: 120 + offset, y: 170 }, { x: 230 + offset, y: 40 }, poly);
      if (coldSeg) cold.push(`M${round(coldSeg[0].x)} ${round(coldSeg[0].y)} L${round(coldSeg[1].x)} ${round(coldSeg[1].y)}`);
      if (warmSeg) warm.push(`M${round(warmSeg[0].x)} ${round(warmSeg[0].y)} L${round(warmSeg[1].x)} ${round(warmSeg[1].y)}`);
    }
    return `<path class="hx-cold" d="${cold.join(' ')}"/><path class="hx-warm" d="${warm.join(' ')}"/>`;
  }

  function round(value) {
    return Math.round(value * 10) / 10;
  }

  function leftOf(point, a, b) {
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
  }

  function clipSeg(start, end, poly) {
    let a = start;
    let b = end;
    for (let i = 0; i < poly.length; i += 1) {
      const edgeA = poly[i];
      const edgeB = poly[(i + 1) % poly.length];
      const inA = leftOf(a, edgeA, edgeB) <= 0;
      const inB = leftOf(b, edgeA, edgeB) <= 0;
      if (!inA && !inB) return null;
      if (inA && inB) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const ex = edgeB.x - edgeA.x;
      const ey = edgeB.y - edgeA.y;
      const denom = dx * ey - dy * ex;
      const t = ((edgeA.x - a.x) * ey - (edgeA.y - a.y) * ex) / denom;
      const hit = { x: a.x + t * dx, y: a.y + t * dy };
      if (inA) b = hit;
      else a = hit;
    }
    return [a, b];
  }

  function markup(plant, values) {
    const v = values || {};
    const fitted = plant || {};
    const bypass = v.bypass === 'opening' || v.bypass === 'closing'
      ? v.bypass
      : v.bypass === 'open' ? 'open' : v.bypass === 'closed' ? 'closed' : 'unknown';
    const running = !!v.running;
    const alarm = !!v.filterAlarm;
    const flow = running ? 'duct flow' : 'duct';
    const bypassFlow = running && bypass === 'open' ? 'duct flow cold' : 'duct';
    const supplyY = 76;
    const extractY = 130;
    const cx = 170;
    const cy = 103;
    const rx = 30;
    const ry = 44;
    const top = cy - ry;
    const span = (supplyY - top) / ry;
    const hxIn = round(cx - rx * span);
    const hxOut = round(cx + rx * span);
    const poly = [
      { x: cx, y: top },
      { x: cx + rx, y: cy },
      { x: cx, y: cy + ry },
      { x: cx - rx, y: cy },
    ];
    const points = poly.map((point) => `${point.x},${point.y}`).join(' ');
    const blade = bypass === 'open' ? 'M-7 0 H7' : bypass === 'closed' ? 'M0 -7 V7' : 'M-5 -5 L5 5';
    const supplySpin = v.supplySpin || '1.70';
    const extractSpin = v.extractSpin || '1.80';
    const flowSpeed = v.flowSpeed || '1.05';
    const supplyNoteY = 96;
    const extractNoteY = 96;
    const pre = fitted.preheater ? coil(62, supplyY, 'preheater', 'FV') : '';
    const re = fitted.reheater && fitted.reheater !== 'none'
      ? coil(206, supplyY, 'reheater', fitted.reheater === 'water' ? 'VV' : 'EV')
      : '';
    const t15 = v.t15
      ? `<text class="house-note" data-part="t15" data-sensor="t15_panel" x="332" y="170" text-anchor="middle">${esc(v.t15Title || 'T15')}</text>
         <text class="house-note" data-part="t15" data-sensor="t15_panel" x="332" y="186" text-anchor="middle">${esc(v.t15)}</text>`
      : '';
    return `<svg viewBox="0 0 360 198" width="100%" data-diagram="pid" class="${running ? 'running' : 'stopped'}" style="--nilan-supply-spin:${supplySpin}s;--nilan-extract-spin:${extractSpin}s;--nilan-flow-speed:${flowSpeed}s" role="img">
      <style>
        text{font-family:var(--nilan-font,Roboto,ui-sans-serif,system-ui,sans-serif)}
        .duct{fill:none;stroke:#8b95a1;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round}
        .cold{stroke:#7f93a8}.warm{stroke:#b08978}.supply{stroke:#7b9b88}.bypass-live{stroke:#c49a6a}
        .flow{stroke-dasharray:2.6 2.2;animation:nilan-flow var(--nilan-flow-speed,1.05s) linear infinite}
        .chevron{fill:none;stroke-width:1.05;stroke-linecap:round;stroke-linejoin:round}
        .chevron.cold{stroke:#7f93a8}.chevron.warm{stroke:#b08978}.chevron.supply{stroke:#7b9b88}
        .hx-shell{fill:color-mix(in srgb,var(--nilan-fg,#e8eef6) 4%,var(--nilan-bg,#14171c));stroke:#8b95a1;stroke-width:1.15}
        .hx-cold{stroke:#7f93a8;stroke-width:0.85;fill:none}
        .hx-warm{stroke:#b08978;stroke-width:0.85;fill:none}
        .filter rect{fill:var(--nilan-bg,#14171c);stroke:#8b95a1;stroke-width:1}
        .filter path{fill:none;stroke:#8b95a1;stroke-width:0.95;stroke-linejoin:round}
        .filter.alarm rect{stroke:#c45c4a;fill:color-mix(in srgb,#c45c4a 16%,var(--nilan-bg,#14171c))}
        .filter.alarm path{stroke:#c45c4a}
        .alarm-note{fill:#c45c4a}
        .fan-ring{fill:var(--nilan-bg,#14171c);stroke:#8b95a1;stroke-width:1.05}
        .rotor{fill:#8b95a1}
        .running .rotor{animation:nilan-spin var(--nilan-supply-spin,1.7s) linear infinite;transform-box:fill-box;transform-origin:center}
        .running [data-part="extract_fan"] .rotor{animation-duration:var(--nilan-extract-spin,1.8s)}
        .running .rotor.stopped{animation:none}
        .hub{fill:var(--nilan-bg,#14171c);stroke:#8b95a1;stroke-width:0.6}
        .coil path{fill:none;stroke:#b08978;stroke-width:1.15}
        .bubble{fill:var(--nilan-bg,#14171c);stroke:var(--nilan-fg,#e8eef6);stroke-width:1}
        .tag{cursor:pointer}
        .tag-title,.eff-title,.house-note,.symbol-note,.damper-note{fill:var(--nilan-muted,#93a0b0)}
        .tag-title{font-size:10px}
        .tag-value,.eff-value{fill:var(--nilan-fg,#e8eef6);font-weight:650;font-variant-numeric:tabular-nums}
        .tag-value{font-size:12px}
        .tag-value .unit{font-size:8px;font-weight:500;fill:var(--nilan-muted,#93a0b0)}
        .symbol-note,.damper-note,.eff-title,.house-note{font-size:9px}
        .fan-note{fill:var(--nilan-muted,#93a0b0);font-size:8px}
        .house{fill:none;stroke:#8b95a1;stroke-width:1.15;stroke-linejoin:round}
        .house-name{fill:var(--nilan-fg,#e8eef6);font-size:11px}
        .room-value{fill:var(--nilan-fg,#e8eef6);font-size:10px;font-weight:650;cursor:pointer}
        .damper{stroke:#8b95a1;stroke-width:1.35;stroke-linecap:round;fill:none}
        .bypass-open .damper,.bypass-opening .damper,.bypass-closing .damper{stroke:#c47a3a}
        .eff-value{font-size:12px;cursor:pointer}
        .hit{fill:transparent;cursor:pointer}
        @keyframes nilan-flow{to{stroke-dashoffset:-9.6}}
        @keyframes nilan-spin{to{transform:rotate(360deg)}}
        @media (prefers-reduced-motion: reduce){.flow,.running .rotor{animation:none}}
      </style>
      <path class="${bypassFlow}" data-part="bypass-duct" d="M134 ${supplyY} V28 H198 V${supplyY}"/>
      <g data-part="bypass" data-state="${bypass}" class="bypass-${bypass}" transform="translate(166 28)">
        <path class="damper" d="${blade}"/>
        <path class="damper" d="M-3.4 -3.4 L3.4 3.4 M-3.4 3.4 L3.4 -3.4" stroke-width="0.9"/>
      </g>
      ${v.bypassShort ? `<text class="damper-note" x="166" y="16" text-anchor="middle">${esc(v.bypassShort)}</text>` : ''}
      <path class="${flow} cold" data-flow="outdoor" d="M8 ${supplyY} H80"/>
      ${chevron(54, supplyY, 1, 'cold')}
      <path class="${flow} cold" data-flow="outdoor" d="M96 ${supplyY} H103"/>
      <path class="${flow} cold" data-flow="supply" d="M121 ${supplyY} H${hxIn}"/>
      <path class="${flow} supply" data-flow="supply" d="M${hxOut} ${supplyY} H310"/>
      ${chevron(214, supplyY, 1, 'supply')}
      <path class="${flow} warm" data-flow="extract" d="M310 ${extractY} H258"/>
      ${chevron(300, extractY, -1, 'warm')}
      <path class="${flow} warm" data-flow="extract" d="M242 ${extractY} H231"/>
      <path class="${flow} warm" data-flow="extract" d="M213 ${extractY} H${hxOut}"/>
      <path class="${flow} warm" data-flow="exhaust" d="M${hxIn} ${extractY} H8"/>
      ${chevron(96, extractY, -1, 'warm')}
      <g data-part="exchanger">
        <polygon class="hx-shell" points="${points}"/>
        ${channels(poly)}
      </g>
      ${filter(88, supplyY, alarm, v.filterDays, 88, 52)}
      ${fan(112, supplyY, 'supply_fan', !!v.supplySpin, v.supplyPct, v.supplyStep, supplyNoteY)}
      ${fan(222, extractY, 'extract_fan', !!v.extractSpin, v.extractPct, v.extractStep, extractNoteY)}
      ${filter(250, extractY, alarm, v.filterDays, 250, 114)}
      ${pre}${re}
      <text class="eff-title" data-part="efficiency" x="${cx}" y="164" text-anchor="middle">${esc(v.efficiencyTitle || '')}</text>
      <text class="eff-value" data-part="efficiency" data-sensor="efficiency" x="${cx}" y="184" text-anchor="middle">${valueMarkup(v.efficiency || '—')}</text>
      <rect class="hit" data-sensor="efficiency" x="${cx - 46}" y="152" width="92" height="36"/>
      ${sensor(34, supplyY, 'above', 'outdoor', 't8_outdoor', v.outdoorTitle || 'T8 Udeluft', v.t8)}
      ${sensor(248, supplyY, 'above', 'supply', 't7_supply', v.supplyTitle || 'T7 Indblæs', v.t7)}
      ${sensor(272, extractY, 'below', 'extract', 't3_extract', v.extractTitle || 'T3 Udsug', v.t3)}
      ${sensor(34, extractY, 'below', 'exhaust', 't4_exhaust', v.exhaustTitle || 'T4 Afkast', v.t4)}
      <g data-part="house">
        <path class="house" d="M312 70 L332 52 L352 70 V140 H312 Z"/>
        <text class="house-name" x="332" y="100" text-anchor="middle">${esc(v.house || '')}</text>
        <text class="room-value" data-part="room" data-sensor="room_temperature" x="332" y="116" text-anchor="middle">${esc(v.room || '—')}</text>
        ${t15}
      </g>
    </svg>`;
  }

  root.NilanDiagram = { markup };
})(typeof globalThis === 'undefined' ? window : globalThis);

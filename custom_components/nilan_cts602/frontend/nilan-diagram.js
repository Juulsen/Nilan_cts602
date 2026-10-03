/* HMI diagram for a Comfort 300 LR.

Two straight metal ducts and a cross-flow plate exchanger: a diamond plate
pack in a housing that spans both ducts. Not a rotary wheel. Outdoor air is T8.
*/
(function (root) {
  function esc(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function duct(x, y, w, h) {
    return `<rect class="duct" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>
      <rect class="duct-hi" x="${x + 2}" y="${y + 2}" width="${Math.max(0, w - 4)}" height="3" rx="1"/>`;
  }

  function flange(x, y, h) {
    return `<g class="flange" transform="translate(${x} ${y})">
      <rect x="-3" y="0" width="6" height="${h}" rx="1"/>
    </g>`;
  }

  function fan(x, y, part, spinning, outletRight) {
    const nozzle = outletRight
      ? `<rect class="fan-outlet" x="8" y="-8" width="16" height="16" rx="2"/>`
      : `<rect class="fan-outlet" x="-24" y="-8" width="16" height="16" rx="2"/>`;
    return `<g data-part="${part}" class="fan" transform="translate(${x} ${y})">
      ${nozzle}
      <circle class="fan-shadow" r="19" cy="1.5"/>
      <circle class="fan-housing" r="18"/>
      <circle class="fan-well" r="11"/>
      <g class="${spinning ? 'rotor' : 'rotor stopped'}">
        <path d="M0 0 C2.4 -1.2 3.6 -7.4 0.6 -10.2 C-1.6 -6.6 -0.8 -2 0 0"/>
        <path transform="rotate(120)" d="M0 0 C2.4 -1.2 3.6 -7.4 0.6 -10.2 C-1.6 -6.6 -0.8 -2 0 0"/>
        <path transform="rotate(240)" d="M0 0 C2.4 -1.2 3.6 -7.4 0.6 -10.2 C-1.6 -6.6 -0.8 -2 0 0"/>
      </g>
      <circle class="hub" r="2.2"/>
    </g>`;
  }

  function filter(x, y, alarm) {
    return `<g data-part="filter" class="filter ${alarm ? 'alarm' : 'idle'}" transform="translate(${x} ${y})">
      <rect class="filter-body" x="-15" y="-16" width="30" height="32" rx="1.5"/>
      <path class="pleat" d="M-10 -12 L-5 -7 L-10 -2 L-5 3 L-10 8 L-5 12 M-2 -12 L3 -7 L-2 -2 L3 3 L-2 8 L3 12 M6 -12 L10 -7 L6 -2 L10 3 L6 8"/>
    </g>`;
  }

  function coil(x, y, part) {
    return `<g data-part="${part}" class="coil" transform="translate(${x} ${y})">
      <rect x="-8" y="-14" width="16" height="28" rx="2"/>
      <path d="M-5 -9 H5 M-5 -4.5 H5 M-5 0 H5 M-5 4.5 H5 M-5 9 H5"/>
    </g>`;
  }

  function tag(x, y, part, sensorId, code) {
    return `<g class="sensor" data-part="${part}" data-sensor="${sensorId}">
      <circle class="head" cx="${x}" cy="${y}" r="8"/>
      <text class="tag-name" font-size="8" x="${x}" y="${y + 3}" text-anchor="middle">${esc(code)}</text>
    </g>`;
  }

  function valueBox(x, y, w, h, text, sensorId) {
    const raw = String(text ?? '').trim();
    if (!raw) return '';
    const sensor = sensorId ? ` data-sensor="${sensorId}"` : '';
    return `<g class="vbox"${sensor}>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>
      <text class="value-text" font-size="27" x="${x + w / 2}" y="${y + 23}" text-anchor="middle">${esc(raw)}</text>
    </g>`;
  }

  function driftTag(x, y, on, label) {
    const w = 62;
    return `<g class="drift ${on ? 'on' : 'off'}" transform="translate(${x - w / 2} ${y})">
      <rect width="${w}" height="16" rx="2"/>
      <text font-size="12" x="${w / 2}" y="12" text-anchor="middle">${esc(label)}</text>
    </g>`;
  }

  function endLabel(x, y, anchor, line1, line2, tone) {
    return `<text class="end-label ${tone}" font-size="14" x="${x}" y="${y}" text-anchor="${anchor}">${esc(line1)}</text>
      <text class="end-label ${tone}" font-size="14" x="${x}" y="${y + 22}" text-anchor="${anchor}">${esc(line2)}</text>`;
  }

  function chevrons(x1, x2, y, tone, count) {
    const dir = x2 >= x1 ? 1 : -1;
    const span = Math.abs(x2 - x1);
    return Array.from({ length: count }, (_, index) => {
      const at = x1 + dir * ((index + 0.5) / count) * span;
      const tip = at + dir * 6;
      const delay = (-index / count).toFixed(2);
      return `<path class="chev ${tone}" style="animation-delay:${delay}s" d="M${at} ${y - 4} L${tip} ${y} L${at} ${y + 4}"/>`;
    }).join('');
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
    const bypassLabel = v.bypassLabel || (
      bypass === 'open' ? 'åben'
        : bypass === 'closed' ? 'lukket'
          : bypass === 'opening' ? 'åbner…'
            : bypass === 'closing' ? 'lukker…'
              : ''
    );
    const blade = bypass === 'open' ? 'M-8 0 H8' : bypass === 'closed' ? 'M0 -8 V8' : bypass === 'unknown' ? '' : 'M-6 -5 L6 5';
    const drift = v.drift || 'Drift';
    const stopped = v.stopped || 'Stop';

    const topY = 128;
    const botY = 228;
    const ductH = 40;
    const topCy = topY + ductH / 2;
    const botCy = botY + ductH / 2;
    const house = { x: 304, y: 116, w: 164, h: 164 };
    const cx = house.x + house.w / 2;
    const cy = house.y + house.h / 2;
    const rx = 62;
    const ry = 72;
    const diamond = `${cx},${cy - ry} ${cx + rx},${cy} ${cx},${cy + ry} ${cx - rx},${cy}`;
    const boxY = 92;
    const boxH = 32;
    const lowY = 356;
    const pre = fitted.preheater ? coil(210, botCy, 'preheater') : '';
    const re = fitted.reheater && fitted.reheater !== 'none' ? coil(500, botCy, 'reheater') : '';

    return `<svg viewBox="0 0 780 408" width="100%" data-diagram="hmi" class="${running ? 'running' : 'stopped'} bypass-${bypass}" style="--nilan-supply-spin:${supplySpin}s;--nilan-extract-spin:${extractSpin}s;--nilan-flow-speed:${flowSpeed}s" role="img">
      <defs>
        <linearGradient id="nilan-duct" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--hmi-duct-hi,#f7fafc)"/>
          <stop offset="0.42" stop-color="var(--hmi-duct-mid,#c5d0d8)"/>
          <stop offset="1" stop-color="var(--hmi-duct-lo,#8b9aa6)"/>
        </linearGradient>
        <linearGradient id="nilan-frame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--hmi-duct-hi,#f7fafc)"/>
          <stop offset="0.45" stop-color="var(--hmi-duct-mid,#c5d0d8)"/>
          <stop offset="1" stop-color="var(--hmi-frame,#6a7884)"/>
        </linearGradient>
        <linearGradient id="nilan-cold" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#2f7fe0"/>
          <stop offset="1" stop-color="#e07a32"/>
        </linearGradient>
        <linearGradient id="nilan-warm" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e08b86"/>
          <stop offset="1" stop-color="#8e99a3"/>
        </linearGradient>
        <clipPath id="nilan-diamond"><polygon points="${diamond}"/></clipPath>
      </defs>
      <style>
        text{font-family:var(--nilan-font,Roboto,ui-sans-serif,system-ui,sans-serif)}
        .panel{fill:var(--hmi-panel,#d5dee8)}
        .duct{fill:url(#nilan-duct);stroke:var(--hmi-frame,#6a7884);stroke-width:1.2}
        .duct-hi{fill:#fff;fill-opacity:.45}
        .flange rect{fill:url(#nilan-frame);stroke:var(--hmi-frame,#6a7884);stroke-width:.6}
        .hx-shadow{fill:#000;fill-opacity:.18}
        .hx-side{fill:var(--hmi-frame,#6a7884)}
        .hx-face{fill:url(#nilan-frame);stroke:var(--hmi-ink,#1b2830);stroke-width:1.3}
        .hx-diamond{fill:color-mix(in srgb, var(--hmi-box,#fff) 72%, var(--hmi-duct-mid,#c5d0d8));stroke:var(--hmi-ink,#1b2830);stroke-width:1.4}
        .hx-hatch{stroke:color-mix(in srgb, var(--hmi-ink,#1b2830) 55%, var(--hmi-duct-lo,#8b9aa6));stroke-width:.7}
        .hx-path{fill:none;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}
        .hx-path.cold{stroke:url(#nilan-cold)}
        .hx-path.warm{stroke:url(#nilan-warm)}
        .filter-body{fill:var(--hmi-box,#fff);stroke:var(--hmi-frame,#6a7884);stroke-width:1.2}
        .pleat{fill:none;stroke:var(--hmi-ink,#1b2830);stroke-width:1.15;stroke-linejoin:round}
        .filter.alarm .filter-body{stroke:#c4473a;fill:#f8d9d4}
        .filter.alarm .pleat{stroke:#c4473a}
        .fan-shadow{fill:#000;fill-opacity:.16}
        .fan-outlet,.fan-housing{fill:url(#nilan-duct);stroke:var(--hmi-frame,#6a7884);stroke-width:1.2}
        .fan-well{fill:color-mix(in srgb, var(--hmi-duct-lo,#8b9aa6) 70%, #24303a)}
        .rotor{fill:var(--hmi-panel-2,#eef3f7);stroke:var(--hmi-ink,#1b2830);stroke-width:.4}
        .running .rotor{animation:nilan-spin var(--nilan-supply-spin,1.7s) linear infinite;transform-box:fill-box;transform-origin:center}
        .running [data-part="extract_fan"] .rotor{animation-duration:var(--nilan-extract-spin,1.8s)}
        .running .rotor.stopped{animation:none}
        .hub{fill:var(--hmi-ink,#1b2830)}
        .head{fill:#c5ced6;stroke:#5c6b78;stroke-width:1}
        .tag-name{font-weight:750;fill:#1c2830}
        .vbox rect,.eff-box{fill:var(--hmi-box,#fff);stroke:var(--hmi-box-line,#6d8f5e);stroke-width:1.2}
        .value-text{font-weight:700;fill:var(--hmi-ink,#1b2830);font-variant-numeric:tabular-nums}
        .drift rect{fill:var(--hmi-line,#8ea0b0)}
        .drift.on rect{fill:var(--hmi-drift,#2e9a4a)}
        .drift text{font-weight:700;fill:var(--hmi-drift-ink,#fff)}
        .end-label{font-weight:650}
        .end-label.outdoor{fill:#2f7fe0}
        .end-label.supply{fill:#d26520}
        .end-label.extract{fill:#c45c58}
        .end-label.exhaust{fill:#5c6b78}
        .chev{fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
        .running .chev{animation:nilan-pulse var(--nilan-flow-speed,1.15s) linear infinite}
        .chev.outdoor{stroke:#2f7fe0}
        .chev.supply{stroke:#e07a32}
        .chev.extract{stroke:#e08b86}
        .chev.exhaust{stroke:#8e99a3}
        .eff-title{font-weight:700;fill:var(--hmi-ink,#1b2830)}
        .eff-value{font-weight:750}
        .eff-note{fill:var(--hmi-muted,#4c5d6b)}
        .bypass-metal{fill:url(#nilan-duct);stroke:var(--hmi-frame,#6a7884);stroke-width:1.1}
        .damper-housing{fill:url(#nilan-frame);stroke:var(--hmi-ink,#1b2830);stroke-width:1}
        .damper{stroke:var(--hmi-ink,#1b2830);stroke-width:2;stroke-linecap:round;fill:none}
        .bypass-open .damper,.bypass-opening .damper,.bypass-closing .damper{stroke:#d26520}
        .bypass-note{font-weight:700;fill:var(--hmi-ink,#1b2830)}
        .coil rect{fill:#f3e2d2;stroke:#b57445;stroke-width:1}
        .coil path{fill:none;stroke:#8a5a32;stroke-width:1.1}
        .sensor,.vbox,.eff-box{cursor:pointer}
        @keyframes nilan-spin{to{transform:rotate(360deg)}}
        @keyframes nilan-pulse{50%{opacity:.35}}
        @media (prefers-reduced-motion: reduce){
          .running .rotor,.running .chev{animation:none}
        }
      </style>
      <rect class="panel" x="0" y="0" width="780" height="408"/>
      <g data-part="exchanger">
        <rect class="hx-shadow" x="${house.x + 5}" y="${house.y + 6}" width="${house.w}" height="${house.h}" rx="2"/>
        <polygon class="hx-side" points="${house.x + house.w},${house.y} ${house.x + house.w + 8},${house.y + 6} ${house.x + house.w + 8},${house.y + house.h + 6} ${house.x + house.w},${house.y + house.h}"/>
        <rect class="hx-face" x="${house.x}" y="${house.y}" width="${house.w}" height="${house.h}" rx="2"/>
        <polygon class="hx-diamond" points="${diamond}"/>
        <g class="hx-hatch" clip-path="url(#nilan-diamond)">
          ${Array.from({ length: 17 }, (_, i) => {
            const y = cy - ry + 8 + i * 8;
            return `<line x1="${cx - rx}" y1="${y}" x2="${cx + rx}" y2="${y}"/>`;
          }).join('')}
          <g transform="rotate(90 ${cx} ${cy})">
            ${Array.from({ length: 15 }, (_, i) => {
              const y = cy - rx + 6 + i * 8;
              return `<line x1="${cx - ry}" y1="${y}" x2="${cx + ry}" y2="${y}"/>`;
            }).join('')}
          </g>
        </g>
        <polygon points="${diamond}" fill="none" stroke="var(--hmi-ink,#1b2830)" stroke-width="1.2"/>
        <path class="hx-path cold" d="M${cx - rx + 10} ${cy + 18} L${cx + rx - 10} ${cy - 18}"/>
        <path class="hx-path warm" d="M${cx + rx - 10} ${cy + 16} L${cx - rx + 10} ${cy - 16}"/>
      </g>
      <g data-part="exhaust" data-flow="exhaust">
        ${duct(108, topY, house.x - 108, ductH)}
        ${flange(168, topY - 3, ductH + 6)}
        ${flange(house.x, topY - 3, ductH + 6)}
      </g>
      <g data-part="extract" data-flow="extract">
        ${duct(house.x + house.w, topY, 672 - (house.x + house.w), ductH)}
        ${flange(house.x + house.w, topY - 3, ductH + 6)}
        ${flange(560, topY - 3, ductH + 6)}
      </g>
      <g data-part="outdoor" data-flow="outdoor">
        ${duct(108, botY, house.x - 108, ductH)}
        ${flange(200, botY - 3, ductH + 6)}
        ${flange(house.x, botY - 3, ductH + 6)}
      </g>
      <g data-part="supply" data-flow="supply">
        ${duct(house.x + house.w, botY, 672 - (house.x + house.w), ductH)}
        ${flange(house.x + house.w, botY - 3, ductH + 6)}
        ${flange(590, botY - 3, ductH + 6)}
      </g>
      <g data-part="bypass" data-state="${bypass}" class="bypass-${bypass}" data-flow="bypass">
        <path class="bypass-metal" d="M${cx - 54} ${botY + ductH} H${cx - 40} V318 H${cx + 40} V${botY + ductH} H${cx + 54} V324 H${cx - 54} Z"/>
        <g transform="translate(${cx} 306)">
          <circle class="damper-housing" r="11"/>
          ${blade ? `<path class="damper" d="${blade}"/>` : ''}
        </g>
        ${bypassLabel ? `<text class="bypass-note" font-size="16" x="${cx}" y="338" text-anchor="middle">${esc(bypassLabel)}</text>` : ''}
      </g>
      <g data-sensor="efficiency">
        <rect class="eff-box" x="286" y="6" width="208" height="80" rx="2"/>
        <text class="eff-title" font-size="15" x="390" y="24" text-anchor="middle">${esc(v.efficiencyTitle || 'Varmegenvinding')}</text>
        <text class="value-text eff-value" font-size="28" x="390" y="70" text-anchor="middle">${esc(v.efficiency || '—')}</text>
      </g>
      ${fan(248, topCy, 'extract_fan', !!v.extractSpin, false)}
      ${fan(530, botCy, 'supply_fan', !!v.supplySpin, true)}
      ${driftTag(248, 128, running && !!v.extractSpin, running && v.extractSpin ? drift : stopped)}
      ${driftTag(530, 210, running && !!v.supplySpin, running && v.supplySpin ? drift : stopped)}
      ${filter(516, topCy, alarm)}
      ${filter(248, botCy, alarm)}
      ${pre}${re}
      ${tag(162, topCy, 'exhaust', 't4_exhaust', 'T4')}
      ${tag(590, topCy, 'humidity', 'humidity', 'RH')}
      ${tag(650, topCy, 'extract', 't3_extract', 'T3')}
      ${tag(162, botCy, 'outdoor', 't8_outdoor', 'T8')}
      ${tag(640, botCy, 'supply', 't7_supply', 'T7')}
      ${valueBox(106, boxY, 112, boxH, v.t4, 't4_exhaust')}
      ${valueBox(484, boxY, 64, boxH, v.filterDays, '')}
      ${valueBox(594, boxY, 112, boxH, v.t3, 't3_extract')}
      ${valueBox(534, 174, 112, 30, v.humidity, 'humidity')}
      ${valueBox(196, 174, 72, 30, v.extractPct, '')}
      ${valueBox(106, lowY, 112, boxH, v.t8, 't8_outdoor')}
      ${valueBox(216, lowY, 64, boxH, v.filterDays, '')}
      ${valueBox(494, lowY, 72, boxH, v.supplyPct, '')}
      ${valueBox(584, lowY, 112, boxH, v.t7, 't7_supply')}
      ${endLabel(10, 140, 'start', v.exhaust1 || 'Afkast', v.exhaust2 || 'til det fri', 'exhaust')}
      ${endLabel(770, 140, 'end', v.extract1 || 'Udsugning', v.extract2 || 'fra boligen', 'extract')}
      ${endLabel(10, 240, 'start', v.outdoor1 || 'Udeluft', v.outdoor2 || 'fra det fri', 'outdoor')}
      ${endLabel(770, 240, 'end', v.supply1 || 'Indblæsning', v.supply2 || 'til boligen', 'supply')}
      ${running ? chevrons(300, 130, topCy, 'exhaust', 3) : ''}
      ${running ? chevrons(490, 660, topCy, 'extract', 3) : ''}
      ${running ? chevrons(130, 290, botCy, 'outdoor', 3) : ''}
      ${running ? chevrons(490, 660, botCy, 'supply', 3) : ''}
    </svg>`;
  }

  root.NilanDiagram = { markup };
})(typeof globalThis === 'undefined' ? window : globalThis);

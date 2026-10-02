/* Cross-flow heat exchanger for a Comfort 300 LR.

Every label and the house sit inside the viewBox so a 390px column does not
clip them. Arrows show outdoor air moving right into the home and extract
air moving left out to exhaust.
*/
(function (root) {
  function esc(value) {
    return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function pill(x, y, part, title, value) {
    return `<g data-part="${part}" transform="translate(${x} ${y})">
      <rect width="84" height="32" rx="8" fill="var(--nilan-chip,#171c24)" stroke="var(--nilan-line,#2a3342)"/>
      <text x="8" y="13" font-size="10" fill="var(--nilan-muted,#93a0b0)">${esc(title)}</text>
      <text x="8" y="26" font-size="12" font-weight="650" fill="var(--nilan-fg,#e8eef6)">${esc(value || '—')}</text>
    </g>`;
  }

  function markup(plant, values) {
    const v = values || {};
    const fitted = plant || {};
    const bypass = v.bypass === 'open' ? 'open' : v.bypass === 'closed' ? 'closed' : 'unknown';
    const filterAlarm = !!v.filterAlarm;
    const bypassStroke = bypass === 'open' ? 'var(--nilan-accent,#1f8a70)' : 'var(--nilan-muted,#93a0b0)';
    const bypassDash = bypass === 'open' ? '' : 'stroke-dasharray="4 3"';
    const bypassArrow = bypass === 'open' ? 'marker-end="url(#nilan-arrow-bypass)"' : '';
    const cold = 'var(--nilan-cold,#4aa3ff)';
    const warm = 'var(--nilan-warm,#e07a3d)';
    const supply = 'var(--nilan-supply,#3dd68c)';
    const pre = fitted.preheater
      ? `<g data-part="preheater"><rect x="46" y="100" width="22" height="18" rx="3" fill="none" stroke="${warm}"/><text x="57" y="113" text-anchor="middle" font-size="8" fill="${warm}">FV</text></g>`
      : '';
    const re = fitted.reheater && fitted.reheater !== 'none'
      ? `<g data-part="reheater"><rect x="228" y="100" width="22" height="18" rx="3" fill="none" stroke="${warm}"/><text x="239" y="113" text-anchor="middle" font-size="8" fill="${warm}">${fitted.reheater === 'water' ? 'VV' : 'EV'}</text></g>`
      : '';
    return `<svg viewBox="0 0 360 268" width="100%" data-diagram="crossflow" role="img">
      <style>text{font-family:var(--nilan-font,Roboto,ui-sans-serif,system-ui,sans-serif)}</style>
      <defs>
        <marker id="nilan-arrow-cold" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="${cold}"/></marker>
        <marker id="nilan-arrow-supply" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="${supply}"/></marker>
        <marker id="nilan-arrow-warm" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="${warm}"/></marker>
        <marker id="nilan-arrow-bypass" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="${bypassStroke}"/></marker>
      </defs>
      <path data-flow="outdoor" d="M16 116 H68" fill="none" stroke="${cold}" stroke-width="6" stroke-linecap="round" marker-end="url(#nilan-arrow-cold)"/>
      <path data-flow="outdoor" d="M96 116 H104" fill="none" stroke="${cold}" stroke-width="6" stroke-linecap="round"/>
      <path data-flow="supply" d="M136 116 H150" fill="none" stroke="${cold}" stroke-width="6" stroke-linecap="round" marker-end="url(#nilan-arrow-cold)"/>
      <path data-flow="supply" d="M214 116 H274" fill="none" stroke="${supply}" stroke-width="6" stroke-linecap="round" marker-end="url(#nilan-arrow-supply)"/>
      <path data-flow="extract" d="M286 156 H264" fill="none" stroke="${warm}" stroke-width="6" stroke-linecap="round" marker-end="url(#nilan-arrow-warm)"/>
      <path data-flow="extract" d="M232 156 H214" fill="none" stroke="${warm}" stroke-width="6" stroke-linecap="round" marker-end="url(#nilan-arrow-warm)"/>
      <path data-flow="exhaust" d="M150 156 H24" fill="none" stroke="${warm}" stroke-width="6" stroke-linecap="round" marker-end="url(#nilan-arrow-warm)"/>
      <path data-part="bypass" data-state="${bypass}" d="M128 104 C156 76, 208 76, 228 104" fill="none" stroke="${bypassStroke}" stroke-width="2.5" ${bypassDash} ${bypassArrow}/>
      <text data-label="bypass" x="180" y="70" text-anchor="middle" font-size="10" fill="${bypassStroke}">${esc(v.bypassLabel || '')}</text>
      <g data-part="filter">
        <rect x="70" y="102" width="24" height="28" rx="4" fill="var(--nilan-chip,#171c24)" stroke="${filterAlarm ? '#d64545' : 'var(--nilan-ok,#1f9d55)'}"/>
        <path d="M75 110 h14 M75 116 h14 M75 122 h14" stroke="${filterAlarm ? '#d64545' : 'var(--nilan-ok,#1f9d55)'}" stroke-width="1.3"/>
      </g>
      <g data-part="supply_fan">
        <circle cx="118" cy="116" r="14" fill="var(--nilan-chip,#171c24)" stroke="${cold}" stroke-width="2"/>
        <text x="118" y="120" text-anchor="middle" font-size="9" fill="var(--nilan-fg,#e8eef6)">${esc(v.supplyPct || '—')}</text>
      </g>
      <g data-part="extract_fan">
        <circle cx="248" cy="156" r="14" fill="var(--nilan-chip,#171c24)" stroke="${warm}" stroke-width="2"/>
        <text x="248" y="160" text-anchor="middle" font-size="9" fill="var(--nilan-fg,#e8eef6)">${esc(v.extractPct || '—')}</text>
      </g>
      <g data-part="exchanger">
        <rect x="150" y="100" width="64" height="72" rx="8" fill="color-mix(in srgb, var(--nilan-accent,#1f8a70) 16%, transparent)" stroke="var(--nilan-accent,#1f8a70)" stroke-width="2"/>
        <path d="M160 110 L204 162 M204 110 L160 162" fill="none" stroke="var(--nilan-accent,#1f8a70)" stroke-width="1.4"/>
        <text x="182" y="140" text-anchor="middle" font-size="10" fill="var(--nilan-fg,#e8eef6)">HX</text>
      </g>
      ${pre}${re}
      <g data-part="house" transform="translate(292 108)">
        <path d="M4 22 L26 4 L48 22 V46 H4 Z" fill="none" stroke="var(--nilan-muted,#93a0b0)"/>
        <text data-label="house" x="26" y="60" text-anchor="middle" font-size="10" fill="var(--nilan-muted,#93a0b0)">${esc(v.house || '')}</text>
      </g>
      ${pill(8, 28, 'outdoor', v.outdoorTitle || 'T8', v.t8)}
      ${pill(270, 28, 'supply', v.supplyTitle || 'T7', v.t7)}
      ${pill(270, 206, 'extract', v.extractTitle || 'T3', v.t3)}
      ${pill(8, 206, 'exhaust', v.exhaustTitle || 'T4', v.t4)}
    </svg>`;
  }

  root.NilanDiagram = { markup };
})(typeof globalThis === 'undefined' ? window : globalThis);

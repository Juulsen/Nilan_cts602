/* Cross-flow heat exchanger for a Comfort 300 LR. */
(function (root) {
  function esc(value) {
    return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function pill(x, y, part, title, value) {
    return `<g data-part="${part}" transform="translate(${x} ${y})">
      <rect width="86" height="34" rx="8" fill="var(--nilan-chip,#171c24)" stroke="var(--nilan-line,#2a3342)"/>
      <text x="8" y="13" font-size="10" fill="var(--nilan-muted,#93a0b0)">${esc(title)}</text>
      <text x="8" y="27" font-size="12" font-weight="650" fill="var(--nilan-fg,#e8eef6)">${esc(value || '—')}</text>
    </g>`;
  }

  function markup(plant, values) {
    const v = values || {};
    const fitted = plant || {};
    const bypass = v.bypass === 'open' ? 'open' : v.bypass === 'closed' ? 'closed' : 'unknown';
    const filterAlarm = !!v.filterAlarm;
    const bypassStroke = bypass === 'open' ? 'var(--nilan-accent,#1f8a70)' : 'var(--nilan-muted,#93a0b0)';
    const bypassDash = bypass === 'open' ? '' : 'stroke-dasharray="5 4"';
    const pre = fitted.preheater ? `<g data-part="preheater"><rect x="78" y="78" width="28" height="22" rx="4" fill="none" stroke="var(--nilan-warm,#e07a3d)"/><text x="92" y="93" text-anchor="middle" font-size="9" fill="var(--nilan-warm,#e07a3d)">FV</text></g>` : '';
    const re = fitted.reheater && fitted.reheater !== 'none' ? `<g data-part="reheater"><rect x="248" y="96" width="30" height="22" rx="4" fill="none" stroke="var(--nilan-warm,#e07a3d)"/><text x="263" y="111" text-anchor="middle" font-size="9" fill="var(--nilan-warm,#e07a3d)">${fitted.reheater === 'water' ? 'VV' : 'EV'}</text></g>` : '';
    return `<svg viewBox="0 0 360 250" width="100%" data-diagram="crossflow" role="img">
      <style>text{font-family:var(--nilan-font,Roboto,ui-sans-serif,system-ui,sans-serif)}</style>
      <path class="duct" d="M48 28 H132" fill="none" stroke="var(--nilan-cold,#4aa3ff)" stroke-width="7" stroke-linecap="round"/>
      <path d="M168 118 H214" fill="none" stroke="var(--nilan-cold,#4aa3ff)" stroke-width="7" stroke-linecap="round"/>
      <path d="M292 107 H330" fill="none" stroke="var(--nilan-supply,#3dd68c)" stroke-width="7" stroke-linecap="round"/>
      <path d="M300 196 H214" fill="none" stroke="var(--nilan-warm,#e07a3d)" stroke-width="7" stroke-linecap="round"/>
      <path d="M168 196 H48" fill="none" stroke="var(--nilan-warm,#c46a32)" stroke-width="7" stroke-linecap="round"/>
      <path data-part="bypass" data-state="${bypass}" d="M150 104 C170 48, 250 48, 292 96" fill="none" stroke="${bypassStroke}" stroke-width="3" ${bypassDash}/>
      <text x="214" y="62" text-anchor="middle" font-size="10" fill="${bypassStroke}">${esc(v.bypassLabel || '')}</text>
      <g data-part="filter">
        <rect x="132" y="14" width="28" height="28" rx="4" fill="var(--nilan-chip,#171c24)" stroke="${filterAlarm ? '#d64545' : 'var(--nilan-ok,#1f9d55)'}"/>
        <path d="M138 20 h16 M138 26 h16 M138 32 h16" stroke="${filterAlarm ? '#d64545' : 'var(--nilan-ok,#1f9d55)'}" stroke-width="1.4"/>
      </g>
      <g data-part="supply_fan">
        <circle cx="196" cy="118" r="16" fill="var(--nilan-chip,#171c24)" stroke="var(--nilan-cold,#4aa3ff)" stroke-width="2"/>
        <text x="196" y="122" text-anchor="middle" font-size="9" fill="var(--nilan-fg,#e8eef6)">${esc(v.supplyPct || '—')}</text>
      </g>
      <g data-part="extract_fan">
        <circle cx="186" cy="196" r="16" fill="var(--nilan-chip,#171c24)" stroke="var(--nilan-warm,#e07a3d)" stroke-width="2"/>
        <text x="186" y="200" text-anchor="middle" font-size="9" fill="var(--nilan-fg,#e8eef6)">${esc(v.extractPct || '—')}</text>
      </g>
      <g data-part="exchanger">
        <rect x="214" y="86" width="72" height="72" rx="8" fill="color-mix(in srgb, var(--nilan-accent,#1f8a70) 16%, transparent)" stroke="var(--nilan-accent,#1f8a70)" stroke-width="2"/>
        <path d="M222 94 L278 150 M278 94 L222 150" fill="none" stroke="var(--nilan-accent,#1f8a70)" stroke-width="1.4"/>
        <text x="250" y="126" text-anchor="middle" font-size="10" fill="var(--nilan-fg,#e8eef6)">HX</text>
      </g>
      ${pre}${re}
      <g data-part="house">
        <path d="M332 132 l16 -12 l16 12 v28 h-32 z" fill="none" stroke="var(--nilan-muted,#93a0b0)"/>
        <text x="348" y="176" text-anchor="middle" font-size="10" fill="var(--nilan-muted,#93a0b0)">${esc(v.house || '')}</text>
      </g>
      ${pill(4, 40, 'outdoor', v.outdoorTitle || 'T8', v.t8)}
      ${pill(262, 36, 'supply', v.supplyTitle || 'T7', v.t7)}
      ${pill(262, 168, 'extract', v.extractTitle || 'T3', v.t3)}
      ${pill(4, 168, 'exhaust', v.exhaustTitle || 'T4', v.t4)}
    </svg>`;
  }

  root.NilanDiagram = { markup };
})(typeof globalThis === 'undefined' ? window : globalThis);

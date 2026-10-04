// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juulsen
/* Interactive history chart. No external libraries. */
(function (root) {
  const COLORS = {
    t8_outdoor: '#4aa3ff',
    t3_extract: '#e07a3d',
    t7_supply: '#3dd68c',
    t4_exhaust: '#f5c16c',
    efficiency: '#1f8a70',
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function num(value, digits, comma) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '—';
    const text = parsed.toFixed(digits);
    return comma ? text.replace('.', ',') : text;
  }

  function legendLine(name, value, unit, comma) {
    const shown = num(value, 1, comma);
    return unit ? `${name} ${shown} ${unit}` : `${name} ${shown}`;
  }

  function color(id) {
    return COLORS[id] || '#9aa6b5';
  }

  function finitePoints(points) {
    return (points || []).filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]));
  }

  function nearest(series, ratio) {
    const stamps = (series || []).flatMap((item) => finitePoints(item.points).map((point) => point[0]));
    if (!stamps.length) return null;
    const min = Math.min(...stamps);
    const max = Math.max(...stamps);
    const clamped = Math.min(1, Math.max(0, Number(ratio) || 0));
    const target = min + (max - min) * clamped;
    const rows = (series || []).map((item) => {
      let best = null;
      for (const point of finitePoints(item.points)) {
        if (!best || Math.abs(point[0] - target) < Math.abs(best[0] - target)) best = point;
      }
      if (!best) return null;
      return { id: item.id, name: item.name, value: best[1], unit: item.unit || '', time: best[0] };
    }).filter(Boolean);
    return { time: target, rows };
  }

  function tooltipText(hit, comma) {
    if (!hit || !hit.rows || !hit.rows.length) return '';
    const when = new Date(hit.time);
    const clock = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
    return [clock, ...hit.rows.map((row) => legendLine(row.name, row.value, row.unit, comma))].join('\n');
  }

  function nice(min, max) {
    const span = Math.max(max - min, 1);
    const step = span > 20 ? 5 : span > 8 ? 2 : 1;
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    return [lo === hi ? lo - step : lo, lo === hi ? hi + step : hi, step];
  }

  function historyStamp(value) {
    if (value == null || value === '') return NaN;
    if (typeof value === 'number') return value < 1e11 ? value * 1000 : value;
    const parsed = Date.parse(String(value));
    if (Number.isFinite(parsed)) return parsed;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return NaN;
    return numeric < 1e11 ? numeric * 1000 : numeric;
  }

  function historyNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    const text = String(value ?? '').trim().toLowerCase();
    if (!text || text === 'unknown' || text === 'unavailable' || text === 'none' || text === 'null') return NaN;
    const parsed = Number(text.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function pointsFromStates(states) {
    const points = [];
    for (const row of states || []) {
      if (!row || typeof row !== 'object') continue;
      const value = historyNumber(row.s != null ? row.s : row.state);
      const stamp = row.lc != null || row.lu != null
        ? historyStamp(row.lc != null ? row.lc : row.lu)
        : historyStamp(row.last_changed || row.last_updated);
      if (Number.isFinite(stamp) && Number.isFinite(value)) points.push([stamp, value]);
    }
    return points;
  }

  function parseHistory(response) {
    const out = {};
    if (!response) return out;
    if (Array.isArray(response)) {
      for (const list of response) {
        if (!Array.isArray(list)) continue;
        const id = list.find((row) => row && row.entity_id)?.entity_id;
        if (id) out[id] = pointsFromStates(list);
      }
      return out;
    }
    if (typeof response === 'object') {
      for (const [id, list] of Object.entries(response)) {
        if (Array.isArray(list)) out[id] = pointsFromStates(list);
      }
    }
    return out;
  }

  function parseStatistics(response) {
    const out = {};
    if (!response || typeof response !== 'object' || Array.isArray(response)) return out;
    for (const [id, rows] of Object.entries(response)) {
      if (!Array.isArray(rows)) continue;
      const points = [];
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const value = historyNumber(row.mean != null ? row.mean : row.state);
        const stamp = historyStamp(row.start != null ? row.start : row.end);
        if (Number.isFinite(stamp) && Number.isFinite(value)) points.push([stamp, value]);
      }
      out[id] = points;
    }
    return out;
  }

  function history(series, opts) {
    const comma = !!opts?.comma;
    const W = 360;
    const H = 186;
    const box = { l: 36, t: 30, w: 312, h: 112 };
    const flat = (series || []).flatMap((item) => finitePoints(item.points));
    const now = Date.now();
    const minX = flat.length ? Math.min(...flat.map((point) => point[0])) : now - 86400000;
    const maxX = flat.length ? Math.max(...flat.map((point) => point[0]), minX + 3600000) : now;
    const ys = flat.map((point) => point[1]);
    const [minY, maxY, step] = nice(ys.length ? Math.min(...ys) : 0, ys.length ? Math.max(...ys) : 30);
    const sx = (x) => box.l + ((x - minX) / (maxX - minX || 1)) * box.w;
    const sy = (y) => box.t + box.h - ((y - minY) / (maxY - minY || 1)) * box.h;
    const yTicks = [];
    for (let value = minY; value <= maxY + 1e-6; value += step) yTicks.push(value);
    const xTicks = [minX, minX + (maxX - minX) / 2, maxX];
    const grid = yTicks.map((y) => `<line x1="${box.l}" x2="${box.l + box.w}" y1="${sy(y).toFixed(1)}" y2="${sy(y).toFixed(1)}" stroke="var(--nilan-line,#2a3342)"/>`).join('');
    const yLabels = yTicks.map((y) => `<text x="${box.l - 4}" y="${(sy(y) + 3).toFixed(1)}" text-anchor="end" fill="var(--nilan-muted,#93a0b0)" font-size="10">${esc(num(y, 0, comma))}</text>`).join('');
    const unit = (series || []).map((item) => item.unit).find(Boolean) || '';
    const unitLabel = unit ? `<text x="${box.l}" y="${box.t - 8}" text-anchor="start" fill="var(--nilan-muted,#93a0b0)" font-size="10">${esc(unit)}</text>` : '';
    const xLabels = xTicks.map((stamp) => {
      const when = new Date(stamp);
      const label = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
      return `<text x="${sx(stamp).toFixed(1)}" y="${box.t + box.h + 16}" text-anchor="middle" fill="var(--nilan-muted,#93a0b0)" font-size="10">${label}</text>`;
    }).join('');
    let topValue = -Infinity;
    let topPoint = null;
    let topId = '';
    const lines = (series || []).map((item) => {
      const points = finitePoints(item.points);
      const d = points.map((point, index) => `${index ? 'L' : 'M'}${sx(point[0]).toFixed(1)} ${sy(point[1]).toFixed(1)}`).join(' ');
      for (const point of points) {
        if (point[1] > topValue) {
          topValue = point[1];
          topPoint = point;
          topId = item.id;
        }
      }
      const stroke = color(item.id);
      return d ? `<path data-series="${esc(item.id)}" d="${d}" fill="none" stroke="${stroke}" stroke-width="1.8"/>` : '';
    }).join('');
    let peak = '';
    if (topPoint) {
      const item = (series || []).find((row) => row.id === topId) || {};
      const label = num(topPoint[1], 1, comma);
      const unit = item.unit ? ` ${item.unit}` : '';
      const prefix = opts?.maxLabel || 'Max';
      const caption = `${prefix} ${item.name || ''} ${label}${unit}`.replace(/\s+/g, ' ').trim();
      const x = sx(topPoint[0]);
      peak = `<circle data-series="${esc(topId)}" cx="${x.toFixed(1)}" cy="${sy(topPoint[1]).toFixed(1)}" r="3.2" fill="${color(topId)}"/><text data-top="1" x="${W / 2}" y="14" text-anchor="middle" fill="var(--nilan-fg,#e8eef6)" font-size="11">${esc(caption)}</text>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" data-chart="history" data-plot-x="${box.l}" data-plot-w="${box.w}" data-empty="${flat.length ? '0' : '1'}" role="img">
      <style>text{font-family:var(--nilan-font,Roboto,ui-sans-serif,system-ui,sans-serif)}</style>
      ${grid}${unitLabel}${yLabels}${xLabels}${lines}${peak}
      <line data-cursor="1" x1="${box.l}" x2="${box.l}" y1="${box.t}" y2="${box.t + box.h}" stroke="var(--nilan-fg,#fff)" stroke-opacity="0.35" visibility="hidden"/>
    </svg>`;
  }

  root.NilanChart = { legendLine, tooltipText, history, nearest, color, num, parseHistory, parseStatistics };
})(typeof globalThis === 'undefined' ? window : globalThis);

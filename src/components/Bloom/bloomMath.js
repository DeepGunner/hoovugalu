/* Pure helpers — bloom curve, symphony detection, SVG arc / textPath math.
   Faithfully ported from Huvugalu/huvugalu.html. */

import { YEAR_DAYS, MONTH_START, MONTH_END } from './data.js';

export const TAU = Math.PI * 2;
const r3 = (n) => n.toFixed(3);

export function smoothstep(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function inMacroFrame(day, s) {
  if (s.macroEnd <= YEAR_DAYS - 1) return (day >= s.macroStart && day <= s.macroEnd) ? day : null;
  if (day >= s.macroStart) return day;
  if (day <= s.macroEnd - YEAR_DAYS) return day + YEAR_DAYS;
  return null;
}
function inPeakFrame(day, ps, pe) {
  if (pe <= YEAR_DAYS - 1) return day >= ps && day <= pe;
  if (day >= ps) return true;
  if (day <= pe - YEAR_DAYS) return true;
  return false;
}

export function bloomOpacityAt(day, s) {
  if (s.role === 'Permanent Canopy') return 0.45;
  const f = inMacroFrame(day, s);
  if (f === null) return 0;
  for (const [ps, pe] of s.peakSegments) if (inPeakFrame(day, ps, pe)) return 1.0;
  const norm = (x) => x < s.macroStart ? x + YEAR_DAYS : x;
  const segs = s.peakSegments.map(([a, b]) => [norm(a), norm(b)]).sort((a, b) => a[0] - b[0]);
  const first = segs[0][0];
  const last = segs[segs.length - 1][1];
  if (f < first) {
    const t = (f - s.macroStart) / Math.max(1, first - s.macroStart);
    return smoothstep(t) * 0.85;
  }
  if (f > last) {
    const t = (s.macroEnd - f) / Math.max(1, s.macroEnd - last);
    return smoothstep(t) * 0.85;
  }
  return 0.55;
}

export function monthBloomIntensity(s, m) {
  let sum = 0, count = 0;
  for (let day = MONTH_START[m]; day <= MONTH_END[m]; day++) {
    sum += bloomOpacityAt(day, s);
    count++;
  }
  return sum / count;
}

export function sampleBloomArcs(s, step = 2) {
  const out = [];
  for (let day = s.macroStart; day <= s.macroEnd; day += step) {
    const dN = day % YEAR_DAYS;
    const op = bloomOpacityAt(dN, s);
    if (op > 0.01) {
      const end = Math.min(day + step, s.macroEnd);
      const endN = end % YEAR_DAYS;
      if (day <= YEAR_DAYS - 1 && end > YEAR_DAYS - 1 && endN !== 0) {
        out.push([dN, YEAR_DAYS - 1, op]);
        out.push([0, endN, op]);
      } else {
        out.push([dN, endN, op]);
      }
    }
  }
  return out;
}

function rangesOverlap(aS, aE, bS, bE) { return !(aE < bS || bE < aS); }

function coBlooming(target, other) {
  for (const [aS, aE] of target.peakSegments) {
    for (const [bS, bE] of other.peakSegments) {
      if (rangesOverlap(aS, aE, bS, bE)) return true;
      if (rangesOverlap(aS + 365, aE + 365, bS, bE)) return true;
      if (rangesOverlap(aS, aE, bS + 365, bE + 365)) return true;
    }
  }
  return false;
}

export function symphonySet(target, allSpecies) {
  if (!target) return null;
  const ids = new Set([target.id]);
  for (const s of allSpecies) {
    if (s.id === target.id || s.role === 'Permanent Canopy') continue;
    if (coBlooming(target, s)) ids.add(s.id);
  }
  return ids;
}

export function activeMonthSet(target) {
  if (!target) return null;
  const set = new Set();
  for (let m = 0; m < 12; m++) {
    if (monthBloomIntensity(target, m) > 0.25) set.add(m);
  }
  return set;
}

/* SVG helpers */

export function doyAngle(day) { return -Math.PI / 2 + (day / YEAR_DAYS) * TAU; }

export function arcPath(cx, cy, rIn, rOut, a1, a2) {
  const x1 = r3(cx + rOut * Math.cos(a1));
  const y1 = r3(cy + rOut * Math.sin(a1));
  const x2 = r3(cx + rOut * Math.cos(a2));
  const y2 = r3(cy + rOut * Math.sin(a2));
  const x3 = r3(cx + rIn * Math.cos(a2));
  const y3 = r3(cy + rIn * Math.sin(a2));
  const x4 = r3(cx + rIn * Math.cos(a1));
  const y4 = r3(cy + rIn * Math.sin(a1));
  const sweep = a2 - a1;
  const largeArc = sweep > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r3(rOut)} ${r3(rOut)} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r3(rIn)} ${r3(rIn)} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

export function splitRange(start, end) {
  const s = ((start % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS;
  const e = ((end % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS;
  if (e >= s) return [[s, e]];
  return [[s, YEAR_DAYS - 1], [0, e]];
}

export function curvedLabelPath(cx, cy, r, startA, endA) {
  const mid = (startA + endA) / 2;
  const isBottom = Math.sin(mid) > 0;
  const a1 = isBottom ? endA : startA;
  const a2 = isBottom ? startA : endA;
  const sweep = isBottom ? 0 : 1;
  const x1 = r3(cx + r * Math.cos(a1));
  const y1 = r3(cy + r * Math.sin(a1));
  const x2 = r3(cx + r * Math.cos(a2));
  const y2 = r3(cy + r * Math.sin(a2));
  return `M ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2}`;
}

export function toHex2(n) {
  return Math.round(Math.max(0, Math.min(1, n)) * 255).toString(16).padStart(2, '0').toUpperCase();
}

export function filteredSpecies(allSpecies, architect, palette, colorFamily) {
  let s = allSpecies.slice();
  if (architect === 'sackville-west' && palette !== 'all') {
    s = s.filter((x) => x.role === 'Permanent Canopy' || colorFamily[x.id] === palette);
  }
  if (architect === 'chatto') {
    s = s.filter((x) => /High|Permanent|Extreme/.test(x.durability));
  }
  if (architect === 'corner') {
    s = s.filter(
      (x) => x.role === 'Primary Anchor' || x.role === 'Layered Partner' || x.role === 'Permanent Canopy'
    );
  }
  return s;
}

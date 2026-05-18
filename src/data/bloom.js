/* Shared botanical data + helpers for all visualisations.
   Extracted verbatim from the original single-file build. */

export const M_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const M_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const M_INIT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

/* Botanically accurate flowering-tree colours */
export const SP = [
  { id: 'SLV', name: 'Silver Oak',     origin: 'Australia',       c: '#7A9E96', bloom: [65, 58, 52, 46, 38, 36, 38, 42, 42, 46, 52, 62] },
  { id: 'ERY', name: 'Erythrina',      origin: 'India',           c: '#C94028', bloom: [88, 92, 62, 22,  8,  5,  5,  5,  5,  5, 15, 48] },
  { id: 'JAC', name: 'Jacaranda',      origin: 'South America',   c: '#6B55A0', bloom: [ 8, 48, 90, 100, 52, 15, 5,  5,  5,  5,  5,  5] },
  { id: 'TAB', name: 'Tabebuia',       origin: 'Central America', c: '#C84878', bloom: [ 5, 22, 82, 100, 32,  8, 5,  5,  5,  8, 78, 32] },
  { id: 'AML', name: 'Amaltas',        origin: 'South Asia',      c: '#C89820', bloom: [ 5,  5, 12, 68, 100, 52, 18, 5,  5,  5,  5,  5] },
  { id: 'GUL', name: 'Gulmohar',       origin: 'Madagascar',      c: '#D03A18', bloom: [ 5,  5,  8, 32, 80, 100, 65, 25,  8,  5,  5,  5] },
  { id: 'POI', name: 'Pride of India', origin: 'India',           c: '#8A4898', bloom: [ 5,  5,  5,  5,  8, 38, 80, 100, 78, 45, 15, 5] },
  { id: 'COL', name: 'Colvillea',      origin: 'East Africa',     c: '#C85020', bloom: [ 5,  5,  5,  5,  5,  8, 18, 58, 100, 88, 35, 8] },
  { id: 'BAU', name: 'Bauhinia',       origin: 'East Asia',       c: '#A86885', bloom: [32, 15,  5,  5,  5,  5,  5,  5,  8, 18, 42, 82] },
];

export function hexRgb(h) {
  h = h.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgba(hex, a) {
  const { r, g, b } = hexRgb(hex);
  return `rgba(${r},${g},${b},${+a.toFixed(3)})`;
}

/* Catmull-Rom-ish smooth path through points */
export function crPath(pts) {
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < pts.length - 2 ? pts[i + 2] : pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)},${c2x.toFixed(1)} ${c2y.toFixed(1)},${p2.x} ${p2.y}`;
  }
  return d;
}

/* Deterministic shuffle (LCG seeded) — keeps frame-to-frame stability */
export function dShuffle(arr, seed) {
  const a = [...arr];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

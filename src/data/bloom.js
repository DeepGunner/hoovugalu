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

/* Issar-verified palette — aligned with the Bloom Calendar species so each
   month's dominant colour matches the city's actual succession. Bloom
   intensities are tightened to each species' real peak window so no single
   hue (e.g. pink) dominates months it shouldn't. */
export const SP = [
  { id: 'SLV', name: 'Silver Oak',     origin: 'Australia',       c: '#7A9E96', bloom: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50] },
  { id: 'ERY', name: 'Coral Tree',     origin: 'Indo-Pacific',    c: '#C94028', bloom: [95, 30,  5,  5,  5,  5,  5,  5,  5,  5,  8, 70] },
  { id: 'JAC', name: 'Jacaranda',      origin: 'South America',   c: '#6B55A0', bloom: [ 5, 40, 100, 60,  8,  5,  5,  5,  5,  5,  5,  5] },
  { id: 'TAB', name: 'Pink Trumpet',   origin: 'Central America', c: '#C84878', bloom: [ 5, 90, 25,  5,  5,  5,  5,  5,  5, 55, 95, 30] },
  { id: 'TYE', name: 'Tree of Gold',   origin: 'South America',   c: '#E6B800', bloom: [ 5, 95, 20,  5,  5,  5,  5,  5,  5,  5,  5,  5] },
  { id: 'AML', name: 'Amaltas',        origin: 'South Asia',      c: '#C89820', bloom: [ 5,  5,  8, 95, 80, 12,  5,  5,  5,  5,  5,  5] },
  { id: 'GUL', name: 'Gulmohur',       origin: 'Madagascar',      c: '#D03A18', bloom: [ 5,  5,  5, 30, 100, 80, 25,  5,  5,  5,  5,  5] },
  { id: 'POI', name: 'Pride of India', origin: 'South Asia',      c: '#8A4898', bloom: [ 5,  5,  5,  5,  8, 55, 100, 90, 60, 12,  5,  5] },
  { id: 'SPA', name: 'Scarlet Bell',   origin: 'Uganda',          c: '#C03818', bloom: [ 5,  5,  5,  5,  5,  5, 15, 75, 100, 85, 25,  5] },
  { id: 'PEL', name: 'Copper Pod',     origin: 'South Asia',      c: '#C87820', bloom: [ 5,  5,  5,  5,  5,  5,  5,  5, 30, 95, 85, 10] },
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

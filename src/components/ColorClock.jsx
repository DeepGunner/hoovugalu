import React, { useEffect, useRef } from 'react';

/* ─── viz 8 colour clock ported into React ───
   16:9 canvas. Hands radiate from centre. The background floods with the
   current season's palette, blended via a slow per-season pulse. A swept
   wedge from 12-o'clock to the hand layers the season colours on top.
   Used as the landing-page backdrop.

   Species + helpers copied from bangalore-bloom_v8fix-19.html. */

const SP = [
  { id: 'SLV', c: '#7A9E96' },
  { id: 'ERY', c: '#C94028' },
  { id: 'JAC', c: '#6B55A0' },
  { id: 'TAB', c: '#C84878' },
  { id: 'TYE', c: '#E6B800' },
  { id: 'AML', c: '#C89820' },
  { id: 'GUL', c: '#D03A18' },
  { id: 'POI', c: '#8A4898' },
  { id: 'SPA', c: '#C03818' },
  { id: 'PEL', c: '#C87820' },
];

const SP_MAP = SP.reduce((m, s) => ((m[s.id] = s.c), m), {});

const CLOCK_SEASONS = [
  { label: 'Winter Arrival', start: 11, end: 1, wrap: true,  ids: ['ERY', 'TAB', 'TYE', 'SLV'] },
  { label: 'Spring Chord',   start: 1,  end: 3, wrap: false, ids: ['ERY', 'JAC', 'TAB', 'TYE', 'SLV'] },
  { label: 'Summer Handoff', start: 3,  end: 5, wrap: false, ids: ['JAC', 'AML', 'GUL', 'SLV'] },
  { label: 'Monsoon Hold',   start: 5,  end: 9, wrap: false, ids: ['GUL', 'POI', 'SPA', 'SLV'] },
  { label: "Year's End",     start: 9,  end: 11, wrap: false, ids: ['SPA', 'PEL', 'TAB', 'SLV'] },
];

function hexRgb(h) {
  const x = h.replace('#', '');
  return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
}
function rgba(hex, a) { const { r, g, b } = hexRgb(hex); return `rgba(${r},${g},${b},${+a.toFixed(3)})`; }
function lerpHex(h1, h2, t) {
  const a = hexRgb(h1), b = hexRgb(h2);
  return '#' + [
    Math.round(a.r + (b.r - a.r) * t),
    Math.round(a.g + (b.g - a.g) * t),
    Math.round(a.b + (b.b - a.b) * t),
  ].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
function eio(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function mAngle(m) { return (m / 12) * Math.PI * 2 - Math.PI / 2; }
function seasonIdx(p) {
  const m = p * 12;
  for (let i = 0; i < CLOCK_SEASONS.length; i++) {
    const s = CLOCK_SEASONS[i];
    if (s.wrap) { if (m >= s.start || m < s.end + 1) return i; }
    else        { if (m >= s.start && m < s.end + 1) return i; }
  }
  return 0;
}

export default function ColorClock({ className, style }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 1600, H = 900;

    // Per-season pulse state for colour wandering
    const pulse = CLOCK_SEASONS.map(() => ({
      from: Math.random(), to: Math.random(),
      dur: 1400 + Math.random() * 1800, el: 0,
    }));

    function seasonBlend(si, colors, dt) {
      const ps = pulse[si];
      ps.el += dt;
      if (ps.el >= ps.dur) { ps.el = 0; ps.from = ps.to; ps.to = Math.random(); ps.dur = 1200 + Math.random() * 2000; }
      const v = eio(Math.min(ps.el / ps.dur, 1));
      const t = ps.from + (ps.to - ps.from) * v;
      const idx = t * (colors.length - 1);
      const i0 = Math.floor(idx), i1 = Math.min(i0 + 1, colors.length - 1);
      return lerpHex(colors[i0], colors[i1], idx - i0);
    }

    function angleToEdge(a) {
      const ux = Math.cos(a), uy = Math.sin(a);
      const cx = W / 2, cy = H / 2;
      const tx = ux === 0 ? Infinity : (ux > 0 ? cx : -cx) / Math.abs(ux);
      const ty = uy === 0 ? Infinity : (uy > 0 ? cy : -cy) / Math.abs(uy);
      const t = Math.min(tx, ty);
      return { x: cx + t * ux, y: cy + t * uy };
    }

    // Faster rotation so the viewer sees every season (and every species
    // colour family) within a few seconds, instead of dwelling in one tint.
    const PERIOD = 18000;
    let startTs = null, lastTs = null;
    let alive = true;

    function draw(ts) {
      if (!alive) return;
      if (!startTs) startTs = ts;
      const dt = lastTs ? ts - lastTs : 16;
      lastTs = ts;

      const prog = ((ts - startTs) % PERIOD) / PERIOD;
      const si = seasonIdx(prog);
      const cs = CLOCK_SEASONS[si];
      const cx = W / 2, cy = H / 2;
      const handAngle = mAngle(prog * 12);

      const colors = cs.ids.map((id) => SP_MAP[id]).filter((c) => typeof c === 'string' && c.startsWith('#'));
      if (!colors.length) { rafRef.current = requestAnimationFrame(draw); return; }
      const blendC = seasonBlend(si, colors, dt);

      // 1. Original warm radial wash — first species at the centre, the
      // wandering blend in the middle, last species at the edges. The look
      // the user loved.
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.72);
      bg.addColorStop(0,   rgba(colors[0], 0.28));
      bg.addColorStop(0.5, rgba(blendC,     0.55));
      bg.addColorStop(1,   rgba(colors[colors.length - 1], 0.80));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 2. Swept wedge from 12-o'clock to hand. Alpha fades up from the
      // start edge and fades down toward the leading edge — no hard seam at
      // either boundary. Overall alpha lowered (0.18 → 0.10) so the wedge
      // reads as a colour trail rather than a sliced half.
      const STEPS = 80;
      const startA = -Math.PI / 2;
      const endA = handAngle;
      const fullA = endA < startA ? endA + Math.PI * 2 : endA;
      const span = fullA - startA;
      const FEATHER = 0.08; // fade fraction at each edge
      for (let i = 0; i < STEPS; i++) {
        const t0 = i / STEPS, t1 = (i + 1) / STEPS;
        // Smooth feather: ramp up over first FEATHER, hold, ramp down over last FEATHER
        let feather = 1;
        if (t0 < FEATHER) feather = t0 / FEATHER;
        else if (t0 > 1 - FEATHER) feather = (1 - t0) / FEATHER;
        const a0 = startA + t0 * span;
        const a1 = startA + t1 * span;
        const ci = t0 * (colors.length - 1);
        const ci0 = Math.floor(ci), ci1 = Math.min(ci0 + 1, colors.length - 1);
        const sc = lerpHex(colors[ci0], colors[ci1], ci - ci0);
        const R = Math.sqrt(W * W + H * H);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1);
        ctx.closePath();
        ctx.fillStyle = rgba(sc, 0.10 * feather);
        ctx.fill();
      }

      // 3. Tick marks on all four edges
      ctx.strokeStyle = 'rgba(40,28,14,0.32)';
      const MN = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      for (let m = 0; m < 12; m++) {
        const a = mAngle(m);
        const ep = angleToEdge(a);
        const isQ = m % 3 === 0;
        const TICK = isQ ? 28 : 16;
        const ux2 = -(ep.x - cx), uy2 = -(ep.y - cy);
        const len2 = Math.sqrt(ux2 * ux2 + uy2 * uy2) || 1;
        const inx = ep.x + ux2 / len2 * TICK, iny = ep.y + uy2 / len2 * TICK;
        ctx.lineWidth = isQ ? 1.6 : 0.8;
        ctx.beginPath(); ctx.moveTo(ep.x, ep.y); ctx.lineTo(inx, iny); ctx.stroke();
        ctx.font = `bold ${isQ ? 18 : 13}px 'Space Mono',monospace`;
        ctx.fillStyle = `rgba(40,28,14,${isQ ? 0.55 : 0.35})`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const LR = TICK + 18;
        const lx = ep.x + ux2 / len2 * LR, ly = ep.y + uy2 / len2 * LR;
        ctx.fillText(MN[m], lx, ly);
      }

      // 4. Clock hands
      const sStart = cs.wrap ? 11 : cs.start;
      const sLen = cs.wrap ? 3 : cs.end - cs.start + 1;
      const mFrac = ((prog * 12 - sStart) + 12) % 12;
      const inS = Math.max(0, Math.min(1, mFrac / sLen));
      const ci2 = inS * (colors.length - 1);
      const lc = lerpHex(colors[Math.floor(ci2)], colors[Math.min(Math.floor(ci2) + 1, colors.length - 1)], ci2 - Math.floor(ci2));

      // Hour (month) hand — drawn as DARK INK with a colored glow halo so
      // it stays legible regardless of which season palette is behind it.
      // The colored season tint reads as a tip flare, and the dark core
       // never camouflages into the matching background colour.
      // Hand length adapts to the visible portion of the canvas after
      // object-fit:cover crops it. The 16:9 canvas sits inside the
      // viewport; we measure the visible-half horizontally and vertically
      // in CANVAS pixels and cap the hand to whichever is smaller. That
      // way on a wide desktop the hand can stretch to 66% of min(W,H)
      // (clearing the aura), while on a narrow portrait phone the hand
      // shrinks so the tip never gets cropped at the side of the screen.
      const cw = canvas.clientWidth || W;
      const ch = canvas.clientHeight || H;
      const cover = Math.max(cw / W, ch / H);
      // visHalfW / visHalfH express the visible half-extents in CANVAS px
      // (after object-fit:cover crops). On portrait phones visHalfW is
      // small so the hand auto-shrinks to stay inside the screen.
      const visHalfW = cover > 0 ? (cw / cover) / 2 : Math.min(W, H) * 0.5;
      const visHalfH = cover > 0 ? (ch / cover) / 2 : Math.min(W, H) * 0.5;
      // Floor at 0.42 × min(W,H) so we never produce a dot — even when the
      // visible width is very narrow, the hand still reaches a sensible
      // length toward the tip glow.
      // On landscape/desktop the visible-half clamps were keeping the hand
      // short because the 16:9 canvas matches the viewport on landscape —
      // so visHalfH ≈ H/2 = 450 was the binding limit no matter what the
      // 0.66/0.80/0.88 cap said. Drop those clamps on landscape so the
      // cap actually controls hand length; keep them on portrait to make
      // sure the tip never gets cropped off the sides of a phone.
      const isLandscape = cw > 0 && cw >= ch;
      const handMax = Math.max(
        Math.min(W, H) * 0.42,
        isLandscape
          ? Math.min(W, H) * 0.58
          : Math.min(
              Math.min(W, H) * 0.58,
              visHalfW * 0.94,
              visHalfH * 0.94
            )
      );
      const hx = cx + Math.cos(handAngle) * handMax;
      const hy = cy + Math.sin(handAngle) * handMax;
      // Colored halo (under-stroke) — broad, soft glow
      const halo = ctx.createLinearGradient(cx, cy, hx, hy);
      halo.addColorStop(0,    rgba(lc, 0.20));
      halo.addColorStop(0.55, rgba(lc, 0.55));
      halo.addColorStop(1,    rgba(lc, 0.95));
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy);
      ctx.strokeStyle = halo; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
      // Dark ink core (over-stroke) — guarantees contrast at every angle
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy);
      ctx.strokeStyle = 'rgba(20, 15, 10, 0.88)';
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.stroke();

      // Minute hand — thinner, but same dual treatment (dark core + faint halo)
      const minAngle = mAngle(prog * 12 * 12);
      // Mobile portrait gets a slightly longer minute-hand tail
      const minMul = isLandscape ? 0.78 : 0.82;
      const mx2 = cx + Math.cos(minAngle) * (handMax * minMul);
      const my2 = cy + Math.sin(minAngle) * (handMax * minMul);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx2, my2);
      ctx.strokeStyle = rgba(lc, 0.50); ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx2, my2);
      ctx.strokeStyle = 'rgba(20, 15, 10, 0.70)';
      ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.stroke();

      // Hour-hand tip cap — coloured fill with a thin dark ring for definition
      ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fillStyle = lc; ctx.fill();
      ctx.strokeStyle = 'rgba(20, 15, 10, 0.85)'; ctx.lineWidth = 1.2; ctx.stroke();

      // Publish the current leading season colour as a CSS variable so the
      // landing narrative's gateway hovers can flash to it.
      document.documentElement.style.setProperty('--clock-accent', lc);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={1600}
      height={900}
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}

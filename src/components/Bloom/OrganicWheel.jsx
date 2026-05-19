import React, { useEffect, useRef } from 'react';
import { MONTHS } from './data.js';

/* Concentric-rings cyclograph.
   Each species = one ring at a fixed radius. Within the ring, sectors are
   coloured only where the species blooms (intensity modulates alpha). Other
   sectors are a faint neutral so the ring's geometry stays legible. A fine
   radial subdivision texture (one tick per ~1.5°) gives the rings a "data
   mosaic" feel. The whole stack gently breathes via a tiny radius wobble. */
export default function OrganicWheel({
  species,
  selectedMonth,
  onPickMonth,
  hoveredMonth,
  onHoverMonth,
}) {
  const canvasRef = useRef(null);
  const speciesRef = useRef(species);
  const selectedRef = useRef(selectedMonth);
  const hoveredRef = useRef(hoveredMonth);
  const rafRef = useRef(0);

  useEffect(() => { speciesRef.current = species; }, [species]);
  useEffect(() => { selectedRef.current = selectedMonth; }, [selectedMonth]);
  useEffect(() => { hoveredRef.current = hoveredMonth; }, [hoveredMonth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, dpr = 1;
    function resize() {
      const par = canvas.parentElement;
      W = par.clientWidth || 600;
      H = par.clientHeight || 600;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function intensityForDay(win, day) {
      if (day < win.start || day > win.end) return 0;
      const inPeak = day >= win.peakStart && day <= win.peakEnd;
      const dur = Math.max(1, win.end - win.start);
      const mid = (win.start + win.end) / 2;
      const distNorm = Math.min(1, Math.abs(day - mid) / (dur / 2));
      const falloff = 1 - distNorm * distNorm;
      return Math.max(0.4, falloff * (inPeak ? 1 : 0.7));
    }
    function bloomsInMonth(sp, m) {
      const startD = m * 30.4167;
      const endD = (m + 1) * 30.4167 - 1;
      if (!sp.windows) return false;
      return sp.windows.some((w) => endD >= w.start && startD <= w.end);
    }
    function hexA(hex, a) {
      const aa = Math.floor(Math.max(0, Math.min(1, a)) * 255)
        .toString(16).padStart(2, '0');
      return hex + aa;
    }

    // Hand-drawn radius wobble at a given angle for a given ring. Combines
    // several low-frequency sines so the ring boundary looks sketched but
    // smooth — no jagged or rapidly-moving edges. The function is angle-only
    // (with a slow time component) so the ring doesn't twitch.
    function handDrawn(theta, idx, t, amp) {
      const s = idx * 7.3;
      return (
        Math.sin(theta * 2 + s) * amp * 0.55 +
        Math.sin(theta * 3 + s * 1.7) * amp * 0.38 +
        Math.sin(theta * 4 + s * 0.6 + t * 0.0002) * amp * 0.28 +
        Math.sin(theta * 6 + s * 2.1) * amp * 0.15
      );
    }
    function arcPath(cx, cy, baseR, idx, t, amp, segs, clockwise = true) {
      ctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const theta = (clockwise ? u : 1 - u) * Math.PI * 2 - Math.PI / 2;
        const r = baseR + handDrawn(theta, idx, t, amp);
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    // Draw one species ring. Sectors within bloom windows get coloured;
    // everything else stays a faint neutral so the ring is still visible.
    function drawRing(cx, cy, rMid, thickness, ringSpace, sp, t, idx, focus) {
      const SEGS = 144;
      const isFocused = focus != null;
      const baseTickAlpha = isFocused ? 0.12 : 0.18;
      const baseFill = '#F8F5EE';

      // Subtle breathing wobble — same for whole ring so it stays circular
      const wobble =
        Math.sin(t * 0.0004 + idx * 0.7) * (thickness * 0.10) +
        Math.sin(t * 0.00027 + idx * 1.4) * (thickness * 0.06);
      const rOuter = rMid + thickness / 2 + wobble * 0.5;
      const rInner = rMid - thickness / 2 + wobble * 0.5;
      // Hand-drawn jitter — capped so the wobble stays within the ring's
      // slot. Max swing per edge ~16% of ringSpace; combined ~32% leaves
      // a comfortable gap to the next ring.
      const jitterOuter = ringSpace * 0.16;
      const jitterInner = ringSpace * 0.12;

      // Faint neutral ring base (everywhere) so the ring path stays visible
      // — outer warped loop CW, inner warped loop CCW, even-odd fill carves
      // the annulus with hand-drawn edges.
      ctx.beginPath();
      for (let i = 0; i <= SEGS; i++) {
        const u = i / SEGS;
        const theta = u * Math.PI * 2 - Math.PI / 2;
        const r = rOuter + handDrawn(theta, idx, t, jitterOuter);
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = SEGS; i >= 0; i--) {
        const u = i / SEGS;
        const theta = u * Math.PI * 2 - Math.PI / 2;
        const r = rInner + handDrawn(theta, idx + 0.5, t, jitterInner);
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = hexA(baseFill, isFocused ? 0.52 : 0.68);
      ctx.fill('evenodd');

      // Coloured bloom-window sectors. Only windows that contain the focused
      // month get full opacity; everything else is muted ~30%.
      if (sp.windows) {
        sp.windows.forEach((win) => {
          const winActive = isFocused && (() => {
            const startD = focus * 30.4167;
            const endD = (focus + 1) * 30.4167 - 1;
            return endD >= win.start && startD <= win.end;
          })();
          const a0 = (win.start / 365) * Math.PI * 2 - Math.PI / 2;
          let a1 = (win.end / 365) * Math.PI * 2 - Math.PI / 2;
          if (a1 < a0) a1 += Math.PI * 2;

          // Build the sector wedge as a hand-drawn annulus segment
          const segs = Math.max(28, Math.round((a1 - a0) * 72));
          ctx.beginPath();
          for (let i = 0; i <= segs; i++) {
            const u = i / segs;
            const theta = a0 + (a1 - a0) * u;
            const r = rOuter + handDrawn(theta, idx, t, jitterOuter);
            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          for (let i = segs; i >= 0; i--) {
            const u = i / segs;
            const theta = a0 + (a1 - a0) * u;
            const r = rInner + handDrawn(theta, idx + 0.5, t, jitterInner);
            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * r;
            ctx.lineTo(x, y);
          }
          ctx.closePath();

          // Gradient along the wedge fades by intensity from low to peak
          const gradAlpha = isFocused ? (winActive ? 1 : 0.22) : 0.88;
          // Use angle-aware fill via per-tick intensity (drawn as small wedges)
          // For simplicity here we do a flat colour at the window-average
          // intensity then layer brighter on the peak portion.
          ctx.fillStyle = hexA(sp.color, gradAlpha * 0.75);
          ctx.fill();

          // Brighter overlay at peak portion
          const ap0 = (win.peakStart / 365) * Math.PI * 2 - Math.PI / 2;
          let ap1 = (win.peakEnd / 365) * Math.PI * 2 - Math.PI / 2;
          if (ap1 < ap0) ap1 += Math.PI * 2;
          ctx.beginPath();
          const pSegs = Math.max(20, Math.round((ap1 - ap0) * 72));
          for (let i = 0; i <= pSegs; i++) {
            const u = i / pSegs;
            const theta = ap0 + (ap1 - ap0) * u;
            const r = rOuter + handDrawn(theta, idx, t, jitterOuter);
            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          for (let i = pSegs; i >= 0; i--) {
            const u = i / pSegs;
            const theta = ap0 + (ap1 - ap0) * u;
            const r = rInner + handDrawn(theta, idx + 0.5, t, jitterInner);
            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * r;
            ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = hexA(sp.color, gradAlpha);
          ctx.fill();
        });
      }

      // Subdivision tick texture — short radial lines across the ring at
      // regular angular intervals, following the hand-drawn boundary.
      const TICK_COUNT = 240;
      ctx.strokeStyle = hexA('#100F0C', baseTickAlpha);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i < TICK_COUNT; i++) {
        const theta = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
        const ri = rInner + handDrawn(theta, idx + 0.5, t, jitterInner);
        const ro = rOuter + handDrawn(theta, idx, t, jitterOuter);
        ctx.moveTo(cx + Math.cos(theta) * ri, cy + Math.sin(theta) * ri);
        ctx.lineTo(cx + Math.cos(theta) * ro, cy + Math.sin(theta) * ro);
      }
      ctx.stroke();

      // Outer hand-drawn contour
      ctx.strokeStyle = hexA('#100F0C', isFocused ? 0.16 : 0.22);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i <= SEGS; i++) {
        const u = i / SEGS;
        const theta = u * Math.PI * 2 - Math.PI / 2;
        const r = rOuter + handDrawn(theta, idx, t, jitterOuter);
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      // Inner hand-drawn contour
      ctx.beginPath();
      for (let i = 0; i <= SEGS; i++) {
        const u = i / SEGS;
        const theta = u * Math.PI * 2 - Math.PI / 2;
        const r = rInner + handDrawn(theta, idx + 0.5, t, jitterInner);
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    function draw(t) {
      const sp = speciesRef.current;
      const sel = selectedRef.current;
      const hov = hoveredRef.current;
      const focus = hov != null ? hov : sel;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const minDim = Math.min(W, H);
      const evergreen = sp.find((s) => s.role === 'Permanent Canopy');
      const flowering = sp.filter((s) => s.role !== 'Permanent Canopy');

      const outerCap = minDim * 0.44;
      const innerCore = minDim * 0.10;
      const ringCount = flowering.length + (evergreen ? 1 : 0);
      const ringSpace = (outerCap - innerCore) / Math.max(ringCount + 0.5, 1);
      // Slim each ring so the wobble has room to swing without colliding
      // into the neighbouring ring's slot.
      const thickness = ringSpace * 0.55;

      // Innermost core (calm)
      ctx.fillStyle = '#F8F5EE';
      ctx.beginPath();
      ctx.arc(cx, cy, innerCore * 0.86, 0, Math.PI * 2);
      ctx.fill();
      // Tiny center dot
      ctx.fillStyle = 'rgba(40,30,20,0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      // Silver Oak — innermost continuous ring (always coloured)
      if (evergreen) {
        const rMid = innerCore + ringSpace * 0.5;
        drawRing(cx, cy, rMid, thickness, ringSpace, evergreen, t, -1, focus);
      }

      // Flowering species rings outward
      const offset = evergreen ? 1 : 0;
      flowering.forEach((s, fi) => {
        const idx = fi + offset;
        const rMid = innerCore + ringSpace * (idx + 0.5);
        drawRing(cx, cy, rMid, thickness, ringSpace, s, t, idx, focus);
      });

      // Selected month wedge highlight (subtle radial wash)
      if (focus != null) {
        const a0 = (focus / 12) * Math.PI * 2 - Math.PI / 2;
        const a1 = ((focus + 1) / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.fillStyle = 'rgba(40,30,20,0.06)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerCap + ringSpace * 0.4, a0, a1);
        ctx.closePath();
        ctx.fill();
      }

      // Month labels around the perimeter
      const labelR = outerCap + ringSpace * 0.95;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      MONTHS.forEach((mo, i) => {
        const theta = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(theta) * labelR;
        const y = cy + Math.sin(theta) * labelR;
        const isFocus = focus === i;
        ctx.fillStyle = isFocus ? '#100F0C' : 'rgba(40,30,20,0.55)';
        ctx.font = `${isFocus ? '700 ' : ''}11px "Space Mono", monospace`;
        ctx.fillText(mo.toUpperCase(), x, y);
      });
    }

    function loop(now) {
      draw(now);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    function pointToMonth(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      const r = Math.sqrt(x * x + y * y);
      const minDimNow = Math.min(rect.width, rect.height);
      if (r < minDimNow * 0.08) return null;
      const theta = Math.atan2(y, x);
      const norm = (theta + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
      return Math.floor((norm / (Math.PI * 2)) * 12);
    }
    function onClick(e) {
      const m = pointToMonth(e.clientX, e.clientY);
      if (m != null) onPickMonth(m);
    }
    function onMove(e) {
      if (!onHoverMonth) return;
      const m = pointToMonth(e.clientX, e.clientY);
      onHoverMonth(m);
    }
    function onLeave() {
      if (onHoverMonth) onHoverMonth(null);
    }
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block', cursor: 'pointer', width: '100%', height: '100%', position: 'relative', zIndex: 2 }} />;
}

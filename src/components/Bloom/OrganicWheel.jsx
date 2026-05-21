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
  // Pointer animated angle (radians) — separate from focus, allows magnetic-snap
  const pointerAngleRef = useRef(-Math.PI / 2);
  const pointerTargetRef = useRef(-Math.PI / 2);
  const pointerVelocityRef = useRef(0);

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
    function drawRing(cx, cy, rMid, thickness, ringSpace, sp, t, idx, mode) {
      const SEGS = 144;
      // 'idle' = no focus, balanced; 'muted' = baseline 30-40% behind the
      // spotlight; 'full' = vivid 100% inside the conical lens.
      const ALPHAS = {
        idle:  { fill: 0.68, color: 0.88, tick: 0.18, contour: 0.22 },
        // Inactive (outside wedge): faint cream base so ring paths read,
        // bloom arcs survive at ~55% so the calendar map is legible.
        muted: { fill: 0.12, color: 0.65, tick: 0.04, contour: 0.12 },
        // Inside the wedge: rings WITHOUT a bloom arc for this month fade
        // almost to nothing (fill 0.0, contour 0.05); coloured arcs that
        // ARE active jump to full saturation and own the visual field.
        full:  { fill: 0.00, color: 1.00, tick: 0.10, contour: 0.05 },
      };
      const a = ALPHAS[mode] || ALPHAS.idle;
      const baseFill = '#F8F5EE';

      // Subtle breathing wobble — same for whole ring so it stays circular
      const wobble =
        Math.sin(t * 0.0004 + idx * 0.7) * (thickness * 0.10) +
        Math.sin(t * 0.00027 + idx * 1.4) * (thickness * 0.06);
      // Rings stay at the SAME rMid in every mode — only halfT changes.
      // Outside the wedge: halfT = 28% of slot (56% fill → slim track look).
      // Inside the wedge:  halfT = 44% of slot (88% fill → fat band) leaving
      // 12% slot whitespace = 6% per edge clear of the neighbour ring.
      // Inside-vs-outside thickness ratio = 0.44 / 0.28 ≈ 1.57× (~57% bigger).
      const halfT = mode === 'full' ? ringSpace * 0.44 : ringSpace * 0.28;
      const rOuter = rMid + halfT + wobble * 0.5;
      const rInner = rMid - halfT + wobble * 0.5;
      // Hand-drawn jitter — capped so the wobble stays within the ring's
      // slot. Max swing per edge ~16% of ringSpace; combined ~32% leaves
      // a comfortable gap to the next ring.
      // Tighter jitter now that each ring is 78% of its slot — keeps the
      // hand-drawn wobble visible without bleeding into adjacent rings.
      const jitterOuter = ringSpace * 0.08;
      const jitterInner = ringSpace * 0.06;

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
      ctx.fillStyle = hexA(baseFill, a.fill);
      ctx.fill('evenodd');

      // Coloured bloom-window sectors. Alpha comes from the global mode;
      // the spotlight effect is achieved by clipping the FULL pass to the
      // wedge sector, not by per-window logic.
      if (sp.windows) {
        sp.windows.forEach((win) => {
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

          ctx.fillStyle = hexA(sp.color, a.color * 0.75);
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
          ctx.fillStyle = hexA(sp.color, a.color);
          ctx.fill();
        });
      }

      // Subdivision tick texture — short radial lines across the ring at
      // regular angular intervals, following the hand-drawn boundary.
      const TICK_COUNT = 240;
      ctx.strokeStyle = hexA('#100F0C', a.tick);
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
      ctx.strokeStyle = hexA('#100F0C', a.contour);
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

      // Rings fit inside the aura disc (aura radius ≈ 42% of canvas):
      // outerCap = 36% pulls the outermost ring well inside the aura.
      const outerCap = minDim * 0.36;
      // Smaller core reclaims whitespace from the centre for ring real estate
      const innerCore = minDim * 0.075;
      const ringCount = flowering.length + (evergreen ? 1 : 0);
      const ringSpace = (outerCap - innerCore) / Math.max(ringCount + 0.5, 1);
      // Each ring now fills 78% of its slot (was 55%) — wider colour bands
      // while still leaving a 22% gap so the hand-drawn wobble can swing
      // without bleeding into the neighbouring ring.
      const thickness = ringSpace * 0.78;

      // Calm inner core background
      ctx.fillStyle = '#F8F5EE';
      ctx.beginPath();
      ctx.arc(cx, cy, innerCore * 0.86, 0, Math.PI * 2);
      ctx.fill();


      // Draw all rings — when focused, use the "darkroom lens" technique:
      // first pass paints everything muted, then we clip to the conical
      // wedge and re-paint at full saturation underneath.
      const baseMode = focus != null ? 'muted' : 'idle';
      // Rings sit at the same rMid in every mode — only their thickness
      // changes inside the wedge (handled inside drawRing via halfT).
      const drawAllRings = (mode) => {
        if (evergreen) {
          const rMid = innerCore + ringSpace * 0.5;
          drawRing(cx, cy, rMid, thickness, ringSpace, evergreen, t, -1, mode);
        }
        const offset = evergreen ? 1 : 0;
        flowering.forEach((s, fi) => {
          const idx = fi + offset;
          const rMid = innerCore + ringSpace * (idx + 0.5);
          drawRing(cx, cy, rMid, thickness, ringSpace, s, t, idx, mode);
        });
      };
      drawAllRings(baseMode);

      // ── Conical focus lens with magnetic-snap animation ──
      // The wedge spans exactly one month (30°) and reveals the rings under
      // it at full saturation. Animate the centre angle toward the target
      // with a spring step for the elastic-snap feel.
      const targetAngle = focus != null
        ? ((focus + 0.5) / 12) * Math.PI * 2 - Math.PI / 2
        : pointerTargetRef.current;
      pointerTargetRef.current = targetAngle;
      let diff = targetAngle - pointerAngleRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      pointerVelocityRef.current += diff * 0.16; // stiffness
      pointerVelocityRef.current *= 0.72;        // damping for slight overshoot
      pointerAngleRef.current += pointerVelocityRef.current;
      const pAng = pointerAngleRef.current;
      // Slightly wider wedge (was 30°) — a touch more breathing room around
      // the active month so the elevated lens reads as a deliberate magnifier.
      const halfWedge = (Math.PI * 2) / 22;
      // Wedge extends past labelR and is given a small 'lift' factor so the
      // slice appears zoomed/elevated above the disc.
      const wedgeLift = 1.06;
      // Clamp so the wedge tip + its drop shadow stay inside the canvas
      // (canvas half = 0.5*minDim, leave ~3% margin for the shadow blur).
      // Bump clamp up to 0.495 so wedgeR comfortably exceeds labelR (0.46)
      // PLUS the curved text's character height — active month sits fully
      // inside the slice instead of poking out the top.
      const wedgeR = Math.min(
        Math.max(outerCap + ringSpace * 2.6, minDim * 0.495) * wedgeLift,
        minDim * 0.495
      );
      const wedgeStart = pAng - halfWedge;
      const wedgeEnd = pAng + halfWedge;

      if (focus != null) {
        // Elevation shadow — drawn as a filled wedge shape WITHOUT clipping
        // first, so the soft drop-shadow projects outside the slice and
        // visually lifts it forward off the disc.
        ctx.save();
        ctx.shadowColor = 'rgba(20,15,10,0.28)';
        ctx.shadowBlur = 22;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = 'rgba(252,248,240,0.38)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, wedgeR, wedgeStart, wedgeEnd);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Illuminated frosted slice — light white frosted glass overlay.
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, wedgeR, wedgeStart, wedgeEnd);
        ctx.closePath();
        ctx.clip();
        // Thick frosted backdrop INSIDE the wedge — a near-opaque milky
        // surface so the coloured arcs that follow render on a bright stage
        // and visibly pop against both the muted rings outside the wedge
        // AND the gradient background. Stronger near the rim where the eye
        // lands; slightly softer near the centre for refractive depth.
        // Reduced ~30% from prior 0.55 → 0.39 so the elevation shadow can
        // carry more of the lift and the colours read brighter through.
        ctx.fillStyle = 'rgba(252,248,240,0.25)';
        ctx.fillRect(cx - wedgeR, cy - wedgeR, wedgeR * 2, wedgeR * 2);
        const wedgeSheen = ctx.createRadialGradient(cx, cy, innerCore * 0.3, cx, cy, wedgeR);
        wedgeSheen.addColorStop(0, 'rgba(255,255,255,0.04)');
        wedgeSheen.addColorStop(0.7, 'rgba(255,255,255,0.13)');
        wedgeSheen.addColorStop(1, 'rgba(255,255,255,0.20)');
        ctx.fillStyle = wedgeSheen;
        ctx.fillRect(cx - wedgeR, cy - wedgeR, wedgeR * 2, wedgeR * 2);
        // Spotlight pass — coloured bloom arcs at full saturation pop
        // forward against the milky backdrop
        drawAllRings('full');
        ctx.restore();

        // Wedge perimeter — micro-thin 1px white at 0.35 matching the
        // illuminated edge of the top pill capsule and terminal box
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, wedgeR, wedgeStart, wedgeEnd);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // ── Month labels — wrapped along the circle (curved text) ──
      // Inactive months sit OUTSIDE the wheel at labelR; the active month
      // is pulled INSIDE the wedge's outer boundary so it reads as a tag
      // on the frosted glass.
      // Labels pinned to a canvas-relative radius (46% of minDim) so they
      // always sit OUTSIDE the aura disc regardless of ring count.
      const labelR = minDim * 0.46;
      // Active label stays at the same perimeter radius as inactive months —
      // the wedge has been widened to encompass it.
      const activeLabelR = labelR;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      MONTHS.forEach((mo, i) => {
        const centerAng = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
        const isFocus = focus === i;
        const text = mo.toUpperCase();
        const r = isFocus ? activeLabelR : labelR;
        ctx.font = isFocus
          ? '700 13px Inter, system-ui, sans-serif'
          : '500 11px Inter, system-ui, sans-serif';
        ctx.fillStyle = isFocus ? '#100F0C' : 'rgba(40,30,20,0.35)';
        // Stark white text — no shadow needed on the clear refractive glass
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        // Measure widths to compute total angular span
        const widths = [];
        let totalW = 0;
        for (const ch of text) {
          const w = ctx.measureText(ch).width;
          widths.push(w);
          totalW += w;
        }
        const totalAng = totalW / r;
        // Bottom half of the wheel (angles between 0 and PI in screen coords)
        // reads upside-down with the default tangent rotation, so flip it.
        const isBottomHalf = Math.sin(centerAng) > 0;
        const startAng = isBottomHalf
          ? centerAng + totalAng / 2
          : centerAng - totalAng / 2;
        const sign = isBottomHalf ? -1 : 1;
        let cursor = 0;
        for (let k = 0; k < text.length; k++) {
          const charAng = widths[k] / r;
          const ang = startAng + sign * (cursor + charAng / 2);
          cursor += charAng;
          ctx.save();
          ctx.translate(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
          ctx.rotate(ang + (isBottomHalf ? -Math.PI / 2 : Math.PI / 2));
          ctx.fillText(text[k], 0, 0);
          ctx.restore();
        }
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      });

      // ── Central focal hub — liquid-glass circle with sharp white dot ──
      const hubR = innerCore * 0.30;
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(20,15,10,0.55)';
      ctx.beginPath();
      ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Inner highlight rim
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
      ctx.stroke();
      // Sharp white dot dead center
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
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
    // Drag-to-scrub — pressing inside the wheel grabs the wedge; moving
    // sweeps it around the dial, firing onPickMonth(m) live so the wedge,
    // background gradient, ticker, and stage colour all track the cursor.
    let dragging = false;
    let lastDragMonth = -1;

    function onClick(e) {
      // Plain click still picks the month under the cursor, but only if
      // we weren't mid-drag (drag handles its own pickMonth calls).
      if (dragging) return;
      const m = pointToMonth(e.clientX, e.clientY);
      if (m != null) onPickMonth(m);
    }
    function onPointerDown(e) {
      const m = pointToMonth(e.clientX, e.clientY);
      if (m == null) return;
      dragging = true;
      lastDragMonth = m;
      onPickMonth(m);
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    function onMove(e) {
      if (dragging) {
        const m = pointToMonth(e.clientX, e.clientY);
        if (m != null && m !== lastDragMonth) {
          lastDragMonth = m;
          onPickMonth(m);
        }
        return;
      }
      if (!onHoverMonth) return;
      const m = pointToMonth(e.clientX, e.clientY);
      onHoverMonth(m);
    }
    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    function onLeave() {
      if (onHoverMonth) onHoverMonth(null);
    }
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        cursor: 'grab',
        width: '100%', height: '100%',
        position: 'relative',
        zIndex: 2,
        touchAction: 'none', /* prevent page scroll while dragging on touch */
      }}
    />
  );
}

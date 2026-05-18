import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { SP } from '../data/bloom.js';
import { sceneImageUrl } from '../data/scene-image.js';

export default function Viz06Loop({ isActive = true }) {
  const canvasRef = useRef(null);
  const badgeRef = useRef(null);
  const frameRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const ctrlRef = useRef(null);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const badge = badgeRef.current;
    const frame = frameRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const NOW = new Date().getFullYear();
    const YEARS = NOW - 1908 + 1;
    const P = 7;
    function sr6(n) { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); }

    let W, H, dpr, particles = [], PCOLS = 0, PROWS = 0;
    let mX = -1, mY = -1, dispYear = -1, yearTimer = null;
    let mVx = 0, mVy = 0, mXprev = -1, mYprev = -1;
    const LOUPE_R = 90;

    const sceneImg = new Image();
    let sceneReady = false, sceneData = null;
    sceneImg.crossOrigin = 'anonymous';
    sceneImg.onload = function () {
      const oc = document.createElement('canvas');
      oc.width = sceneImg.naturalWidth;
      oc.height = sceneImg.naturalHeight;
      const octx = oc.getContext('2d');
      octx.drawImage(sceneImg, 0, 0);
      try {
        sceneData = octx.getImageData(0, 0, oc.width, oc.height);
        sceneReady = true;
        onSceneReady();
      } catch (e) { sceneReady = false; }
    };
    sceneImg.src = sceneImageUrl;

    function sampleScene(x, y) {
      if (!sceneData) return null;
      const u = Math.max(0, Math.min(0.9999, x / W));
      const v = Math.max(0, Math.min(0.9999, y / H));
      const px = Math.floor(u * sceneData.width);
      const py = Math.floor(v * sceneData.height);
      const idx = (py * sceneData.width + px) * 4;
      return { r: sceneData.data[idx], g: sceneData.data[idx + 1], b: sceneData.data[idx + 2] };
    }

    function paletteMap(r, g, b) {
      const lum = (r + g + b) / 3;
      const SAT = 1.14;
      let er = lum + (r - lum) * SAT;
      let eg = lum + (g - lum) * SAT;
      let eb = lum + (b - lum) * SAT;
      const enL = (er + eg + eb) / 3;
      const t = enL / 255;
      const curve = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      const k = enL > 0 ? (curve * 255) / enL : 1;
      const cK = Math.max(0.82, Math.min(1.18, k));
      er *= cK; eg *= cK; eb *= cK;
      return [
        Math.max(0, Math.min(255, Math.round(er))),
        Math.max(0, Math.min(255, Math.round(eg))),
        Math.max(0, Math.min(255, Math.round(eb))),
      ];
    }

    function enhanceSat(color) {
      const m = color.match(/rgb\((\d+),(\d+),(\d+)\)/);
      if (!m) return color;
      let r = +m[1], g = +m[2], b = +m[3];
      const lum = (r + g + b) / 3, SAT = 1.65;
      r = lum + (r - lum) * SAT;
      g = lum + (g - lum) * SAT;
      b = lum + (b - lum) * SAT;
      const K = 1.12;
      r = (r - 128) * K + 128;
      g = (g - 128) * K + 128;
      b = (b - 128) * K + 128;
      return `rgb(${Math.max(0, Math.min(255, Math.round(r)))},${Math.max(0, Math.min(255, Math.round(g)))},${Math.max(0, Math.min(255, Math.round(b)))})`;
    }

    function buildParticles() {
      particles = [];
      PCOLS = Math.floor(W / P);
      PROWS = Math.floor(H / P);
      for (let row = 0; row < PROWS; row++) {
        const yi = Math.floor((row * (YEARS - 1)) / Math.max(PROWS - 1, 1));
        for (let col = 0; col < PCOLS; col++) {
          const hx = col * P + 1, hy = row * P + 1;
          const seed = col * 5003 + row * 7919;
          const jx = (sr6(seed) - 0.5) * P * 0.6;
          const jy = (sr6(seed * 1.7) - 0.5) * P * 0.6;
          const c = sampleScene(hx + jx, hy + jy);
          let color;
          if (c) {
            const m = paletteMap(c.r, c.g, c.b);
            color = `rgb(${m[0]},${m[1]},${m[2]})`;
          } else {
            color = '#7A9E96';
          }
          particles.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, color, enhanced: enhanceSat(color), year: 1908 + yi });
        }
      }
    }

    let alive = true;
    let running = false;
    let rafId = null;
    function animate() {
      if (!alive || !running) { rafId = null; return; }
      ctx.fillStyle = '#FAFAF8';
      ctx.fillRect(0, 0, W, H);
      const hasM = mX > 0 && mY > 0;
      for (let k = 0; k < particles.length; k++) {
        const p = particles[k];
        ctx.fillStyle = p.color;
        ctx.fillRect(p.hx, p.hy, P - 2, P - 2);
      }
      if (hasM) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(mX, mY, LOUPE_R, 0, Math.PI * 2);
        ctx.clip();
        for (let k = 0; k < particles.length; k++) {
          const p = particles[k];
          const dx = p.hx - mX, dy = p.hy - mY;
          if (dx * dx + dy * dy < LOUPE_R * LOUPE_R) {
            const d = Math.sqrt(dx * dx + dy * dy);
            const bloom = 1 + (1 - d / LOUPE_R) * 0.12;
            const s = (P - 2) * bloom;
            const off = (s - (P - 2)) * 0.5;
            ctx.fillStyle = p.enhanced;
            ctx.fillRect(p.hx - off, p.hy - off, s, s);
          }
        }
        ctx.restore();
      }
      if (hasM && dispYear > 0) {
        ctx.save();
        ctx.font = "700 12px 'Space Mono',monospace";
        const yr = String(dispYear);
        const tw = ctx.measureText(yr).width;
        const pw = tw + 22, ph = 24, pilX = mX - pw / 2, pilY = mY - 50;
        ctx.fillStyle = 'rgba(38,32,26,.88)';
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(pilX, pilY, pw, ph, ph / 2); ctx.fill(); }
        else { ctx.fillRect(pilX, pilY, pw, ph); }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(245,238,212,.96)';
        ctx.fillText(yr, mX, pilY + ph / 2);
        ctx.restore();
      }
      ctx.font = "9px 'Space Mono',monospace";
      ctx.fillStyle = 'rgba(38,32,26,.60)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('1908', 9, 8);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('today · ' + NOW, W - 9, H - 7);
      const mo = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      ctx.font = "7.5px 'Space Mono',monospace";
      ctx.fillStyle = 'rgba(38,32,26,.45)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let m = 0; m < 12; m++) ctx.fillText(mo[m], Math.round((m + 0.5) * PCOLS / 12) * P + P / 2, 4);
      rafId = requestAnimationFrame(animate);
    }
    function startLoop() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(animate);
    }
    function stopLoop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect(), sc = W / rect.width;
      const nx = (e.clientX - rect.left) * sc, ny = (e.clientY - rect.top) * sc;
      if (mXprev > 0) { mVx = (nx - mXprev) * 0.55; mVy = (ny - mYprev) * 0.55; }
      mXprev = nx; mYprev = ny;
      mX = nx; mY = ny;
      const rowU = Math.floor(mY / P);
      if (rowU >= 0 && rowU < PROWS) {
        const yi = Math.floor(rowU * (YEARS - 1) / Math.max(PROWS - 1, 1));
        dispYear = 1908 + yi;
      }
      if (!yearTimer) {
        yearTimer = setInterval(() => {
          dispYear = 1908 + Math.floor(Math.random() * YEARS);
        }, 700);
      }
    }
    function onMouseLeave() {
      mX = -1; mY = -1; dispYear = -1; mVx = 0; mVy = 0; mXprev = -1; mYprev = -1;
      clearInterval(yearTimer);
      yearTimer = null;
    }
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    function setup() {
      const par = canvas.parentElement;
      W = par.clientWidth || 680;
      H = Math.round(W * 9 / 16);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    }
    let started = false;
    function onSceneReady() {
      if (started) return;
      started = true;
      setup();
      if (isActiveRef.current) startLoop();
    }
    const fallbackTid = setTimeout(onSceneReady, 1500);
    if (sceneReady) onSceneReady();

    function pauseExternal() {
      stopLoop();
      if (v6Drone) {
        try { v6Drone.releaseAll(Tone.now() + 0.5); } catch (e) { /* ignore */ }
        v6Season = null;
      }
    }
    function resumeExternal() {
      if (!started) {
        // Scene image hasn't finished loading yet; onSceneReady will start the loop
        // once it fires, because isActiveRef.current will be true.
        return;
      }
      // Catch viewport resizes that happened while inactive.
      const par = canvas.parentElement;
      const newW = par ? (par.clientWidth || 680) : W;
      if (newW !== W) setup();
      startLoop();
    }
    ctrlRef.current = { pauseExternal, resumeExternal };

    let rT;
    const onResize = () => {
      clearTimeout(rT);
      rT = setTimeout(() => { if (started) setup(); }, 200);
    };
    window.addEventListener('resize', onResize);

    // ── Interactive layer (audio + HUD) ──
    canvas.style.filter = 'saturate(0.78) contrast(1.06) brightness(0.95)';
    const hud = document.createElement('div');
    hud.style.cssText = [
      'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);',
      'font:700 9px "Space Mono",monospace;letter-spacing:.10em;',
      'color:rgba(245,238,212,.96);pointer-events:none;z-index:5;',
      'background:rgba(28,22,16,.88);',
      'padding:6px 20px;border-radius:24px;white-space:nowrap;',
      'opacity:0;transition:opacity .20s ease;',
      'box-shadow:0 2px 14px rgba(0,0,0,.32);',
    ].join('');
    frame.appendChild(hud);

    const MO_FULL = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    function dominantForMonth(mi) {
      let best = null, bestV = -1;
      SP.forEach((sp) => {
        if (sp.id === 'SLV') return;
        if (sp.bloom[mi] > bestV) { bestV = sp.bloom[mi]; best = sp; }
      });
      return best ? best.name.toUpperCase() : '—';
    }
    const V6_SCALES = {
      spring: ['E4', 'F#4', 'A4', 'B4', 'C#5', 'E5', 'F#5', 'A5'],
      monsoon: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'Eb5', 'F5'],
      autumn: ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5'],
      winter: ['C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5'],
    };
    const V6_DRONES = {
      spring: ['E2', 'B2', 'G#3'],
      monsoon: ['C2', 'G2', 'Eb3'],
      autumn: ['A1', 'E2', 'C3'],
      winter: ['D2', 'A2', 'C3'],
    };
    function getSeason(m) {
      if (m >= 1 && m <= 4) return 'spring';
      if (m >= 5 && m <= 8) return 'monsoon';
      if (m >= 9 && m <= 10) return 'autumn';
      return 'winter';
    }

    let v6Ready = false, v6Synth = null, v6Drone = null, v6Rev = null;
    let v6Season = null;
    async function ensureV6Audio() {
      if (v6Ready) return;
      try {
        await Tone.start();
        v6Rev = new Tone.Reverb({ decay: 8, wet: 0.80 }).toDestination();
        v6Synth = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.08, decay: 1.4, sustain: 0.08, release: 3.5 },
          volume: -17,
        }).connect(v6Rev);
        v6Drone = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'fatsine', count: 3, spread: 10 },
          envelope: { attack: 5, decay: 0, sustain: 1, release: 8 },
          volume: -30,
        }).connect(v6Rev);
        v6Ready = true;
      } catch (e) { /* ignore */ }
    }
    function setV6Season(season) {
      if (!v6Ready || season === v6Season) return;
      if (v6Drone) {
        v6Drone.releaseAll(Tone.now() + 1.2);
        const t = Tone.now() + 1.8;
        V6_DRONES[season].forEach((n) => v6Drone.triggerAttack(n, t));
      }
      v6Season = season;
    }
    function playCell(year, mi) {
      if (!v6Ready || !v6Synth) return;
      try {
        const season = getSeason(mi);
        setV6Season(season);
        const scale = V6_SCALES[season];
        const NOW3 = new Date().getFullYear();
        const t = (year - 1908) / Math.max(1, NOW3 - 1908);
        const idx = Math.round(t * (scale.length - 1));
        v6Synth.triggerAttackRelease(scale[idx], '4n', Tone.now());
      } catch (e) { /* ignore */ }
    }
    const NOW2 = new Date().getFullYear(), YSPAN = NOW2 - 1908 + 1;
    let lastYear = -1, lastMonth = -1;
    function onHudMove(e) {
      const rect = canvas.getBoundingClientRect();
      const rx = e.clientX - rect.left, ry = e.clientY - rect.top;
      const fw = rect.width, fh = rect.height;
      const mi = Math.min(11, Math.max(0, Math.floor((rx / fw) * 12)));
      const yi = Math.min(YSPAN - 1, Math.max(0, Math.round((ry / fh) * (YSPAN - 1))));
      const yr = 1908 + yi;
      hud.style.opacity = '1';
      hud.textContent = `YEAR: ${yr}  //  MONTH: ${MO_FULL[mi]}  //  DOMINANT: ${dominantForMonth(mi)}`;
      if (yr !== lastYear || mi !== lastMonth) {
        lastYear = yr; lastMonth = mi;
        ensureV6Audio().then(() => playCell(yr, mi));
      }
    }
    function onHudLeave() {
      hud.style.opacity = '0';
      lastYear = -1; lastMonth = -1;
      if (v6Drone) { try { v6Drone.releaseAll(Tone.now() + 3); } catch (e) { /* */ } }
      v6Season = null;
    }
    canvas.addEventListener('mousemove', onHudMove);
    canvas.addEventListener('mouseleave', onHudLeave);

    return () => {
      alive = false;
      stopLoop();
      ctrlRef.current = null;
      clearTimeout(fallbackTid);
      clearTimeout(rT);
      if (yearTimer) clearInterval(yearTimer);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('mousemove', onHudMove);
      canvas.removeEventListener('mouseleave', onHudLeave);
      window.removeEventListener('resize', onResize);
      try {
        if (v6Synth) v6Synth.dispose();
        if (v6Drone) v6Drone.dispose();
        if (v6Rev) v6Rev.dispose();
      } catch (e) { /* ignore */ }
      if (hud && hud.parentElement) hud.parentElement.removeChild(hud);
    };
  }, []);

  useEffect(() => {
    const c = ctrlRef.current;
    if (!c) return;
    if (isActive) c.resumeExternal();
    else c.pauseExternal();
  }, [isActive]);

  return (
    <section className="vs" id="v6">
      <div className="vs-num" data-n="06">The Loop</div>
      <h2 className="vs-title">It has been playing since 1908.</h2>
      <p className="vs-desc">
        118 years of the same calendar rendered as a pixel mosaic. Each column is a month, each row a year — coloured by that month's dominant blooming species. 1908 fades at the top; today is vivid at the bottom.
      </p>
      <div
        className="vs-frame"
        ref={frameRef}
        style={{ background: '#F9F9F6', padding: 0, position: 'relative', overflow: 'hidden' }}
      >
        <div className="canopy-strip"></div>
        <canvas
          id="loop-canvas"
          ref={canvasRef}
          style={{ display: 'block', width: '100%', aspectRatio: '16/9', cursor: 'crosshair' }}
          aria-label="118-year Bangalore bloom pixel art"
        />
        <div
          id="loop-mo-badge"
          ref={badgeRef}
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Space Mono',monospace",
            fontSize: 9,
            letterSpacing: '.1em',
            color: '#6E6356',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>
    </section>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { SP } from '../data/bloom.js';
import { sceneImageUrl } from '../data/scene-image.js';

/* Eight historical micro-cards drawn from public-domain Krumbiegel-era
   Bangalore horticultural record. Each fires on one of the first eight
   clicks on the mosaic in a randomised order. */
const HISTORY_CARDS = [
  { id: 'c1', year: 1908, tint: '#7A9E96',
    title: 'The Serial Bloom Baseline',
    body: 'Gustav Hermann Krumbiegel introduces bioaesthetic planning to organize Bangalore’s urban layout as an ecological canvas. By cataloging precise flowering windows, he establishes a master timeline to completely eliminate seasonal dead months.',
    svg: 'gate' },
  { id: 'c2', year: 1910, tint: '#C84878',
    title: 'Sourcing the Pink Core',
    body: 'Krumbiegel imports South American Tabebuia rosea seeds to begin extensive acclimatization trials within the Lalbagh nurseries. This step introduces the foundational pastel palette that would eventually evolve into the city’s iconic March landscape.',
    svg: 'tree' },
  { id: 'c3', year: 1912, tint: '#C89820',
    title: 'Scaling the Botanical Palette',
    body: 'The establishment of the Mysore Horticultural Society marks a shift toward community-driven tree planting. Distributing free saplings to citizens successfully expands the seasonal canopy from government boulevards into residential neighborhoods.',
    svg: 'scroll' },
  { id: 'c4', year: 1915, tint: '#6B55A0',
    title: 'The Chromatic Contrast Accord',
    body: 'Early avenue blueprints intentionally pair pink Tabebuia opposite deep blue-mauve Jacaranda trees along primary transit lines. Matching their precise blooming windows triggers a brilliant, simultaneous color conversation immortalized by mid-century artists.',
    svg: 'avenue' },
  { id: 'c5', year: 1920, tint: '#E6B800',
    title: 'Cascading the Summer Gold',
    body: 'The mass coordination of native Amaltas trees targets the volatile transition from spring heat to early monsoon. Its hanging yellow clusters create a golden curtain that smoothly shifts the city’s color profile without letting the calendar drop into darkness.',
    svg: 'chain' },
  { id: 'c6', year: 1928, tint: '#D03A18',
    title: 'The Mid Year Flame Peak',
    body: 'Massive configurations of Gulmohar trees are deployed across primary wide boulevards to cover the sweltering April and May gap. The resulting scarlet and flame-red explosion marks the highest saturation point on the entire annual calendar.',
    svg: 'flame' },
  { id: 'c7', year: 1935, tint: '#8A4898',
    title: 'Preserving the Monsoon Palette',
    body: 'The urban grid is reinforced with Pride of India trees to survive the heavy downpours of June through September. This resilient canopy locks steady purple and mauve tones into the landscape when softer blossoms would be stripped bare.',
    svg: 'bell' },
  { id: 'c8', year: 1952, tint: '#4A7C59',
    title: 'The Structural Frame Constant',
    body: 'Post-independence civic guidelines institutionalize the evergreen Silver Oak as a mandatory vertical backdrop for expanding sectors. This permanent deep-green wireframe ensures that the fluid, shifting watercolor blooms of other species always stand out in sharp relief.',
    svg: 'oak' },
];

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CardSvg({ kind, tint }) {
  const fill = tint || '#7A9E96';
  if (kind === 'gate') return (
    <svg viewBox="0 0 80 80" width="100%" height="100%">
      <rect x="0" y="0" width="80" height="80" fill="#F1E9D7" />
      <rect x="14" y="22" width="52" height="40" fill="none" stroke={fill} strokeWidth="1.5" />
      <rect x="20" y="32" width="14" height="30" fill={fill} opacity="0.18" />
      <rect x="46" y="32" width="14" height="30" fill={fill} opacity="0.18" />
      <line x1="14" y1="22" x2="40" y2="10" stroke={fill} strokeWidth="1.5" />
      <line x1="66" y1="22" x2="40" y2="10" stroke={fill} strokeWidth="1.5" />
      <circle cx="40" cy="46" r="3" fill={fill} />
    </svg>
  );
  if (kind === 'tree') return (
    <svg viewBox="0 0 80 80" width="100%" height="100%">
      <rect width="80" height="80" fill="#F1E9D7" />
      <ellipse cx="40" cy="36" rx="22" ry="16" fill={fill} opacity="0.55" />
      <ellipse cx="40" cy="30" rx="18" ry="12" fill={fill} opacity="0.85" />
      <rect x="38" y="48" width="4" height="22" fill="#6E6356" />
    </svg>
  );
  if (kind === 'scroll') return (
    <svg viewBox="0 0 80 80" width="100%" height="100%">
      <rect width="80" height="80" fill="#F1E9D7" />
      <rect x="16" y="16" width="48" height="50" fill="#FAF4E4" stroke={fill} strokeWidth="1.2" />
      {[26, 32, 38, 44, 50, 56].map((y) => (
        <line key={y} x1="22" y1={y} x2="58" y2={y} stroke={fill} strokeWidth="0.8" opacity="0.5" />
      ))}
    </svg>
  );
  if (kind === 'avenue') return (
    <svg viewBox="0 0 80 80" width="100%" height="100%">
      <rect width="80" height="80" fill="#F1E9D7" />
      <polygon points="40,18 12,68 68,68" fill={fill} opacity="0.10" />
      {[24, 36, 48, 60].map((y, i) => (
        <ellipse key={y} cx={40 - (i * 1.5) - 12} cy={y} rx="6" ry="4" fill={fill} opacity="0.7" />
      ))}
      {[24, 36, 48, 60].map((y, i) => (
        <ellipse key={`r${y}`} cx={40 + (i * 1.5) + 12} cy={y} rx="6" ry="4" fill={fill} opacity="0.7" />
      ))}
    </svg>
  );
  if (kind === 'flame') return (
    <svg viewBox="0 0 80 80" width="100%" height="100%">
      <rect width="80" height="80" fill="#F1E9D7" />
      <path d="M40 14 Q26 32 28 46 Q22 52 30 60 Q22 60 24 68 L56 68 Q58 60 50 60 Q58 52 52 46 Q54 32 40 14Z" fill={fill} opacity="0.85" />
    </svg>
  );
  if (kind === 'oak') return (
    <svg viewBox="0 0 80 80" width="100%" height="100%">
      <rect width="80" height="80" fill="#F1E9D7" />
      {[20, 40, 60].map((cx) => (
        <g key={cx}>
          <rect x={cx - 1.5} y="36" width="3" height="32" fill="#6E6356" />
          {[18, 26, 34].map((cy) => <ellipse key={cy} cx={cx} cy={cy} rx="8" ry="5" fill={fill} opacity="0.7" />)}
        </g>
      ))}
    </svg>
  );
  if (kind === 'chain') return (
    <svg viewBox="0 0 80 80" width="100%" height="100%">
      <rect width="80" height="80" fill="#F1E9D7" />
      <line x1="40" y1="8" x2="40" y2="72" stroke={fill} strokeWidth="1.4" opacity="0.5" />
      {[18, 30, 42, 54, 66].map((y) => (
        <circle key={y} cx="40" cy={y} r="6" fill={fill} opacity="0.85" />
      ))}
    </svg>
  );
  // bell
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%">
      <rect width="80" height="80" fill="#F1E9D7" />
      <path d="M40 14 C56 14, 60 32, 56 50 L24 50 C20 32, 24 14, 40 14Z" fill={fill} opacity="0.85" />
      <rect x="22" y="50" width="36" height="6" fill={fill} opacity="0.6" />
      <circle cx="40" cy="60" r="4" fill={fill} />
    </svg>
  );
}

export default function Viz06Loop({ isActive = true }) {
  const canvasRef = useRef(null);
  const badgeRef = useRef(null);
  const frameRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const ctrlRef = useRef(null);
  const [card, setCard] = useState(null);
  const orderRef = useRef(shuffled(HISTORY_CARDS));
  const clickCountRef = useRef(0);
  const lastCellRef = useRef({ yi: -1, mi: -1 });
  const cellCardRef = useRef(new Map()); // key "yi,mi" → card data (stable per pixel)
  const pinnedYearRef = useRef(null); // when card is active, lock HUD year to this
  const cardPosRef = useRef(null); // {x, y} of currently-displayed card click point

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
      const isLanding = !!canvas.closest('.landing-inner');
      W = par.clientWidth || 680;
      H = isLanding ? (par.clientHeight || Math.round(W * 9 / 16)) : Math.round(W * 9 / 16);
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

    // ── Interactive layer (audio + glass HUD that follows cursor) ──
    canvas.style.filter = 'saturate(0.78) contrast(1.06) brightness(0.95)';
    const hud = document.createElement('div');
    hud.style.cssText = [
      'position:absolute;left:0;top:0;',
      'font:600 12px "Space Mono",monospace;letter-spacing:.08em;',
      'color:rgba(20,15,10,.92);pointer-events:none;z-index:6;',
      'background:rgba(255,255,255,.42);',
      '-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);',
      'border:1px solid rgba(255,255,255,.55);',
      'padding:10px 18px;border-radius:14px;white-space:nowrap;',
      'opacity:0;transition:opacity .20s ease, transform .12s ease;',
      'box-shadow:none;',
      'transform:translate(-50%,-130%);',
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
      const yr = pinnedYearRef.current != null ? pinnedYearRef.current : 1908 + yi;
      hud.style.opacity = '1';
      hud.style.left = rx + 'px';
      hud.style.top = ry + 'px';
      hud.textContent = `${yr}  ·  ${MO_FULL[mi].slice(0, 3)}  ·  ${dominantForMonth(mi)}`;
      // Dismiss the history card as soon as the cursor moves a meaningful
      // distance from where it was opened (so a click shows the card, the
      // next hover hides it).
      if (cardPosRef.current) {
        const dx = rx - cardPosRef.current.x;
        const dy = ry - cardPosRef.current.y;
        if (dx * dx + dy * dy > 64) { // ~8px threshold
          cardPosRef.current = null;
          pinnedYearRef.current = null;
          lastCellRef.current = { yi: -1, mi: -1 };
          setCard(null);
        }
      }
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

    function onCellClick(e) {
      const rect = canvas.getBoundingClientRect();
      const rx = e.clientX - rect.left, ry = e.clientY - rect.top;
      const mi = Math.min(11, Math.max(0, Math.floor((rx / rect.width) * 12)));
      const yi = Math.min(YSPAN - 1, Math.max(0, Math.round((ry / rect.height) * (YSPAN - 1))));
      // First click acts as the user gesture that unlocks Web Audio so the
      // subsequent hover notes can play (browsers block AudioContext.start
      // until a real input event).
      ensureV6Audio().then(() => playCell(1908 + yi, mi));
      // Same pixel re-click → keep showing the same card, no change
      if (yi === lastCellRef.current.yi && mi === lastCellRef.current.mi) return;
      lastCellRef.current = { yi, mi };
      const cellKey = `${yi},${mi}`;
      const clickedYear = 1908 + yi;
      // Each pixel maps to the card whose year is closest to its row's year
      // (stable per pixel; same click always yields the same card)
      let data = cellCardRef.current.get(cellKey);
      if (!data) {
        data = HISTORY_CARDS.reduce((best, c) =>
          Math.abs(c.year - clickedYear) < Math.abs(best.year - clickedYear) ? c : best,
          HISTORY_CARDS[0]
        );
        cellCardRef.current.set(cellKey, data);
      }
      pinnedYearRef.current = data.year;
      hud.textContent = `${data.year}  ·  ${MO_FULL[mi].slice(0, 3)}  ·  ${dominantForMonth(mi)}`;
      cardPosRef.current = { x: rx, y: ry };
      setCard({
        ...data,
        key: `${data.id}-${cellKey}`,
        x: rx, y: ry,
        frameW: rect.width, frameH: rect.height,
      });
    }
    canvas.addEventListener('click', onCellClick);

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
      canvas.removeEventListener('click', onCellClick);
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
      <div className="vs-num">Loop</div>
      <h2 className="vs-title">Playing since 1908.</h2>
      <p className="vs-desc">
        118 years of the same calendar rendered as a pixel mosaic. Each column is a month, each row a year — coloured by that month's dominant blooming species.
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
          style={{ display: 'block', cursor: 'crosshair' }}
          aria-label="118-year Bangalore bloom pixel art"
        />
        <div
          id="loop-mo-badge"
          ref={badgeRef}
          style={{ display: 'none' }}
        />
        {card && (() => {
          const c = card;
          const cardW = 300;
          const estH = 220;
          const px = Math.min(Math.max(c.x + 18, 12), c.frameW - cardW - 12);
          const py = Math.min(Math.max(c.y + 18, 12), c.frameH - estH - 12);
          return (
            <article
              key={c.key}
              style={{
                position: 'absolute',
                left: px, top: py,
                width: cardW,
                background: 'rgba(255,255,255,.42)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,.55)',
                borderRadius: 22,
                padding: 18,
                boxShadow: '0 8px 28px rgba(0,0,0,.18)',
                color: '#1A140F',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                zIndex: 10,
                animation: 'loopCardIn .28s ease-out both',
              }}
            >
              <div style={{
                font: "700 10px 'Space Mono',monospace",
                letterSpacing: '.24em',
                color: c.tint, marginBottom: 6,
              }}>
                {c.year}
              </div>
              <h4 style={{
                margin: '0 0 10px',
                font: "italic 19px 'Cormorant Garamond',serif",
                lineHeight: 1.18,
                color: '#1A140F',
              }}>
                {c.title}
              </h4>
              <p style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.5,
                color: '#3A3128',
              }}>
                {c.body}
              </p>
            </article>
          );
        })()}
      </div>
    </section>
  );
}

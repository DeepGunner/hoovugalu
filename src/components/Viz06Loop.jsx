import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { installAudioUnlock } from '../data/audioUnlock.js';
import { SP } from '../data/bloom.js';
import { sceneImageUrl } from '../data/scene-image.js';

/* Per-tree cards keyed by species id. Clicking a pixel surfaces the card
   for that month's DOMINANT tree — the city's chromatic chair-holder for
   the season the cursor lands in. */
const TREE_CARDS = {
  SLV: {
    id: 'SLV', name: 'Silver Oak', tint: '#7A9E96', image: '/SilverOak.png',
    title: 'The Structural Frame Constant',
    window: 'JAN – DEC',
    body: "Introduced from Australia, the Silver Oak functions as the architectural chassis of Krumbiegel's metropolitan design. Unlike the volatile blooming canopies, this evergreen giant holds a steady, structural deep-green backdrop year-round. It serves as a living, permanent stage — existing quietly in the background so that the theatrical, explosive color handoffs of the other nine species have a dark canvas to land against.",
  },
  ERY: {
    id: 'ERY', name: 'Coral Tree', tint: '#C94028', image: '/CoralTree.png',
    title: 'The Pre-Spring Ignition',
    window: 'JAN · DEC',
    body: 'Originating in the Indo-Pacific, the Coral Tree marks the definitive closing and opening of the seasonal loop. Arriving in January on completely bare branches, its bright scarlet claws erupt into the cold winter air. By clearing away its own leaves before blooming, it maximizes color visibility — shaking the city awake and initiating the first notes of the annual chromatic handoff.',
  },
  JAC: {
    id: 'JAC', name: 'Jacaranda', tint: '#6B55A0', image: '/Jacaranda.png',
    title: 'The Blue-Mauve Horizon',
    window: 'FEB – APR',
    body: "The absolute visual crown of the Spring season. Introduced from South America, the Jacaranda turns Bangalore's overhead canopy into an entirely blue-mauve ceiling across March. It alters the very light and acoustic density of the avenues. Millions walk underneath its violet carpet every year, experiencing a massive, synchronized color cloud that completely dominates the skyline for nearly five months.",
  },
  TAB: {
    id: 'TAB', name: 'Pink Trumpet', tint: '#C84878', image: '/PinkTrumpet.png',
    title: 'The Pastel Intertwine',
    window: 'FEB · OCT – NOV',
    body: 'Brought from Central America, the Pink Trumpet acts as a highly fluid transition element in the system. Erupting twice a year — first as a pastel partner to the gold of February, then returning as a soft cushion in November — its delicate pink blossoms soften the urban lines. It coordinates directly with the surrounding canopies to ensure the city is always mid-sentence.',
  },
  TYE: {
    id: 'TYE', name: 'Tree of Gold', tint: '#E6B800', image: '/TreeOfGold.png',
    title: 'The Architectural Traffic-Stopper',
    window: 'FEB',
    body: 'A South American native strategically planted to create maximum theatrical contrast. Exploding in February alongside the deep violet of the Jacaranda, the Tree of Gold acts as a sudden, structural burst of pure gold. It was deployed across specific avenues to manipulate the light, forcing the eye forward and transforming everyday public streets into a high-precision, living design gallery.',
  },
  AML: {
    id: 'AML', name: 'Amaltas', tint: '#C89820', image: '/Amaltas.png',
    title: 'The Native Golden Chandelier',
    window: 'APR – MAY',
    body: 'A deeply rooted South Asian native that defines the arrival of full summer. As April begins, the Amaltas drops its leaves to suspend massive, cascading chandeliers of pure golden blossoms. These native yellow curtains drape over the avenues, catching the intense pre-monsoon sunlight and cooling the street temperatures right before the fierce heat of May takes over.',
  },
  GUL: {
    id: 'GUL', name: 'Gulmohur', tint: '#D03A18', image: '/Gulmohar.png',
    title: 'The Summer Fountain of Flame',
    window: 'APR – JUN',
    body: "Hailing from Madagascar, the Gulmohur represents the peak intensity of the city's color cycle. Exploding in May, it blankets the overhead canopies in violent, fiery red fountains of flame. It behaves like a massive visual exclamation point at the end of summer, completely consuming the remaining golden light of the Amaltas before the monsoon rains arrive to wash the canvas clean.",
  },
  POI: {
    id: 'POI', name: 'Pride of India', tint: '#8A4898', image: '/PrideOfIndia.png',
    title: 'The Deep Monsoon Bridge',
    window: 'JUN – SEP',
    body: "A sturdy native species engineered to hold the city's aesthetic together during the heavy downpours of July. As the sky turns gray, the Pride of India erupts into rich purple-pink clusters. It ensures that even when the city's environment is dark and wet, the sequence never goes dark between seasons, holding a vibrant, rain-resistant bridge until autumn arrives.",
  },
  SPA: {
    id: 'SPA', name: 'Scarlet Bell Tree', tint: '#C03818', image: '/ScarletBellTree.png',
    title: 'The Ugandan Monsoon Sentinel',
    window: 'AUG – OCT',
    body: 'Brought from Uganda, the Scarlet Bell Tree acts as a critical autumn anchor from August through October. Its heavy, cup-shaped scarlet-orange bells open sequentially, capturing rainwater and holding a deep, fiery saturation against the wet monsoon greenery. It functions as a precise chronological pivot point, gradually handing the color scheme off as the purple tones fade out.',
  },
  PEL: {
    id: 'PEL', name: 'Copper Pod', tint: '#C87820', image: '/CopperPod.png',
    title: 'The Secondary Vistas Illumination',
    window: 'SEP – NOV',
    body: 'Spanning across South and Southeast Asia, the Copper Pod closes the late autumn loop in October. Lighting up entire urban vistas with its second flowering, it covers the streets in a deep, copper-yellow dust. This golden canopy interacts with the cooling year-end air, warming the visual landscape of the neighborhoods just as the pink trumpets prepare to return.',
  },
};

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
  // Active cell drives both the month-strip active letter and the spotlight
  // dimming overlay drawn inside the animate loop.
  const [activeCell, setActiveCell] = useState(null); // {yi, mi} | null
  const activeCellRef = useRef(null);
  useEffect(() => { activeCellRef.current = activeCell; }, [activeCell]);
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
      // Removed: black year pill on hover (the glass HUD chip handles the
      // year/month/species readout, no need for a duplicate canvas pill).
      ctx.font = "9px 'Space Mono',monospace";
      ctx.fillStyle = 'rgba(38,32,26,.60)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('1908', 9, 8);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('today · ' + NOW, W - 9, H - 7);
      // Month letters now rendered as an HTML strip above the canvas
      // (with active-state styling driven by activeCellRef); no canvas text.

      // ── Spotlight crosshair when a cell is active ──
      // Dim every pixel except those on the active row OR active column;
      // draw a thin frame around the active pixel itself.
      const ac = activeCellRef.current;
      if (ac) {
        const colX = Math.floor(ac.mi * PCOLS / 12);
        const colXEnd = Math.floor((ac.mi + 1) * PCOLS / 12);
        // For each row band that maps to a year, find the row whose year
        // matches ac.yi. Simpler: invert the row→yi mapping.
        const targetRow = Math.round(ac.yi * (PROWS - 1) / Math.max(YEARS - 1, 1));
        // Dim everything
        ctx.fillStyle = 'rgba(250,250,248,0.60)';
        ctx.fillRect(0, 0, W, H);
        // Re-draw the crosshair: full active COLUMN + full active ROW at
        // their true colours, zoomed 1.3× with a soft drop-shadow so the
        // intercept timeline visibly elevates above the dimmed grid.
        const ZOOM = 1.30;
        const dz = ((P - 2) * ZOOM - (P - 2)) / 2; // centre offset
        const drawElevated = (p) => {
          ctx.save();
          ctx.shadowColor = 'rgba(20,15,10,0.22)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.hx - dz, p.hy - dz, (P - 2) * ZOOM, (P - 2) * ZOOM);
          ctx.restore();
        };
        // Column (vertical strip — the active month)
        for (let row = 0; row < PROWS; row++) {
          for (let col = colX; col < colXEnd; col++) {
            const p = particles[row * PCOLS + col];
            if (p) drawElevated(p);
          }
        }
        // Row (horizontal strip — the active year)
        for (let col = 0; col < PCOLS; col++) {
          if (col >= colX && col < colXEnd) continue; // already drawn above
          const p = particles[targetRow * PCOLS + col];
          if (p) drawElevated(p);
        }
        // Crisp frame around the SINGLE intercept pixel (year × month) —
        // makes the chosen point unmistakably specific within the crosshair.
        const fx = Math.floor((colX + (colXEnd - colX) / 2)) * P + 1;
        const fy = targetRow * P + 1;
        const fs = (P - 2) * ZOOM;
        ctx.strokeStyle = 'rgba(20,15,10,0.95)';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(fx - dz - 1, fy - dz - 1, fs + 2, fs + 2);
      }
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
    // Aggressive audio unlock for in-app webviews (LinkedIn, Instagram, etc.)
    installAudioUnlock(Tone);

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
    // Clamp the HUD pill's left position so it never overflows the canvas
    // edges on mobile (where extreme-left / extreme-right pixels would push
    // half the pill outside the viewport). Reads the pill's measured width
    // and shifts it inward by whatever margin is missing on the closer side.
    function clampHudX(desiredX) {
      const half = hud.offsetWidth / 2 + 6;
      const cw = canvas.clientWidth;
      if (desiredX < half) return half;
      if (desiredX > cw - half) return cw - half;
      return desiredX;
    }
    function onHudMove(e) {
      const rect = canvas.getBoundingClientRect();
      const rx = e.clientX - rect.left, ry = e.clientY - rect.top;
      const fw = rect.width, fh = rect.height;
      const mi = Math.min(11, Math.max(0, Math.floor((rx / fw) * 12)));
      const yi = Math.min(YSPAN - 1, Math.max(0, Math.round((ry / fh) * (YSPAN - 1))));
      const yr = pinnedYearRef.current != null ? pinnedYearRef.current : 1908 + yi;
      // Always keep the HUD pill visible — when a card is open we pin it
      // to the active pixel so the two read as one consistent label.
      hud.style.opacity = '1';
      if (activeCellRef.current && cardPosRef.current) {
        hud.style.top = cardPosRef.current.y + 'px';
        // Set text first so offsetWidth is accurate, then clamp x.
        const ac0 = activeCellRef.current;
        const acYr0 = pinnedYearRef.current != null ? pinnedYearRef.current : 1908 + ac0.yi;
        hud.textContent = `${acYr0}  ·  ${MO_FULL[ac0.mi].slice(0, 3)}  ·  ${dominantForMonth(ac0.mi)}`;
        hud.style.left = clampHudX(cardPosRef.current.x) + 'px';
        // If the card sits at the TOP (pixel in lower half), drop the pill
        // BELOW the pixel; otherwise float it above as usual. Keeps the
        // pill on the opposite side of the pixel from the card.
        const cardAtTop = cardPosRef.current.y / (canvas.clientHeight || 1) > 0.5;
        hud.style.transform = cardAtTop
          ? 'translate(-50%, 30%)'
          : 'translate(-50%, -130%)';
      } else {
        hud.style.top = ry + 'px';
        hud.style.transform = 'translate(-50%, -130%)';
        hud.textContent = `${yr}  ·  ${MO_FULL[mi].slice(0, 3)}  ·  ${dominantForMonth(mi)}`;
        hud.style.left = clampHudX(rx) + 'px';
      }
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
          setActiveCell(null);
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
        // Resolve THIS month's dominant FLOWERING tree (highest bloom value,
        // excluding the structural Silver Oak — same logic the HUD pill uses
        // so the two readouts always agree).
        let bestSp = null, bestV = -1;
        SP.forEach((sp) => {
          if (sp.id === 'SLV') return;
          if (sp.bloom[mi] > bestV) { bestV = sp.bloom[mi]; bestSp = sp; }
        });
        const tree = TREE_CARDS[bestSp?.id] || TREE_CARDS.SLV;
        data = { ...tree, year: clickedYear };
        cellCardRef.current.set(cellKey, data);
      }
      pinnedYearRef.current = data.year;
      cardPosRef.current = { x: rx, y: ry };
      // Pin the pill to the active pixel immediately (no need to wait for
      // the next mousemove) and align its text to the card's metadata.
      hud.style.opacity = '1';
      hud.style.top = ry + 'px';
      const _cardAtTop = ry / (canvas.clientHeight || 1) > 0.5;
      hud.style.transform = _cardAtTop
        ? 'translate(-50%, 30%)'
        : 'translate(-50%, -130%)';
      // Set text BEFORE measuring/clamping so the offsetWidth is accurate.
      hud.textContent = `${data.year}  ·  ${MO_FULL[mi].slice(0, 3)}  ·  ${dominantForMonth(mi)}`;
      hud.style.left = clampHudX(rx) + 'px';
      setCard({
        ...data,
        key: `${data.id}-${cellKey}`,
        x: rx, y: ry,
        frameW: rect.width, frameH: rect.height,
        mi,
      });
      setActiveCell({ yi, mi });
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
        Tap any pixel in the tapestry to reveal that month's color, sonic hum, and tree details.
      </p>
      <div
        className="vs-frame"
        ref={frameRef}
        style={{ background: '#F9F9F6', padding: 0, position: 'relative', overflow: 'hidden' }}
      >
        <div className="canopy-strip"></div>
        {/* Rigid month timeline header — single-letter J F M A M J J A S O N D,
            12 equal columns flexed across, aligned to canvas columns.
            Active letter (when a pixel is selected) lights up bold-italic with
            an underline accent. */}
        <div
          className="loop-mo-strip"
          aria-hidden="true"
          style={{
            display: 'flex',
            width: '100%',
            padding: '8px 0 6px',
            background: 'transparent',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].map((m, i) => {
            const isActive = activeCell && activeCell.mi === i;
            return (
              <span
                key={i}
                style={{
                  flex: '1 1 0',
                  textAlign: 'center',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 'clamp(10px, 1.6vw, 13px)',
                  letterSpacing: '0.08em',
                  fontStyle: isActive ? 'italic' : 'normal',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#1A140F' : 'rgba(26,20,15,0.35)',
                  transform: isActive ? 'scale(1.18)' : 'scale(1)',
                  textDecoration: isActive ? 'underline' : 'none',
                  textUnderlineOffset: 4,
                  textDecorationThickness: '1px',
                  transition: 'color .22s ease, transform .22s ease, font-weight .22s ease',
                  transformOrigin: 'center',
                }}
              >
                {m}
              </span>
            );
          })}
        </div>
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
        {/* Unified story sheet — metadata + narrative welded into ONE card.
            Slides up from the bottom of the viewport on click. */}
        {card && (() => {
          const c = card;
          const MO_FULL = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
          // Anchor the card to whichever half of the frame DOESN'T contain
          // the active pixel — guarantees the elevated pixel + its crosshair
          // stay visible. 50% split so the card never lands on top of the
          // tapped point.
          const stickTop = c.y / c.frameH > 0.5;
          const animName = stickTop ? 'loopCardDropDown' : 'loopCardSlideUp';
          // When the card is anchored to the top, push it ~44px down so it
          // clears the JAN-DEC month strip that lives above the canvas, and
          // cap its height so the bottom never spills past the visualisation.
          const posStyle = stickTop
            ? { top: 48, maxHeight: 'calc(100% - 64px)', overflowY: 'auto' }
            : { bottom: 18, maxHeight: 'calc(100% - 32px)', overflowY: 'auto' };
          return (
            <article
              key={c.key}
              style={{
                position: 'absolute',
                left: '50%',
                ...posStyle,
                transform: 'translateX(-50%)',
                width: 'min(560px, calc(100% - 28px))',
                background: 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(24px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                border: '1px solid rgba(255,255,255,0.40)',
                borderRadius: 18,
                padding: 0,
                boxShadow: '0 18px 48px rgba(20,15,10,0.22)',
                color: '#1A140F',
                zIndex: 10,
                animation: `${animName} .42s cubic-bezier(0.16,1,0.3,1) both`,
              }}
            >
              {/* Header row — tree image on the left, serif tree-name title
                  on the right with a muted Space Mono data string below it. */}
              <div style={{
                padding: '16px 20px 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}>
                <img
                  src={c.image}
                  alt={c.name}
                  style={{
                    width: 56, height: 56,
                    borderRadius: 10,
                    objectFit: 'cover',
                    flex: '0 0 auto',
                    boxShadow: '0 2px 6px rgba(20,15,10,0.10)',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <h4 style={{
                    margin: 0,
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontWeight: 700,
                    fontSize: 24,
                    lineHeight: 1.1,
                    color: '#000000',
                  }}>
                    {c.name}
                  </h4>
                  <div style={{
                    marginTop: 2, marginBottom: 0,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.10em',
                    color: 'rgba(26, 21, 35, 0.5)',
                  }}>
                    {c.year}&nbsp;&nbsp;//&nbsp;&nbsp;{c.window}
                  </div>
                </div>
              </div>
              {/* Micro-thin divider */}
              <div style={{
                height: 1,
                background: 'rgba(26,20,15,0.08)',
                margin: '14px 20px 0',
              }} />
              {/* Description body — pure serif, no marketing title. */}
              <div style={{ padding: '14px 20px 18px' }}>
                <p style={{
                  margin: 0,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: 15,
                  lineHeight: 1.6,
                  letterSpacing: 0,
                  color: '#1A140F',
                }}>
                  {c.body}
                </p>
              </div>
            </article>
          );
        })()}
      </div>
    </section>
  );
}

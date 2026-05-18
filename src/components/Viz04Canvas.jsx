import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SP, M_LONG, M_SHORT, rgba, dShuffle } from '../data/bloom.js';

export default function Viz04Canvas({ isActive = true }) {
  const mapRef = useRef(null);
  const canvasRef = useRef(null);
  const moRef = useRef(null);
  const badgeMoRef = useRef(null);
  const badgeRef = useRef(null);
  const hintRef = useRef(null);
  const sliderRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const ctrlRef = useRef(null);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  useEffect(() => {
    const TILE_N = 135,
      COLS = 15,
      ROWS = 9;
    const weights = { SLV: 12, ERY: 10, JAC: 14, TAB: 10, AML: 9, GUL: 13, POI: 13, COL: 10, BAU: 11 };
    let pool = [];
    SP.forEach((sp) => {
      for (let i = 0; i < (weights[sp.id] || 0); i++) pool.push(sp);
    });
    while (pool.length < TILE_N) pool.push(...pool.slice(0, TILE_N - pool.length));
    const tSp = dShuffle(pool.slice(0, TILE_N), 77);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bgC = document.createElement('canvas');
    const bgX = bgC.getContext('2d');

    const sl = sliderRef.current;
    const moEl = moRef.current;
    const badge = badgeRef.current;
    const badgeMo = badgeMoRef.current;
    const hint = hintRef.current;

    let live = true,
      running = false,
      animM = -1,
      W,
      H,
      dpr,
      petalPos = [],
      aRaf = null;
    let leafletMap = null;
    const BANG_CENTER = [12.9716, 77.5946];
    const BANG_ZOOM = 14;

    function initLeafletMap() {
      if (leafletMap) return true;
      const mapDiv = mapRef.current;
      if (!mapDiv) return false;
      if (!mapDiv.style.width || mapDiv.offsetWidth < 10) {
        const par = canvas.parentElement;
        const w = par.clientWidth || 680,
          h = Math.round((w * 9) / 16);
        mapDiv.style.width = w + 'px';
        mapDiv.style.height = h + 'px';
      }
      try {
        leafletMap = L.map(mapDiv, {
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          dragging: false,
          touchZoom: false,
          keyboard: false,
          boxZoom: false,
          tap: false,
          zoomAnimation: false,
          fadeAnimation: false,
          inertia: false,
          zoomSnap: 0,
        }).setView(BANG_CENTER, BANG_ZOOM);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(leafletMap);
        setTimeout(() => leafletMap && leafletMap.invalidateSize(true), 80);
        setTimeout(() => leafletMap && leafletMap.invalidateSize(true), 350);
        return true;
      } catch (e) {
        return false;
      }
    }

    function rr(c, x, y, w, h, rad) {
      c.beginPath();
      if (c.roundRect) c.roundRect(x, y, w, h, rad);
      else c.rect(x, y, w, h);
      c.fill();
    }

    function updCanvas(t, now) {
      if (t === undefined) t = 0;
      if (now === undefined) now = performance.now();
      const tMod = ((t % 12) + 12) % 12;
      const m1 = Math.floor(tMod) % 12;
      const m2 = (m1 + 1) % 12;
      const frac = tMod - Math.floor(tMod);

      if (m1 !== animM) {
        animM = m1;
        if (moEl) moEl.textContent = M_SHORT[m1];
        if (badgeMo) badgeMo.textContent = M_LONG[m1];
      }

      ctx.clearRect(0, 0, W, H);
      const cellW = W / COLS;

      const POP_START = 0.85;
      let popMix;
      if (frac < POP_START) {
        popMix = 0;
      } else {
        const p = (frac - POP_START) / (1 - POP_START);
        popMix = p * p * (3 - 2 * p);
      }
      const bloomAt = (sp) => (sp.bloom[m1] * (1 - popMix) + sp.bloom[m2] * popMix) / 100;

      // SLV stripes
      tSp.forEach((sp, i) => {
        if (sp.id !== 'SLV') return;
        const p = petalPos[i] || { x: W / 2, y: H / 2, szM: 1 };
        const sv = bloomAt(sp);
        const s = cellW * 0.36 * p.szM;
        const rw = s * 1.5,
          rh = s * 0.42;
        ctx.fillStyle = rgba('#7A9E96', 0.32 + sv * 0.2);
        rr(ctx, p.x - rw / 2, p.y - rh / 2, rw, rh, Math.min(rh * 0.4, 3));
      });

      // Bloom squares
      tSp.forEach((sp, i) => {
        if (sp.id === 'SLV') return;
        const p = petalPos[i] || { x: W / 2, y: H / 2, szM: 1 };
        const v = bloomAt(sp);
        if (v < 0.22) return;
        let a;
        if (v < 0.5) {
          const tn = (v - 0.22) / 0.28;
          a = tn * tn * (3 - 2 * tn) * 0.65;
        } else {
          a = 0.65 + ((v - 0.5) / 0.5) * 0.17;
        }
        const s = cellW * 0.74 * p.szM;
        if (s < 1) return;
        ctx.fillStyle = rgba(sp.c, a);
        rr(ctx, p.x - s / 2, p.y - s / 2, s, s, Math.min(s * 0.18, 6));
      });
    }

    function stopAnim() {
      if (paused) return;
      paused = true;
      if (badge) badge.style.opacity = '0';
      setTimeout(() => {
        if (hint) hint.style.opacity = '1';
      }, 80);
      setTimeout(() => {
        if (hint) hint.style.opacity = '0';
      }, 2800);
    }

    function setup() {
      const par = canvas.parentElement;
      W = par.clientWidth || 680;
      H = Math.round((W * 9) / 16);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [canvas, bgC].forEach((c) => {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
        c.style.width = W + 'px';
        c.style.height = H + 'px';
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bgX.setTransform(dpr, 0, 0, dpr, 0, 0);

      const mapDiv = mapRef.current;
      if (mapDiv) {
        mapDiv.style.width = W + 'px';
        mapDiv.style.height = H + 'px';
        if (leafletMap) {
          setTimeout(() => leafletMap.invalidateSize(true), 60);
        } else {
          initLeafletMap();
        }
      }

      petalPos = tSp.map((sp, idx) => {
        const row = Math.floor(idx / COLS),
          col = idx % COLS,
          seed = idx * 73.1;
        return {
          x: (col / COLS + 0.5 / COLS) * W + Math.sin(seed) * W * 0.032,
          y: (row / ROWS + 0.5 / ROWS) * H + Math.sin(seed + 1.7) * H * 0.038,
          rot: -Math.PI / 2 + Math.sin(seed * 2.3) * 0.24,
          szM: 0.8 + Math.abs(Math.sin(seed * 5.7)) * 0.38,
        };
      });
      updCanvas(t, performance.now());
    }

    let t = 0,
      tLast = null,
      paused = false;
    const YEAR_SECS = 11;

    function runLoop() {
      if (!live || !running) {
        aRaf = null;
        return;
      }
      const now = performance.now();
      if (tLast === null) tLast = now;
      const dt = (now - tLast) / 1000;
      tLast = now;
      if (!paused) {
        t = (t + (dt * 12) / YEAR_SECS) % 12;
      }
      updCanvas(t, now);
      aRaf = requestAnimationFrame(runLoop);
    }

    function startLoop() {
      if (running) return;
      running = true;
      tLast = performance.now();
      aRaf = requestAnimationFrame(runLoop);
    }
    function stopLoop() {
      running = false;
      if (aRaf) { cancelAnimationFrame(aRaf); aRaf = null; }
      tLast = null;
    }

    function pauseExternal() { stopLoop(); }
    function resumeExternal() {
      if (running) return;
      // Re-fit canvas and reflow Leaflet tiles in case the viewport changed while inactive.
      setup();
      if (leafletMap) setTimeout(() => { try { leafletMap.invalidateSize(true); } catch (e) {} }, 60);
      startLoop();
    }
    ctrlRef.current = { pauseExternal, resumeExternal };

    setup();
    if (isActiveRef.current) startLoop();

    const onDown = () => stopAnim();
    const onInput = () => {
      if (!paused) stopAnim();
      t = +sl.value;
    };
    sl.addEventListener('mousedown', onDown, { once: true });
    sl.addEventListener('touchstart', onDown, { once: true, passive: true });
    sl.addEventListener('input', onInput);

    let rT;
    const onResize = () => {
      clearTimeout(rT);
      rT = setTimeout(setup, 200);
    };
    window.addEventListener('resize', onResize);

    return () => {
      live = false;
      running = false;
      ctrlRef.current = null;
      if (aRaf) cancelAnimationFrame(aRaf);
      sl.removeEventListener('mousedown', onDown);
      sl.removeEventListener('touchstart', onDown);
      sl.removeEventListener('input', onInput);
      window.removeEventListener('resize', onResize);
      clearTimeout(rT);
      if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
      }
    };
  }, []);

  useEffect(() => {
    const c = ctrlRef.current;
    if (!c) return;
    if (isActive) c.resumeExternal();
    else c.pauseExternal();
  }, [isActive]);

  return (
    <section className="vs" id="v4">
      <div className="vs-num" data-n="04">The Canvas</div>
      <h2 className="vs-title">The city as a single composition.</h2>
      <p className="vs-desc">
        The year plays on a loop over Bangalore's street map — each coloured block is an avenue section. When ready, drag the slider to take control month by month.
      </p>
      <div className="vs-frame">
        <div id="av-map-wrap">
          <div id="av-map" ref={mapRef}></div>
          <canvas
            id="av-canvas"
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: 370, position: 'relative', zIndex: 1 }}
          />
          <div id="av-badge" ref={badgeRef}>
            <span className="av-pulse"></span>
            <span id="av-badge-mo" ref={badgeMoRef}>
              January
            </span>
          </div>
          <div id="av-hint" ref={hintRef}>
            drag the slider to explore →
          </div>
        </div>
        <div className="ctrl-row">
          <span className="ctrl-lbl">Jan</span>
          <input type="range" id="av-sl" min="0" max="11" defaultValue="0" ref={sliderRef} />
          <span className="ctrl-lbl">Dec</span>
          <span className="av-mo" id="av-mo" ref={moRef}>
            Jan
          </span>
        </div>
      </div>
    </section>
  );
}

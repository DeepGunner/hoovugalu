import React, { useEffect, useRef, useState } from 'react';
import { SP, hexRgb } from '../data/bloom.js';

const SEASONS = [
  {
    label: 'Winter Arrival',
    months: 'December — February',
    monthIdx: [11, 0, 1],
    ids: ['BAU', 'ERY', 'SLV'],
    note: 'Bauhinia pale mauve closes the year as Erythrina coral opens it — blooming on bare branches before leaves return.',
  },
  {
    label: 'Spring Chord',
    months: 'February — April',
    monthIdx: [1, 2, 3],
    ids: ['ERY', 'JAC', 'TAB', 'SLV'],
    note: "Bangalore's most celebrated palette: coral yields to blue-mauve Jacaranda while pink Tabebuia rises against it. Placed to flower simultaneously on the same avenues.",
  },
  {
    label: 'Summer Handoff',
    months: 'April — June',
    monthIdx: [3, 4, 5],
    ids: ['JAC', 'AML', 'GUL', 'SLV'],
    note: 'Jacaranda fades as Amaltas gold cascades in. Gulmohar flame takes over entirely — the loudest, most vivid transition in the calendar.',
  },
  {
    label: 'Monsoon Hold',
    months: 'June — September',
    monthIdx: [5, 6, 7, 8],
    ids: ['GUL', 'POI', 'COL', 'SLV'],
    note: "Gulmohar yields to Pride of India's purple-pink, which holds the streets through the rains. Colvillea orange-red arrives as Gulmohar fades.",
  },
  {
    label: "Year's End",
    months: 'October — December',
    monthIdx: [9, 10, 11],
    ids: ['COL', 'TAB', 'BAU', 'SLV'],
    note: 'Colvillea steps back. Tabebuia pink returns. Bauhinia mauve closes the year in quiet.',
  },
];

export default function Viz03Season({ isActive = true }) {
  const dispRef = useRef(null);
  const stateRef = useRef({ canvas: null, offCurr: null, offNext: null, raf: null, panelTid: null });
  const seasonIdxRef = useRef(0);
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [spList, setSpList] = useState([]);

  useEffect(() => {
    const _v3 = stateRef.current;
    if (!isActive && _v3.raf) {
      // Cancel mid-flight transition; renderSeason(idx, true) snaps to current state next time.
      cancelAnimationFrame(_v3.raf);
      _v3.raf = null;
    }
  }, [isActive]);

  useEffect(() => {
    const disp = dispRef.current;
    const _v3 = stateRef.current;

    function _v3Init() {
      if (_v3.canvas) return;
      disp.innerHTML = '';
      const c = document.createElement('canvas');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
      disp.appendChild(c);
      _v3.canvas = c;
      _v3.offCurr = document.createElement('canvas');
      _v3.offNext = document.createElement('canvas');
    }

    function _v3Paint(cv, weighted, totalW) {
      const W = disp.clientWidth || 640;
      const H = disp.clientHeight || 220;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bands = [];
      let bx = 0;
      weighted.forEach(({ sp, w }) => {
        bands.push({ sp, x: bx, w: (w / totalW) * W });
        bx += (w / totalW) * W;
      });

      const clp = (v) => Math.max(0, Math.min(0.9999, v));
      function wcMid(c1, c2) {
        const a = hexRgb(c1),
          b = hexRgb(c2),
          L = 0.26,
          WR = 240,
          WG = 226,
          WB = 210;
        return `rgb(${Math.round(((a.r + b.r) / 2) * (1 - L) + WR * L)},${Math.round(
          ((a.g + b.g) / 2) * (1 - L) + WG * L
        )},${Math.round(((a.b + b.b) / 2) * (1 - L) + WB * L)})`;
      }
      function pass(fade, alpha) {
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, bands[0].sp.c);
        bands.forEach(({ sp, x, w }, i) => {
          const p = x / W,
            e = (x + w) / W,
            sS = clp(p + (e - p) * fade),
            sE = clp(e - (e - p) * fade);
          g.addColorStop(sS, sp.c);
          if (i < bands.length - 1) {
            g.addColorStop(sE, sp.c);
            const nS = clp(bands[i + 1].x / W + (bands[i + 1].w / W) * fade);
            g.addColorStop(clp((sE + nS) / 2), wcMid(sp.c, bands[i + 1].sp.c));
          }
        });
        g.addColorStop(1, bands[bands.length - 1].sp.c);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      pass(0.40, 1.0);
      pass(0.54, 0.42);
      pass(0.22, 0.2);

      for (let i = 0; i < 2800; i++) {
        ctx.fillStyle = `rgba(100,78,48,${((i * 73.9) % 1) * 0.018 + 0.004})`;
        ctx.fillRect(((i * 127.1) % W + W) % W, ((i * 311.7) % H + H) % H, 0.85, 0.85);
      }
      const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.65);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(20,12,4,.14)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
      const lum = ctx.createLinearGradient(0, 0, 0, H);
      lum.addColorStop(0, 'rgba(255,248,238,.18)');
      lum.addColorStop(0.42, 'rgba(255,248,238,0)');
      lum.addColorStop(1, 'rgba(8,4,0,.08)');
      ctx.fillStyle = lum;
      ctx.fillRect(0, 0, W, H);
    }

    function renderSeason(idx, instant, dir) {
      _v3Init();
      const s = SEASONS[idx];
      const list = s.ids.map((id) => SP.find((sp) => sp.id === id));
      const weighted = list.map((sp) => ({
        sp,
        w: Math.max(s.monthIdx.reduce((sum, mi) => sum + sp.bloom[mi], 0) / s.monthIdx.length, 8),
      }));
      const totalW = weighted.reduce((t, { w }) => t + w, 0);

      // Update React state for panel
      setSeasonIdx(idx);
      setSpList(list);

      if (instant) {
        requestAnimationFrame(() => {
          _v3Paint(_v3.canvas, weighted, totalW);
          const W = disp.clientWidth || 640,
            H = disp.clientHeight || 220;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const PW = Math.round(W * dpr),
            PH = Math.round(H * dpr);
          _v3.offCurr.width = PW;
          _v3.offCurr.height = PH;
          _v3.offCurr.getContext('2d').drawImage(_v3.canvas, 0, 0, PW, PH);
        });
        return;
      }

      if (_v3.raf) {
        cancelAnimationFrame(_v3.raf);
        _v3.raf = null;
      }

      requestAnimationFrame(() => {
        const W = disp.clientWidth || 640,
          H = disp.clientHeight || 220;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const PW = Math.round(W * dpr),
          PH = Math.round(H * dpr);

        if (_v3.offCurr.width !== PW || _v3.offCurr.height !== PH) {
          _v3.offCurr.width = PW;
          _v3.offCurr.height = PH;
        }
        _v3.offCurr.getContext('2d').drawImage(_v3.canvas, 0, 0, PW, PH);
        _v3Paint(_v3.offNext, weighted, totalW);

        if (_v3.canvas.width !== PW || _v3.canvas.height !== PH) {
          _v3.canvas.width = PW;
          _v3.canvas.height = PH;
          _v3.canvas.getContext('2d').drawImage(_v3.offCurr, 0, 0, PW, PH);
        }

        const DUR = 1600;
        const SIGN = dir >= 0 ? 1 : -1;
        const t0 = performance.now();
        function frame(now) {
          const raw = Math.min((now - t0) / DUR, 1);
          const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
          const ctx = _v3.canvas.getContext('2d');
          ctx.drawImage(_v3.offCurr, 0, 0, PW, PH);
          const dx = SIGN * PW * (1 - t);
          ctx.drawImage(_v3.offNext, dx, 0, PW, PH);
          if (raw < 1) {
            _v3.raf = requestAnimationFrame(frame);
          } else {
            _v3.offCurr.getContext('2d').drawImage(_v3.offNext, 0, 0, PW, PH);
            _v3.raf = null;
          }
        }
        _v3.raf = requestAnimationFrame(frame);
      });
    }

    // Expose nav functions on the ref
    _v3.nav = (d) => {
      seasonIdxRef.current = (seasonIdxRef.current + d + SEASONS.length) % SEASONS.length;
      renderSeason(seasonIdxRef.current, false, d);
    };
    _v3.navTo = (i) => {
      if (i === seasonIdxRef.current) return;
      const d = i > seasonIdxRef.current ? 1 : -1;
      seasonIdxRef.current = i;
      renderSeason(i, false, d);
    };

    // Initial render
    renderSeason(0, true);

    return () => {
      if (_v3.raf) cancelAnimationFrame(_v3.raf);
      if (_v3.panelTid) clearTimeout(_v3.panelTid);
    };
  }, []);

  const s = SEASONS[seasonIdx];

  return (
    <section className="vs" id="v3">
      <div className="vs-num" data-n="03">The Season</div>
      <h2 className="vs-title">Every season is a full palette.</h2>
      <div className="vs-frame">
        <div
          className="ch-display"
          id="ch-disp"
          ref={dispRef}
          onClick={() => stateRef.current.nav && stateRef.current.nav(1)}
          title="Click to advance"
        />
        <div
          id="ch-info-panel"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            padding: '12px 22px 14px',
            background: 'rgba(245,240,231,.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            borderTop: '.5px solid rgba(255,255,255,.40)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              id="ch-slabel"
              style={{
                font: "300 italic 20px/1.2 'Cormorant Garamond', serif",
                color: 'var(--ink)',
                marginBottom: 3,
              }}
            >
              {s.label}
            </div>
            <div
              id="ch-smonths"
              style={{
                font: "9px 'Space Mono', monospace",
                letterSpacing: '.06em',
                color: 'var(--ink2)',
                marginBottom: 7,
              }}
            >
              {s.months}
            </div>
            <div
              id="ch-snote"
              style={{
                font: "300 italic 12px/1.55 'Cormorant Garamond', serif",
                color: 'var(--ink2)',
              }}
            >
              {s.note}
            </div>
          </div>
          <div
            id="ch-sdots"
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 14,
              alignItems: 'center',
              flexShrink: 0,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              maxWidth: '60%',
            }}
          >
            {spList.map((sp) =>
              sp ? (
                <span key={sp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: sp.c,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      font: "9px 'Space Mono', monospace",
                      color: 'var(--ink2)',
                      letterSpacing: '.04em',
                    }}
                  >
                    {sp.id}
                  </span>
                </span>
              ) : null
            )}
          </div>
        </div>
        <div className="ch-nav">
          <button
            className="ch-btn"
            onClick={() => stateRef.current.nav && stateRef.current.nav(-1)}
            aria-label="Previous"
          >
            ←
          </button>
          <span className="ch-info" id="ch-info">
            {seasonIdx + 1} of {SEASONS.length}
          </span>
          <div className="ch-dots" id="ch-dots">
            {SEASONS.map((_, i) => (
              <div
                key={i}
                className={`ch-dot${i === seasonIdx ? ' on' : ''}`}
                onClick={() => stateRef.current.navTo && stateRef.current.navTo(i)}
              />
            ))}
          </div>
          <button
            className="ch-btn"
            onClick={() => stateRef.current.nav && stateRef.current.nav(1)}
            aria-label="Next"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useRef } from 'react';
import { SP, M_LONG, M_SHORT, rgba } from '../data/bloom.js';

export default function Viz07Year({ isActive = true }) {
  const gridRef = useRef(null);
  const redrawRef = useRef(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Build 12 canvas cells inside the grid
    const cvs = M_LONG.map((mo, m) => {
      const cell = document.createElement('div');
      cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;';
      const cv = document.createElement('canvas');
      cv.style.cssText = 'display:block;width:100%;cursor:default;';
      cv.title = mo;
      cell.appendChild(cv);
      grid.appendChild(cell);
      return { cv, m };
    });

    function drawAll() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.forEach(({ cv, m }) => {
        const W = cv.parentElement.clientWidth || 80;
        const H = Math.round(W * 1.28);
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        cv.style.height = H + 'px';
        const ctx = cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const cx = W / 2,
          cy = H * 0.44;
        const R = Math.min(W, H * 0.88) * 0.40;
        const iR = R * 0.16;
        const N = SP.length;
        const GAP = 0.07;
        const sAng = (2 * Math.PI) / N - GAP;

        ctx.beginPath();
        ctx.arc(cx, cy, R + 7, 0, Math.PI * 2);
        ctx.fillStyle = '#F6F2EA';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(90,78,58,0.22)';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(90,78,58,0.30)';
        ctx.lineWidth = 0.5;
        for (let t = 0; t < 12; t++) {
          const ta = (t / 12) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(cx + (R + 4) * Math.cos(ta), cy + (R + 4) * Math.sin(ta));
          ctx.lineTo(cx + (R + 7) * Math.cos(ta), cy + (R + 7) * Math.sin(ta));
          ctx.stroke();
        }

        SP.forEach((sp, i) => {
          const v = sp.bloom[m] / 100;
          const a0 = (i / N) * Math.PI * 2 - Math.PI / 2 + GAP / 2;
          const a1 = a0 + sAng;
          const oR = iR + v * (R - iR);
          if (oR <= iR + 1.5) return;
          const spacing = Math.max(1.2, 3.8 - v * 2.8);
          const al = sp.id === 'SLV' ? 0.52 : 0.72 + v * 0.20;
          ctx.strokeStyle = rgba(sp.c, al);
          ctx.lineWidth = 0.55;
          for (let r2 = iR + spacing * 0.7; r2 < oR; r2 += spacing) {
            ctx.beginPath();
            ctx.arc(cx, cy, r2, a0, a1);
            ctx.stroke();
          }
          ctx.strokeStyle = rgba(sp.c, al * 0.4);
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.arc(cx, cy, oR, a0, a1);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, iR, a0, a1);
          ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(cx, cy, iR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = '#DED6C4';
        ctx.fill();

        ctx.font = `bold 9px 'Space Mono',monospace`;
        ctx.fillStyle = 'rgba(52,40,20,.58)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(M_SHORT[m].toUpperCase(), cx, cy + R + 14);
      });
    }

    drawAll();
    redrawRef.current = drawAll;
    let rT;
    const onResize = () => {
      clearTimeout(rT);
      rT = setTimeout(drawAll, 180);
    };
    window.addEventListener('resize', onResize);

    return () => {
      redrawRef.current = null;
      window.removeEventListener('resize', onResize);
      clearTimeout(rT);
      // Clean up appended canvases
      while (grid.firstChild) grid.removeChild(grid.firstChild);
    };
  }, []);

  useEffect(() => {
    // Static viz — redraw on activation in case the grid was sized incorrectly
    // (zero width) at mount time or the viewport changed while inactive.
    if (isActive && redrawRef.current) redrawRef.current();
  }, [isActive]);

  return (
    <section className="vs" id="v7">
      <div className="vs-num" data-n="07">The Year</div>
      <h2 className="vs-title">Twelve months, one rotation each.</h2>
      <p className="vs-desc">
        Each wheel is one month. The nine species radiate outward from the centre — the further a colour reaches, the more intensely it blooms. Read January to December left to right, row by row.
      </p>
      <div className="vs-frame" style={{ padding: '20px 18px 16px' }}>
        <div
          id="cy-grid"
          ref={gridRef}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '14px 10px' }}
        />
        <div
          id="cy-leg"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px 14px',
            marginTop: 14,
            paddingTop: 12,
            borderTop: '.5px solid var(--rule)',
          }}
        >
          {SP.map((sp) => (
            <span key={sp.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: sp.c,
                  flexShrink: 0,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  font: "9px 'Space Mono',monospace",
                  color: 'var(--ink2)',
                  letterSpacing: '.04em',
                }}
              >
                {sp.id} — {sp.name}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

import React, { useState, useRef } from 'react';
import { SP, M_INIT, M_LONG, rgba } from '../data/bloom.js';

export default function Viz05Score(/* { isActive } — no RAF/audio to gate */) {
  const [tip, setTip] = useState({ visible: false, x: 0, y: 0, text: '' });

  const showTip = (e, sp, mi, v) => {
    setTip({
      visible: true,
      x: e.clientX + 14,
      y: e.clientY - 34,
      text: `${sp.name} · ${M_LONG[mi]} · ${v}%`,
    });
  };
  const moveTip = (e) => {
    setTip((t) => ({ ...t, x: e.clientX + 14, y: e.clientY - 34 }));
  };
  const hideTip = () => setTip((t) => ({ ...t, visible: false }));

  return (
    <section className="vs" id="v5">
      <div className="vs-num" data-n="05">The Score</div>
      <h2 className="vs-title">Read the composition.</h2>
      <p className="vs-desc">
        Each row is a species, each column a month. Intensity of colour = intensity of bloom. Silver Oak — the permanent canopy — runs across the top in every column. Hover any cell to read it.
      </p>
      <div className="vs-frame">
        <div className="canopy-strip"></div>
        <div className="sc-wrap">
          <table className="sc-tbl" id="sc-tbl">
            <thead>
              <tr>
                <th className="sc-rl"></th>
                {M_INIT.map((m, i) => (
                  <th key={i}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SP.map((sp) => {
                const isSLV = sp.id === 'SLV';
                return (
                  <tr key={sp.id}>
                    <th
                      className="sc-rl"
                      style={{
                        color: sp.c,
                        ...(isSLV ? { fontStyle: 'italic' } : {}),
                      }}
                    >
                      {sp.id}
                    </th>
                    {sp.bloom.map((v, mi) => {
                      const a = isSLV ? 0.22 + (v / 100) * 0.55 : 0.07 + (v / 100) * 0.89;
                      return (
                        <td key={mi}>
                          <div
                            className="sc-cell"
                            style={{ background: rgba(sp.c, a) }}
                            onMouseEnter={(e) => showTip(e, sp, mi, v)}
                            onMouseMove={moveTip}
                            onMouseLeave={hideTip}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Tooltip — fixed positioned, follows cursor */}
      <div
        style={{
          position: 'fixed',
          left: tip.x,
          top: tip.y,
          opacity: tip.visible ? 1 : 0,
          pointerEvents: 'none',
          font: "10px 'Space Mono', monospace",
          letterSpacing: '.05em',
          color: '#2A2520',
          background: 'rgba(245,240,231,0.95)',
          padding: '6px 10px',
          border: '.5px solid rgba(0,0,0,.15)',
          transition: 'opacity .15s',
          zIndex: 1000,
        }}
      >
        {tip.text}
      </div>
    </section>
  );
}

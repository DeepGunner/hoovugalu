import React, { useEffect, useRef } from 'react';
import { SP, M_INIT, M_SHORT } from '../data/bloom.js';

export default function Viz02Wordmark(/* { isActive } — no RAF/audio to gate */) {
  const gridRef = useRef(null);
  const legendRef = useRef(null);

  useEffect(() => {
    const grid = gridRef.current;
    const legend = legendRef.current;
    if (!grid || !legend) return;

    const SHOW = ['SLV', 'ERY', 'JAC', 'TAB', 'AML', 'GUL', 'POI'];
    const COMMON = {
      SLV: 'Silver Oak',
      ERY: 'Erythrina',
      JAC: 'Jacaranda',
      TAB: 'Pink Trumpet',
      AML: 'Golden Shower',
      GUL: 'Gulmohar',
      POI: 'Pride of India',
    };

    const MONTH_DATA = [
      [{ id: 'ERY', w: 4 }, { id: 'SLV', w: 2 }],
      [{ id: 'ERY', w: 3 }, { id: 'JAC', w: 3 }, { id: 'SLV', w: 1 }],
      [{ id: 'JAC', w: 5 }, { id: 'TAB', w: 2 }, { id: 'SLV', w: 1 }],
      [{ id: 'JAC', w: 4 }, { id: 'TAB', w: 2 }, { id: 'AML', w: 1 }, { id: 'GUL', w: 1 }, { id: 'SLV', w: 1 }],
      [{ id: 'TAB', w: 3 }, { id: 'AML', w: 3 }, { id: 'GUL', w: 2 }, { id: 'SLV', w: 1 }],
      [{ id: 'POI', w: 5 }, { id: 'GUL', w: 2 }, { id: 'SLV', w: 1 }],
      [{ id: 'POI', w: 6 }, { id: 'SLV', w: 1 }],
      [{ id: 'POI', w: 5 }, { id: 'AML', w: 2 }, { id: 'SLV', w: 1 }],
      [{ id: 'POI', w: 5 }, { id: 'AML', w: 2 }, { id: 'SLV', w: 1 }],
      [{ id: 'POI', w: 3 }, { id: 'AML', w: 2 }, { id: 'GUL', w: 2 }, { id: 'SLV', w: 1 }],
      [{ id: 'POI', w: 3 }, { id: 'TAB', w: 3 }, { id: 'SLV', w: 1 }],
      [{ id: 'TAB', w: 4 }, { id: 'POI', w: 1 }, { id: 'SLV', w: 2 }],
    ];

    const getSP = (id) => SP.find((s) => s.id === id) || { id, c: '#888', bloom: Array(12).fill(0) };

    // Build month cells
    M_INIT.forEach((mn, mi) => {
      const cell = document.createElement('div');
      cell.className = 'typ-cell';
      let html = `<div class="typ-month">${M_SHORT[mi]}</div><div class="typ-body">`;
      const data = MONTH_DATA[mi];

      data.forEach((entry, ei) => {
        if (entry.id === 'SLV') return;
        const sp = getSP(entry.id);
        const nm = COMMON[entry.id].toUpperCase();
        const w = entry.w;
        const tot = data.filter((d) => d.id !== 'SLV').reduce((s, d) => s + d.w, 0);
        const frac = w / tot;

        if (ei === 0 || (w === data[0].w && ei <= 1)) {
          const sz1 = Math.round(18 + frac * 14);
          const sz2 = Math.round(sz1 * 0.72);
          const sz3 = Math.round(sz1 * 0.52);
          const reps1 = Math.max(2, Math.round(frac * 5));
          const reps2 = Math.max(2, Math.round(frac * 6));
          const reps3 = Math.max(3, Math.round(frac * 8));
          for (let r = 0; r < reps1; r++)
            html += `<span class="sp-name sz1" data-sp="${sp.id}" style="font-size:${sz1 - r}px;--sp-c:${sp.c}">${nm} </span>`;
          for (let r = 0; r < reps2; r++)
            html += `<span class="sp-name sz2" data-sp="${sp.id}" style="font-size:${sz2}px;--sp-c:${sp.c}">${nm} </span>`;
          for (let r = 0; r < reps3; r++)
            html += `<span class="sp-name sz3" data-sp="${sp.id}" style="font-size:${sz3}px;--sp-c:${sp.c}">${nm} </span>`;
        } else {
          const sz = Math.round(9 + frac * 18);
          const reps = Math.max(2, Math.round(frac * 7));
          for (let r = 0; r < reps; r++)
            html += `<span class="sp-name sz3" data-sp="${sp.id}" style="font-size:${sz}px;--sp-c:${sp.c}">${nm} </span>`;
        }
        const tReps = Math.max(3, Math.round(frac * 10));
        const tsz = Math.round(6 + frac * 5);
        for (let r = 0; r < tReps; r++)
          html += `<span class="sp-name sz4" data-sp="${sp.id}" style="font-size:${tsz}px;--sp-c:${sp.c}">${nm} </span>`;
      });

      html += `<span class="sp-name slv" data-sp="SLV" style="--sp-c:${getSP('SLV').c}">`;
      html += 'silver oak silver oak silver oak silver oak silver oak ';
      html += `</span>`;
      html += '</div>';
      cell.innerHTML = html;
      grid.appendChild(cell);
    });

    // Legend
    let lockedSp = null;
    const listeners = [];

    SHOW.forEach((id) => {
      const sp = getSP(id);
      const item = document.createElement('div');
      item.className = 'typ-leg-item';
      item.setAttribute('data-sp', id);
      item.style.setProperty('--sp-c2', sp.c);
      item.innerHTML = `<span class="typ-leg-dot" style="background:${sp.c}"></span>${COMMON[id]}`;

      const onEnter = () => {
        if (lockedSp) return;
        hlSpecies(id);
      };
      const onLeave = () => {
        if (lockedSp) return;
        clearHl();
      };
      const onClick = () => {
        if (lockedSp === id) {
          lockedSp = null;
          legend.querySelectorAll('.typ-leg-item.locked').forEach((el) => el.classList.remove('locked'));
          clearHl();
        } else {
          lockedSp = id;
          legend.querySelectorAll('.typ-leg-item.locked').forEach((el) => el.classList.remove('locked'));
          item.classList.add('locked');
          clearHl();
          hlSpecies(id);
        }
      };
      item.addEventListener('mouseenter', onEnter);
      item.addEventListener('mouseleave', onLeave);
      item.addEventListener('click', onClick);
      listeners.push({ item, onEnter, onLeave, onClick });
      legend.appendChild(item);
    });

    function hlSpecies(id) {
      grid.classList.add('has-hl');
      grid.querySelectorAll(`.sp-name[data-sp="${id}"]`).forEach((el) => {
        el.classList.add(lockedSp ? 'hl-lock' : 'hl');
      });
    }
    function clearHl() {
      grid.classList.remove('has-hl');
      grid.querySelectorAll('.sp-name.hl,.sp-name.hl-lock').forEach((el) => {
        el.classList.remove('hl', 'hl-lock');
      });
      if (lockedSp) hlSpecies(lockedSp);
    }

    const tId = setTimeout(() => {
      const jacItem = legend.querySelector('[data-sp="JAC"]');
      if (jacItem) {
        lockedSp = 'JAC';
        jacItem.classList.add('locked');
        hlSpecies('JAC');
      }
    }, 120);

    return () => {
      clearTimeout(tId);
      listeners.forEach(({ item, onEnter, onLeave, onClick }) => {
        item.removeEventListener('mouseenter', onEnter);
        item.removeEventListener('mouseleave', onLeave);
        item.removeEventListener('click', onClick);
      });
      while (grid.firstChild) grid.removeChild(grid.firstChild);
      while (legend.firstChild) legend.removeChild(legend.firstChild);
    };
  }, []);

  return (
    <section className="vs" id="v2">
      <div className="vs-num" data-n="02">The Wordmark</div>
      <h2 className="vs-title">Read the calendar.</h2>
      <p className="vs-desc">
        Each month as dense type. Names repeat and scale by bloom intensity — the louder the bloom, the heavier the word. Hover or click a species to see it across the year.
      </p>
      <div className="vs-frame">
        <div className="typ-grid" id="typ-grid" ref={gridRef} />
        <div className="typ-legend" id="typ-legend" ref={legendRef} />
      </div>
    </section>
  );
}

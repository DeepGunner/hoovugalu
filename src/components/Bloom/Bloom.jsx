import React, { useEffect, useMemo, useState } from 'react';
import styles from './Bloom.module.css';
import { SPECIES, ARCHITECTS, MONTHS, MONTH_START, MONTH_END } from './data.js';
import OrganicWheel from './OrganicWheel.jsx';

// Pre-compute a hand-drawn wobbly circle path (in a 100x100 viewBox) so the
// aura's edge reads as ink-on-paper rather than a CAD circle. Scalloped via
// two superimposed sine waves; static path is fine — the aura still breathes
// via CSS scale.
const WOBBLY_AURA_PATH = (() => {
  const cx = 50, cy = 50, r = 50;
  const steps = 240;
  const ampMain = 0.9;   // softened scallop depth
  const ampFine = 0.25;  // very subtle quiver
  const freqMain = 7;    // fewer, broader undulations (was 14 — gear-like)
  const freqFine = 17;
  const phaseA = 0.7, phaseB = 2.1;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const wob =
      Math.sin(a * freqMain + phaseA) * ampMain +
      Math.sin(a * freqFine + phaseB) * ampFine;
    const rr = r + wob;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
  }
  return d + 'Z';
})();

const PAGE_ARCHITECTS = ARCHITECTS.filter(
  (a) => a.id === 'krumbiegel' || a.id === 'oudolf'
);

function bloomsInMonth(sp, m) {
  const startD = MONTH_START[m];
  const endD = MONTH_END[m];
  if (!sp.windows) return false;
  return sp.windows.some((w) => endD >= w.start && startD <= w.end);
}

function TickerStrip({ mode, monthIdx, species, onResume }) {
  const slv = species.find((s) => s.role === 'Permanent Canopy');
  const flowering = species.filter(
    (s) => s.role !== 'Permanent Canopy' && bloomsInMonth(s, monthIdx)
  );
  const blooming = slv ? [slv, ...flowering] : flowering;
  const isPaused = mode === 'paused';
  const monthStr = MONTHS[monthIdx].toLowerCase();
  return (
    <div
      className={`${styles.ticker} ${isPaused ? styles.tickerPaused : styles.tickerAuto}`}
      aria-live="polite"
    >
      <div className={styles.tickerHeader}>
        <span className={styles.tickerCmd}>bloom --month={monthStr}</span>
        <span className={styles.tickerCount}>
          // {blooming.length} in bloom
        </span>
        {isPaused ? (
          <button
            type="button"
            className={styles.tickerClose}
            onClick={onResume}
            aria-label="Resume rotation"
          >
            ×
          </button>
        ) : (
          <span className={styles.tickerCursor} aria-hidden="true">▌</span>
        )}
      </div>
      <div className={styles.tickerNames} key={`${monthIdx}-${mode}`}>
        {blooming.length === 0 ? (
          <span className={styles.tickerEmpty}>→ silver oak only</span>
        ) : (
          blooming.map((s, i) => (
            <span key={s.id} className={styles.tickerName} style={{ animationDelay: `${i * 90}ms` }}>
              <span className={styles.tickerDot} style={{ background: s.color }} aria-hidden="true" />
              {s.common}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

export default function Bloom() {
  const [architect, setArchitect] = useState('krumbiegel');
  const [mode, setMode] = useState('auto'); // 'auto' | 'paused'
  const [month, setMonth] = useState(0);    // current rotation pointer

  // Auto-advance month every 2.6s while in 'auto'
  useEffect(() => {
    if (mode !== 'auto') return;
    const id = setInterval(() => {
      setMonth((m) => (m + 1) % 12);
    }, 2600);
    return () => clearInterval(id);
  }, [mode]);

  const species = useMemo(() => {
    if (architect === 'sackville-west') {
      // Chromatic Narrative — restrained pink/violet lineage
      return SPECIES.filter((s) => ['slv', 'tab', 'poi', 'jac'].includes(s.id));
    }
    if (architect === 'oudolf') {
      // Structural Lifecycle — naturalistic painted-meadow palette
      return SPECIES.filter((s) => ['slv', 'jac', 'aml', 'gul', 'poi', 'pel'].includes(s.id));
    }
    // Civic Succession — all 10 Issar species
    return SPECIES;
  }, [architect]);

  const focusMonth = month;
  // Info panel — flowering only (Silver Oak is a structural constant)
  const focusBloomers = useMemo(() => {
    if (focusMonth == null) return [];
    return species.filter((s) => s.role !== 'Permanent Canopy' && bloomsInMonth(s, focusMonth));
  }, [focusMonth, species]);
  // Gradient — includes Silver Oak so the evergreen green is always part of
  // the wash, plus every flowering species in bloom that month
  const focusGradient = useMemo(() => {
    if (focusMonth == null) return [];
    const slv = species.find((s) => s.role === 'Permanent Canopy');
    const bloomers = species.filter(
      (s) => s.role !== 'Permanent Canopy' && bloomsInMonth(s, focusMonth)
    );
    return slv ? [...bloomers, slv] : bloomers;
  }, [focusMonth, species]);

  // Smooth viewport-spanning wash positioned toward the focused month.
  // A single large radial gradient with multiple species color stops fades
  // outward into the cream background, producing one continuous wash rather
  // than separate blobs in corners.
  const baseBg = '#F8F5EE';
  const stageBg = useMemo(() => {
    if (focusGradient.length === 0) return baseBg;
    const baseAng = ((focusMonth + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
    const distance = 45;
    const cx = 50 + distance * Math.cos(baseAng);
    const cy = 55 + distance * Math.sin(baseAng);
    // Vivid stops: bright at the centre, slowly fading to a faint tint at
    // the far edge — matching the saturation of the Soundscape / Loop pages.
    const n = focusGradient.length;
    const stops = focusGradient
      .map((s, i) => {
        const u = i / Math.max(n - 1, 1);
        const r = 4 + u * 86; // 4% .. 90%
        // Alpha tapers from ~95% near the centre to ~55% near the edge
        const a = Math.round((0.95 - u * 0.40) * 255).toString(16).padStart(2, '0');
        return `${s.color}${a} ${r.toFixed(1)}%`;
      })
      .join(', ');
    return `radial-gradient(circle at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, ${stops}, ${baseBg} 130%)`;
  }, [focusGradient, focusMonth]);

  return (
    <main className={styles.main}>
      <section className={`${styles.header} bloom-header`}>
        <p className="vs-num">Bloom Calendar</p>
        <h1 className="vs-title">The year-long ritusamhara</h1>
        <p className="vs-desc">
          Tap and sweep around the dial to focus on each month and track the city's overlapping canopy handoff.
        </p>
      </section>

      <section className={styles.stage} style={{ background: stageBg }}>
        <div className={styles.stageInner}>
          <aside className={styles.leftPanel}>
            <nav
              className={styles.pills}
              aria-label="Garden philosophies"
              style={{ '--pill-idx': PAGE_ARCHITECTS.findIndex((a) => a.id === architect) }}
            >
              <span className={styles.pillThumb} aria-hidden="true" />
              {PAGE_ARCHITECTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`${styles.pill} ${architect === a.id ? styles.pillActive : ''}`}
                  onClick={() => { setArchitect(a.id); setMonth(0); setMode('auto'); }}
                >
                  {a.name.split(' ').slice(-1)[0]}
                </button>
              ))}
            </nav>
            <TickerStrip
              mode={mode}
              monthIdx={month}
              species={species}
              onResume={() => setMode('auto')}
            />
          </aside>
          <div className={styles.rightPanel}>
            <div className={styles.wheelHolder}>
              <svg
                width="0"
                height="0"
                style={{ position: 'absolute' }}
                aria-hidden="true"
              >
                <defs>
                  <clipPath id="auraWobblyClip" clipPathUnits="objectBoundingBox">
                    <path d={WOBBLY_AURA_PATH} transform="scale(0.01)" />
                  </clipPath>
                </defs>
              </svg>
              <div className={styles.wheelAura} aria-hidden="true" />
              <OrganicWheel
                species={species}
                selectedMonth={month}
                onPickMonth={(m) => { setMode('paused'); setMonth(m); }}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

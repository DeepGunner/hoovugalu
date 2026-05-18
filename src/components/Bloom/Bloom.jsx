import React, { useId, useMemo, useState } from 'react';
import styles from './Bloom.module.css';
import {
  SPECIES, ARCHITECTS, SEASONS, COLOR_FAMILY, FAMILY_SWATCH, MONTHS, YEAR_DAYS,
} from './data.js';
import {
  arcPath, curvedLabelPath, splitRange, doyAngle, toHex2,
  sampleBloomArcs, monthBloomIntensity, symphonySet, activeMonthSet, filteredSpecies,
} from './bloomMath.js';

/* ─────────────────────────────────────────────────────────────────────────
   Wheel — large SVG rendering all rings, seasons, months, species arcs,
   convergence callout, and the inner disc.
   ───────────────────────────────────────────────────────────────────────── */
function Wheel({ species, selected, architect, active, onPick }) {
  const uid = useId().replace(/:/g, '');
  const size = 720, cx = size / 2, cy = size / 2;
  const ringOuter = 320, ringInner = 165;
  const seasonRingIn = 110, seasonRingOut = 132;
  const monthRingIn = 135, monthRingOut = 155;
  const discRadius = 106;

  const burleMarx = architect === 'burle-marx';
  const isDark = burleMarx;
  const blooming = species.filter((s) => s.role !== 'Permanent Canopy');
  const evergreen = species.find((s) => s.role === 'Permanent Canopy');
  const bandH = (ringOuter - ringInner) / Math.max(blooming.length, 1);
  const symphony = symphonySet(selected, species);
  const activeMonths = activeMonthSet(selected);
  const highlightConv = architect === 'krumbiegel';

  return (
    <div className={styles.wheelWrap}>
      <svg viewBox={`-30 -30 ${size + 60} ${size + 60}`}>
        {/* Evergreen backdrop */}
        {evergreen && (
          <circle cx={cx} cy={cy} r={ringOuter + 6} fill={evergreen.color} opacity={isDark ? 0.1 : 0.06} />
        )}

        {/* textPath definitions for curved labels */}
        <defs>
          {SEASONS.map((s) => {
            const sd = (s.startMonth / 12) * YEAR_DAYS;
            const ed = ((s.endMonth + 1) / 12) * YEAR_DAYS - 1;
            let sa = doyAngle(sd), ea = doyAngle(ed);
            if (ea < sa) ea += Math.PI * 2;
            const lr = (seasonRingIn + seasonRingOut) / 2;
            return (
              <path
                key={s.id}
                id={`${uid}-season-${s.id}`}
                d={curvedLabelPath(cx, cy, lr, sa, ea)}
                fill="none"
              />
            );
          })}
          {MONTHS.map((mo, i) => {
            const sd = (i / 12) * YEAR_DAYS;
            const ed = ((i + 1) / 12) * YEAR_DAYS - 1;
            const sa = doyAngle(sd), ea = doyAngle(ed);
            const lr = (monthRingIn + monthRingOut) / 2;
            return (
              <path
                key={mo}
                id={`${uid}-month-${mo}`}
                d={curvedLabelPath(cx, cy, lr, sa, ea)}
                fill="none"
              />
            );
          })}
        </defs>

        {/* Season fills + curved labels */}
        {SEASONS.map((s) => {
          const sd = (s.startMonth / 12) * YEAR_DAYS;
          const ed = ((s.endMonth + 1) / 12) * YEAR_DAYS - 1;
          const segs = splitRange(sd, ed);
          return (
            <g key={s.id}>
              {segs.map(([a, b], i) => (
                <g key={i}>
                  <path
                    d={arcPath(cx, cy, seasonRingIn, seasonRingOut, doyAngle(a), doyAngle(b))}
                    fill={isDark ? 'rgba(255,255,255,0.05)' : '#F2EDE2'}
                  />
                  <path
                    d={arcPath(cx, cy, seasonRingIn, seasonRingIn + 0.6, doyAngle(a), doyAngle(b))}
                    fill={isDark ? 'rgba(255,255,255,0.18)' : '#D8CFBE'}
                  />
                </g>
              ))}
              <text
                fontSize="9"
                fill={isDark ? '#C2CBD3' : '#6B6460'}
                fontFamily="Cormorant Garamond, serif"
                fontStyle="italic"
                letterSpacing="0.30em"
              >
                <textPath href={`#${uid}-season-${s.id}`} startOffset="50%" textAnchor="middle">
                  {s.name.toUpperCase()}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* Month ring (with pop highlighting when a species is selected) */}
        {MONTHS.map((mo, i) => {
          const sd = (i / 12) * YEAR_DAYS;
          const ed = ((i + 1) / 12) * YEAR_DAYS - 1;
          const sa = doyAngle(sd), ea = doyAngle(ed);
          const isPopped = activeMonths ? activeMonths.has(i) : false;
          const popColor = selected ? selected.color : '#100F0C';
          const groupOpacity = activeMonths && !isPopped ? 0.35 : 1;
          return (
            <g key={mo} style={{ opacity: groupOpacity, transition: 'opacity 220ms' }}>
              <path
                d={arcPath(cx, cy, monthRingIn, monthRingOut, sa, ea)}
                fill={isPopped ? popColor : (isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF')}
                opacity={isPopped ? (isDark ? 0.42 : 0.30) : (isDark ? 1 : 0.55)}
              />
              <path
                d={arcPath(cx, cy, monthRingIn, monthRingIn + 0.6, sa, ea)}
                fill={isPopped ? popColor : (isDark ? 'rgba(255,255,255,0.15)' : '#E8E2D8')}
                opacity={isPopped ? 0.9 : 1}
              />
              <path
                d={arcPath(cx, cy, monthRingOut - 0.6, monthRingOut, sa, ea)}
                fill={isPopped ? popColor : (isDark ? 'rgba(255,255,255,0.15)' : '#E8E2D8')}
                opacity={isPopped ? 0.9 : 1}
              />
              <text
                fontSize="9"
                fill={isPopped ? (isDark ? '#F8F5EE' : '#100F0C') : (isDark ? '#7A8590' : '#9A938A')}
                fontFamily="DM Sans, sans-serif"
                letterSpacing="0.30em"
                fontWeight={isPopped ? 600 : 400}
              >
                <textPath href={`#${uid}-month-${mo}`} startOffset="50%" textAnchor="middle">
                  {mo.toUpperCase()}
                </textPath>
              </text>
            </g>
          );
        })}

        {/* Krumbiegel convergence highlight (Mar 1–20 wedge) */}
        {highlightConv && (() => {
          const a1 = doyAngle(59), a2 = doyAngle(79);
          const r = ringOuter + 14;
          const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
          const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
          const mid = (a1 + a2) / 2;
          const tx = cx + (r + 26) * Math.cos(mid);
          const ty = cy + (r + 26) * Math.sin(mid);
          return (
            <g>
              <path
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                fill="#F2B705"
                opacity="0.09"
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                fontSize="11"
                fill={isDark ? '#E8C658' : '#8a6a00'}
                fontFamily="DM Sans, sans-serif"
                letterSpacing="0.18em"
              >
                MAR 1–20
              </text>
            </g>
          );
        })()}

        {/* Thin month spokes */}
        {MONTHS.map((_, i) => {
          const a = doyAngle((i / 12) * YEAR_DAYS);
          const x1 = cx + ringInner * Math.cos(a);
          const y1 = cy + ringInner * Math.sin(a);
          const x2 = cx + (ringOuter + 2) * Math.cos(a);
          const y2 = cy + (ringOuter + 2) * Math.sin(a);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isDark ? 'rgba(255,255,255,0.08)' : '#E8E2D8'}
              strokeWidth="0.5"
            />
          );
        })}

        {/* Species rings */}
        {blooming.map((s, idx) => {
          const rIn = ringInner + idx * bandH + 1;
          const rOut = ringInner + (idx + 1) * bandH - 1;
          const isActive = active === s.id;
          const inSymphony = symphony ? symphony.has(s.id) : true;
          const dimmed = symphony !== null && !inSymphony;
          const arcs = sampleBloomArcs(s, 2);
          return (
            <g
              key={s.id}
              data-species={s.id}
              style={{ cursor: 'pointer', opacity: dimmed ? 0.12 : 1, transition: 'opacity 220ms' }}
              onPointerDown={() => onPick(s.id)}
              onPointerOver={() => onPick(s.id)}
            >
              <circle
                cx={cx} cy={cy}
                r={(rIn + rOut) / 2}
                fill="none"
                stroke={isDark ? 'rgba(255,255,255,0.04)' : '#EFEAE0'}
                strokeWidth={rOut - rIn}
              />
              {arcs.map(([a, b, op], i) => {
                const finalOp = isActive ? Math.min(1, op * 1.05) : op;
                return (
                  <path
                    key={i}
                    d={arcPath(cx, cy, rIn, rOut, doyAngle(a), doyAngle(b + 0.6))}
                    fill={s.color}
                    opacity={finalOp}
                    {...(burleMarx ? { stroke: '#F8F5EE', strokeWidth: 0.4 } : {})}
                  />
                );
              })}
              {isActive && (
                <circle
                  cx={cx} cy={cy}
                  r={(rIn + rOut) / 2}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={rOut - rIn + 0.5}
                  opacity="0.25"
                />
              )}
            </g>
          );
        })}

        {/* Inner disc */}
        <circle
          cx={cx} cy={cy} r={discRadius}
          fill={isDark ? '#0F1419' : '#FFFFFF'}
          stroke={isDark ? 'rgba(255,255,255,0.12)' : '#E8E2D8'}
        />

        {selected ? (
          <g>
            <circle
              cx={cx} cy={cy - 56} r="10"
              fill={selected.color}
              stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
            />
            <text
              x={cx} y={cy - 22}
              textAnchor="middle"
              fontSize="32"
              fill={isDark ? '#F8F5EE' : '#100F0C'}
              fontFamily="Cormorant Garamond, serif"
              fontStyle="italic"
            >
              {selected.common.length > 22 ? selected.common.slice(0, 20) + '…' : selected.common}
            </text>
            <text
              x={cx} y={cy + 2}
              textAnchor="middle"
              fontSize="13"
              fill={isDark ? '#9AA5B0' : '#6B6460'}
              fontFamily="DM Sans, sans-serif"
              fontStyle="italic"
              letterSpacing="0.08em"
            >
              {selected.botanical}
            </text>
            <text
              x={cx} y={cy + 24}
              textAnchor="middle"
              fontSize="11"
              fill={isDark ? '#9AA5B0' : '#6B6460'}
              fontFamily="DM Sans, sans-serif"
              letterSpacing="0.18em"
            >
              {selected.colorName.toUpperCase()} · {selected.durability.toUpperCase()}
            </text>
            <foreignObject x={cx - 110} y={cy + 38} width="220" height="90">
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  lineHeight: 1.45,
                  color: isDark ? '#C2CBD3' : '#100F0C',
                  textAlign: 'center',
                }}
              >
                {selected.dynamics}
              </div>
            </foreignObject>
          </g>
        ) : (
          <g>
            <text
              x={cx} y={cy - 18}
              textAnchor="middle"
              fontSize="14"
              fill={isDark ? '#9AA5B0' : '#6B6460'}
              fontFamily="DM Sans, sans-serif"
              letterSpacing="0.28em"
            >
              BENGALURU
            </text>
            <text
              x={cx} y={cy + 18}
              textAnchor="middle"
              fontSize="36"
              fill={isDark ? '#F8F5EE' : '#100F0C'}
              fontFamily="Cormorant Garamond, serif"
              fontStyle="italic"
            >
              Bloom Year
            </text>
            <text
              x={cx} y={cy + 46}
              textAnchor="middle"
              fontSize="11"
              fill={isDark ? '#6B7480' : '#9a948e'}
              fontFamily="DM Sans, sans-serif"
              letterSpacing="0.20em"
            >
              {blooming.length} SPECIES · 12 MONTHS
            </text>
            <text
              x={cx} y={cy + 78}
              textAnchor="middle"
              fontSize="10"
              fill={isDark ? '#6B7480' : '#9a948e'}
              fontFamily="DM Sans, sans-serif"
              fontStyle="italic"
            >
              Tap a ring to read
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Timeline grid — species × months heat-map
   ───────────────────────────────────────────────────────────────────────── */
function Timeline({ species, architect, active, onPick }) {
  const burleMarx = architect === 'burle-marx';
  return (
    <div
      className={styles.timeline}
      style={{ gridTemplateColumns: `repeat(${species.length}, 1fr)`, gridTemplateRows: 'repeat(12, 1fr)' }}
    >
      {species.flatMap((s, colIdx) =>
        Array.from({ length: 12 }, (_, m) => {
          const intensity = monthBloomIntensity(s, m);
          const isHover = active === s.id;
          const dim = active && !isHover;
          let bg = 'transparent';
          if (intensity > 0.01) {
            const alphaHex = toHex2(Math.min(1, intensity * 1.1));
            bg = `${s.color}${alphaHex}`;
          }
          return (
            <div
              key={`${s.id}-${m}`}
              data-species={s.id}
              style={{
                gridColumn: colIdx + 1,
                gridRow: m + 1,
                background: bg,
                opacity: dim ? 0.18 : 1,
                outline: isHover && intensity > 0.01 ? `1px solid ${burleMarx ? '#F8F5EE' : '#100F0C'}` : 'none',
                borderRadius: burleMarx ? 0 : 1,
              }}
              onPointerDown={() => onPick(s.id)}
              onPointerOver={() => onPick(s.id)}
            />
          );
        })
      )}
    </div>
  );
}

/* Detail overlay (timeline view only) */
function DetailOverlay({ selected }) {
  if (!selected) return null;
  return (
    <div className={styles.detailOverlay}>
      <div className="swatch" style={{ background: selected.color }} />
      <div className="common">{selected.common}</div>
      <div className="botanical">{selected.botanical}</div>
      <div className="meta">{selected.colorName} · {selected.durability}</div>
      <div className="dynamics">{selected.dynamics}</div>
    </div>
  );
}

/* Bottom nav: architect pills + (optional) palette swatches + view toggle */
function BottomNav({ architect, palette, view, onSetArchitect, onSetPalette, onSetView }) {
  return (
    <nav className={styles.bottomNav}>
      <div className={styles.pills}>
        {ARCHITECTS.map((a) => {
          const isActive = a.id === architect;
          const label = a.id === 'burle-marx' ? 'Burle Marx' : a.name.split(' ').slice(-1)[0];
          return (
            <button
              key={a.id}
              className={`${styles.pill} ${isActive ? styles.active : ''}`}
              onClick={() => onSetArchitect(a.id)}
            >
              <div className={styles.pillTheme}>{a.theme}</div>
              <div className={styles.pillName}>{label}</div>
            </button>
          );
        })}
      </div>
      <div className={styles.navRow}>
        {architect === 'sackville-west' && (
          <div className={styles.paletteRow}>
            {Object.keys(FAMILY_SWATCH).map((f) => (
              <button
                key={f}
                className={palette === f ? styles.active : ''}
                style={{ background: FAMILY_SWATCH[f] }}
                aria-label={f}
                onClick={() => onSetPalette(f)}
              />
            ))}
          </div>
        )}
        <div className={styles.viewToggle}>
          <button
            className={view === 'wheel' ? styles.active : ''}
            aria-label="wheel"
            onClick={() => onSetView('wheel')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <button
            className={view === 'timeline' ? styles.active : ''}
            aria-label="timeline"
            onClick={() => onSetView('timeline')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.4" />
              <line x1="2" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.4" />
              <line x1="2" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Top-level: owns state, paints background gradient, switches view.
   ───────────────────────────────────────────────────────────────────────── */
export default function Bloom() {
  const [architect, setArchitect] = useState('krumbiegel');
  const [view, setView] = useState('wheel');
  const [active, setActive] = useState(null);
  const [palette, setPalette] = useState('all');

  const burleMarx = architect === 'burle-marx';
  const species = useMemo(
    () => filteredSpecies(SPECIES, architect, palette, COLOR_FAMILY),
    [architect, palette]
  );
  const selected = active ? SPECIES.find((s) => s.id === active) : null;

  const baseBg = burleMarx ? '#0F1419' : '#F8F5EE';
  const bg = selected
    ? `radial-gradient(circle at 50% 42%, ${selected.color}55 0%, ${selected.color}22 18%, ${baseBg} 38%, ${baseBg} 100%)`
    : baseBg;

  return (
    <main
      className={`${styles.main} ${burleMarx ? styles.dark : ''}`}
      style={{ background: bg }}
    >
      <div className={styles.brand}>HOOVUGALU · ಹೂವುಗಳು</div>
      <section className={styles.hero}>
        {view === 'wheel' ? (
          <Wheel
            species={species}
            selected={selected}
            architect={architect}
            active={active}
            onPick={setActive}
          />
        ) : (
          <Timeline
            species={species}
            architect={architect}
            active={active}
            onPick={setActive}
          />
        )}
      </section>
      <BottomNav
        architect={architect}
        palette={palette}
        view={view}
        onSetArchitect={(id) => { setArchitect(id); setActive(null); }}
        onSetPalette={setPalette}
        onSetView={(v) => { setView(v); setActive(null); }}
      />
      {view === 'timeline' && <DetailOverlay selected={selected} />}
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Bloom from './components/Bloom/Bloom.jsx';
import BangaloreBloom from './BangaloreBloom.jsx';
import Viz01Soundscape from './components/Viz01Soundscape.jsx';
import Viz06Loop from './components/Viz06Loop.jsx';
import Landing from './components/Landing.jsx';
import AboutUs from './components/AboutUs.jsx';
import styles from './App.module.css';

export const NavIcon = ({ kind }) => {
  // Hand-drawn nature-themed icon family. Each motif is tied to its page's
  // content and rendered with its own colour palette so the drawer reads as
  // a small herbarium of species marks rather than monochrome glyphs.
  const baseStroke = { fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  // Home — a green sprout emerging from soft earth.
  if (kind === 'home') return (
    <svg width="30" height="30" viewBox="0 0 22 22" aria-hidden="true">
      {/* ground line — warm brown */}
      <path d="M3.5 17 Q11 16 18.5 17" stroke="#8A6A4A" {...baseStroke} />
      {/* stem — fresh green */}
      <path d="M11 17 Q11 13 11 9" stroke="#4A8A4A" {...baseStroke} />
      {/* left leaf */}
      <path d="M11 11.5 Q7 11 6 8 Q9 7 11 11" stroke="#4A8A4A" fill="#A8D8A8" {...baseStroke} />
      {/* right leaf */}
      <path d="M11 9.5 Q14.5 9 16 6 Q12.5 5.5 11 9" stroke="#4A8A4A" fill="#A8D8A8" {...baseStroke} />
    </svg>
  );
  // Soundscape — Jacaranda-violet leaf with sound ripples drifting off it.
  if (kind === 'soundscape') return (
    <svg width="30" height="30" viewBox="0 0 22 22" aria-hidden="true">
      {/* leaf body */}
      <path d="M5 16 Q5 9 11 5 Q12 11 6 16 Z" stroke="#6B55A0" fill="#C8BFE0" {...baseStroke} />
      {/* leaf central vein */}
      <path d="M5 16 Q8 12 11 8.5" stroke="#6B55A0" {...baseStroke} />
      {/* sound ripples drifting outward */}
      <path d="M14 8 Q15.5 9 14.5 11" stroke="#6B55A0" {...baseStroke} />
      <path d="M16.5 6.5 Q18.5 9 16.5 12" stroke="#6B55A0" {...baseStroke} />
    </svg>
  );
  // Bloom Calendar — concentric cyclograph rings (matches the actual
  // organic-wheel shape on the page), each ring in a warm bloom hue.
  if (kind === 'wheel') return (
    <svg width="30" height="30" viewBox="0 0 22 22" aria-hidden="true">
      {/* outer ring — coral */}
      <path d="M11 4.5 Q17.5 7 17.5 11 Q17.5 16 11 17.5 Q4.5 16 4.5 11 Q4.5 7 11 4.5 Z"
            stroke="#C94028" {...baseStroke} />
      {/* middle ring — pink trumpet */}
      <path d="M11 7 Q15 8.5 15 11 Q15 14 11 15 Q7 14 7 11 Q7 8.5 11 7 Z"
            stroke="#C84878" {...baseStroke} />
      {/* inner ring — amaltas gold */}
      <path d="M11 9.5 Q12.8 10 12.8 11.2 Q12.8 12.5 11 12.5 Q9.2 12.5 9.2 11.2 Q9.2 10 11 9.5 Z"
            stroke="#C89820" fill="#E6B800" {...baseStroke} />
    </svg>
  );
  // Loop — stack of hand-drawn wavy strata, each row a species colour.
  // Echoes the 118-row pixel mosaic but rendered as organic painted lines
  // rather than a geometric grid.
  if (kind === 'loop') return (
    <svg width="30" height="30" viewBox="0 0 22 22" aria-hidden="true">
      <path d="M4 6 Q8 5.2 11 6.2 Q14 7.2 18 6"  stroke="#C94028" {...baseStroke} strokeWidth="1.8" />
      <path d="M4 9 Q8 9.8 11 8.8 Q14 7.8 18 9"  stroke="#C84878" {...baseStroke} strokeWidth="1.8" />
      <path d="M4 12 Q8 11.2 11 12.2 Q14 13.2 18 12" stroke="#6B55A0" {...baseStroke} strokeWidth="1.8" />
      <path d="M4 15 Q8 15.8 11 14.8 Q14 13.8 18 15" stroke="#E6B800" {...baseStroke} strokeWidth="1.8" />
      <path d="M4 18 Q8 17.2 11 18.2 Q14 19.2 18 18" stroke="#C89820" {...baseStroke} strokeWidth="1.8" />
    </svg>
  );
  // About — open book with a leaf bookmark — warm sepia.
  if (kind === 'about') return (
    <svg width="30" height="30" viewBox="0 0 22 22" aria-hidden="true">
      {/* book spread */}
      <path d="M3.5 6 Q7.5 5.5 11 7 Q14.5 5.5 18.5 6 L18.5 16 Q14.5 15.5 11 17 Q7.5 15.5 3.5 16 Z"
            stroke="#7A5A3A" fill="#F0E6D6" {...baseStroke} />
      {/* central spine */}
      <path d="M11 7 V17" stroke="#7A5A3A" {...baseStroke} />
      {/* leaf bookmark drifting out the top */}
      <path d="M14 4.5 Q15.5 3 17 4 Q16.5 5.5 14.8 6"
            stroke="#4A8A4A" fill="#A8D8A8" {...baseStroke} />
    </svg>
  );
  return null;
};

const NAV_ITEMS = [
  { view: 'home', label: 'Home', icon: 'home' },
  { view: 'soundscape', label: 'Soundscape', icon: 'soundscape' },
  { view: 'wheel', label: 'Bloom Calendar', icon: 'wheel' },
  { view: 'loop', label: 'Loop', icon: 'loop' },
  { view: 'about', label: 'About', icon: 'about' },
];

/* Leading floral mark next to the wordmark. Rotates through species by month
   so the logo carries the city's current bloom. Idle (no month) → Silver Oak. */
const FLORAL_MARKS = [
  { id: 'ERY', color: '#C94028' },        // Jan
  { id: 'TYE', color: '#E6B800' },        // Feb
  { id: 'JAC', color: '#6B55A0' },        // Mar
  { id: 'AML', color: '#C89820' },        // Apr
  { id: 'GUL', color: '#D03A18' },        // May
  { id: 'SLV', color: '#7A9E96' },        // Jun
  { id: 'POI', color: '#8A4898' },        // Jul
  { id: 'SPA', color: '#C03818' },        // Aug
  { id: 'PEL', color: '#C87820' },        // Sep
  { id: 'PEL', color: '#C87820' },        // Oct
  { id: 'TAB', color: '#C84878' },        // Nov
  { id: 'ERY', color: '#C94028' },        // Dec
];
function FloralMark({ size = 22 }) {
  const monthIdx = new Date().getMonth();
  const { color } = FLORAL_MARKS[monthIdx];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"
      style={{ display: 'block' }}>
      {/* Five-petal bloom — leading mark */}
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="16" cy="9"
          rx="4" ry="6"
          fill={color}
          opacity="0.82"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="2.6" fill="#F8F5EE" />
      <circle cx="16" cy="16" r="1.4" fill={color} opacity="0.95" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <line x1="5" y1="10" x2="25" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="5" y1="15" x2="25" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="5" y1="20" x2="25" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <text
        x="15" y="22"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="22"
        fontStyle="italic"
        fontWeight="700"
        fill="currentColor"
      >i</text>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <line x1="8" y1="8" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="8" x2="8" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* Viewports info — full content page that replaces the current viewport
   in place (topbar persists). Same content for Soundscape / Bloom Calendar
   / Loop; the page just covers whichever data view the user was on. */
function ViewportsPage({ onNav }) {
  return (
    <main className="viewports-page">
      <article className="viewports-card">
        <h2 className="viewports-title">Welcome to Hoovugalu</h2>
        <p className="viewports-intro">
          Bangalore's famous canopy isn't an accident, it's a living
          calendar. This project explores a century-old masterwork by
          landscape architect Gustav Krumbiegel, who serially planted
          flowering trees so the city would change color every month.
        </p>
        <p className="viewports-intro">
          Explore this living archive through three interactive lenses.
        </p>

        <section className="viewports-section">
          <div className="viewports-section-head">
            <span className="viewports-section-icon"><NavIcon kind="soundscape" /></span>
            <h3 className="viewports-section-title">Soundscape</h3>
          </div>
          <p className="viewports-item">
            <strong>What it is.</strong> A musical translation of the city.
            Tree colors are mapped to music notes, layered with regional
            weather and bird songs.
          </p>
          <p className="viewports-item">
            <strong>What to do.</strong> Press Play to start the score,
            then drag the Timeline Slider to watch and hear the canopy shift
            month-by-month.
          </p>
        </section>

        <section className="viewports-section">
          <div className="viewports-section-head">
            <span className="viewports-section-icon"><NavIcon kind="wheel" /></span>
            <h3 className="viewports-section-title">Bloom Calendar</h3>
          </div>
          <p className="viewports-item">
            <strong>What it is.</strong> A visual clock tracking
            Krumbiegel's deliberate color contrasts. Tracing a continuous
            layout with no gap months ensures a tree is always in bloom.
          </p>
          <p className="viewports-item">
            <strong>What to do.</strong> Tap and sweep around the circular
            dial to focus on a season, and use the Filter Pills to compare
            his layout with modern landscapes.
          </p>
        </section>

        <section className="viewports-section">
          <div className="viewports-section-head">
            <span className="viewports-section-icon"><NavIcon kind="loop" /></span>
            <h3 className="viewports-section-title">Loop</h3>
          </div>
          <p className="viewports-item">
            <strong>What it is.</strong> A timeline matrix charting 118
            years of color data since 1908. Mapping serial blossom windows
            across the years shows how this canopy gave Bangalore the name
            garden city.
          </p>
          <p className="viewports-item">
            <strong>What to do.</strong> Tap any pixel coordinate on the
            grid to trigger its sound profile, and read that tree's
            localized history.
          </p>
        </section>

        <p className="viewports-footnote">
          Check out{' '}
          <button
            type="button"
            className="viewports-link"
            onClick={() => onNav('about')}
          >
            About page
          </button>{' '}
          for more details.
        </p>
      </article>
    </main>
  );
}

function LandingTopBar({ current, onNav, infoOpen, onToggleInfo }) {
  const [open, setOpen] = useState(false);
  const [showKn, setShowKn] = useState(false);
  // Info button only shows on the three data viewports; not on home / about.
  const showInfo = current === 'soundscape' || current === 'wheel' || current === 'loop';
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  // Toggle a body flag so the page wrapper can slide right and reveal the
  // drawer underneath (Claude-mobile style).
  useEffect(() => {
    document.body.classList.toggle('drawer-open', open);
    return () => document.body.classList.remove('drawer-open');
  }, [open]);
  // Hard reset on mount — guards against HMR-preserved body classes that
  // would otherwise leave the drawer "open" on a fresh page load.
  useEffect(() => {
    document.body.classList.remove('drawer-open');
  }, []);
  // Loop the brand wordmark between English and Kannada with a brief pause
  useEffect(() => {
    const id = setInterval(() => setShowKn((v) => !v), 6000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <header className="landing-topbar" role="banner">
        <button
          type="button"
          className={`landing-menu${open ? ' is-open' : ''}${current === 'home' ? ' on-hero' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <HamburgerIcon />
        </button>
        {current !== 'home' && (
          <a
            href="#"
            className="landing-brand"
            aria-label="Hoovugalu — home"
            onClick={(e) => { e.preventDefault(); onNav('home'); }}
          >
            <span className="landing-brand-logo-slot">
              <img
                src="/HoovugaluLogoEnglish.svg"
                alt="Hoovugalu"
                className={`landing-brand-logo${showKn ? '' : ' is-visible'}`}
                aria-hidden={showKn}
              />
              <img
                src="/HoovugaluLogoKanada.svg"
                alt="ಹೂವುಗಳು"
                className={`landing-brand-logo${showKn ? ' is-visible' : ''}`}
                aria-hidden={!showKn}
              />
            </span>
          </a>
        )}
        {showInfo ? (
          <button
            type="button"
            className={`landing-info${infoOpen ? ' is-open' : ''}`}
            aria-label={infoOpen ? 'Close information' : 'About the viewports'}
            aria-expanded={infoOpen}
            onClick={onToggleInfo}
          >
            {infoOpen ? <CloseIcon /> : <InfoIcon />}
          </button>
        ) : (
          <span className="landing-topbar-spacer" aria-hidden="true" />
        )}
      </header>
      {createPortal(
        <>
          <div
            className={`landing-drawer-backdrop${open ? ' is-open' : ''}`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            className={`landing-drawer${open ? ' is-open' : ''}`}
            aria-label="Primary navigation"
            aria-hidden={!open}
          >
        <nav className="landing-drawer-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              type="button"
              className={`landing-drawer-link${current === item.view ? ' is-active' : ''}`}
              onClick={() => { onNav(item.view); setOpen(false); }}
            >
              <NavIcon kind={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
        </>,
        document.body
      )}
    </>
  );
}

const EXIT_MS = 280;

export default function App() {
  const [view, setView] = useState('home');
  const [exiting, setExiting] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  // Close the info page whenever the route changes (going to a different
  // viewport, home, or about should return to the data page itself).
  useEffect(() => { setInfoOpen(false); }, [view]);

  useEffect(() => {
    if (view === 'soundscape') window.scrollTo(0, 0);
  }, [view]);

  function navigate(next) {
    const nextView = typeof next === 'string' ? next : next.view;
    if (nextView === view || exiting) return;
    setExiting(true);
    setTimeout(() => {
      setView(nextView);
      setExiting(false);
    }, EXIT_MS);
  }

  const wrapperClass = exiting ? styles.pageExit : styles.pageEnter;

  // Outer .page-slide wrapper handles ONLY the drawer translateX. The inner
  // wrapperClass div handles ONLY the route transition (translateY+opacity).
  // Separating them prevents one transform from clobbering the other.
  if (view === 'home') {
    return (
      <div className="page-slide">
        <div key="home" className={wrapperClass}>
          <LandingTopBar current={view} onNav={navigate} infoOpen={false} onToggleInfo={() => {}} />
          <Landing onNav={navigate} />
        </div>
      </div>
    );
  }

  const topBarProps = {
    current: view,
    onNav: navigate,
    infoOpen,
    onToggleInfo: () => setInfoOpen((v) => !v),
  };

  if (view === 'soundscape') {
    return (
      <div className="page-slide">
        <div key="soundscape" className={wrapperClass}>
          <div className="snap-root landing-root">
            <LandingTopBar {...topBarProps} />
            <div className="snap-section landing-section">
              <div className="snap-inner landing-inner">
                {infoOpen ? <ViewportsPage onNav={navigate} /> : <Viz01Soundscape isActive={true} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'loop') {
    return (
      <div className="page-slide">
        <div key="loop" className={wrapperClass}>
          <div className="snap-root landing-root">
            <LandingTopBar {...topBarProps} />
            <div className="snap-section landing-section">
              <div className="snap-inner landing-inner landing-loop">
                {infoOpen ? <ViewportsPage onNav={navigate} /> : <Viz06Loop isActive={true} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'about') {
    return (
      <div className="page-slide">
        <div key="about" className={wrapperClass}>
          <LandingTopBar {...topBarProps} />
          <AboutUs />
        </div>
      </div>
    );
  }

  // view === 'wheel'
  return (
    <div className="page-slide">
      <div key="wheel" className={wrapperClass}>
        <LandingTopBar {...topBarProps} />
        {infoOpen ? <ViewportsPage onNav={navigate} /> : <Bloom />}
      </div>
    </div>
  );
}

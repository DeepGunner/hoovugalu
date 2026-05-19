import React, { useEffect, useState } from 'react';
import Bloom from './components/Bloom/Bloom.jsx';
import BangaloreBloom from './BangaloreBloom.jsx';
import Viz01Soundscape from './components/Viz01Soundscape.jsx';
import Viz06Loop from './components/Viz06Loop.jsx';
import styles from './App.module.css';

const NAV_ITEMS = [
  { view: 'soundscape', label: 'Soundscape' },
  { view: 'wheel', label: 'Bloom Calendar' },
  { view: 'loop', label: 'Loop' },
];

function LandingTopBar({ current, onNav }) {
  return (
    <header className="landing-topbar" role="banner">
      <a
        href="#"
        className="landing-brand"
        onClick={(e) => { e.preventDefault(); onNav('soundscape'); }}
      >
        Hoovugalu
        <span className="landing-brand-sub">ಹೂವುಗಳು</span>
      </a>
      <nav className="landing-nav" aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.view}
            type="button"
            className={`landing-navlink${current === item.view ? ' is-active' : ''}`}
            onClick={() => onNav(item.view)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

const EXIT_MS = 280;

export default function App() {
  const [view, setView] = useState('soundscape');
  const [exiting, setExiting] = useState(false);

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

  if (view === 'soundscape') {
    return (
      <div key="soundscape" className={wrapperClass}>
        <div className="snap-root landing-root">
          <LandingTopBar current={view} onNav={navigate} />
          <div className="snap-section landing-section">
            <div className="snap-inner landing-inner">
              <Viz01Soundscape isActive={true} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'loop') {
    return (
      <div key="loop" className={wrapperClass}>
        <div className="snap-root landing-root">
          <LandingTopBar current={view} onNav={navigate} />
          <div className="snap-section landing-section">
            <div className="snap-inner landing-inner landing-loop">
              <Viz06Loop isActive={true} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // view === 'wheel'
  return (
    <div key="wheel" className={wrapperClass}>
      <LandingTopBar current={view} onNav={navigate} />
      <Bloom />
    </div>
  );
}

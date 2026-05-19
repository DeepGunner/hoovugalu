import React, { useEffect, useState } from 'react';
import Viz01Soundscape from './components/Viz01Soundscape.jsx';
import Viz02Wordmark from './components/Viz02Wordmark.jsx';
import Viz03Season from './components/Viz03Season.jsx';
import Viz04Canvas from './components/Viz04Canvas.jsx';
import Viz05Score from './components/Viz05Score.jsx';
import Viz06Loop from './components/Viz06Loop.jsx';
import Viz07Year from './components/Viz07Year.jsx';
import useActiveSection from './hooks/useActiveSection.js';

const N = 9;

export default function BangaloreBloom({ initialSection = 0 }) {
  const [active, refs] = useActiveSection(N);
  const [hintGone, setHintGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHintGone(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!initialSection) return;
    const el = refs[initialSection]?.current;
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div id="sc-tip"></div>

      <div className="snap-root">
        <div className="snap-section snap-intro" ref={refs[0]}>
          <div className="snap-inner">
            <header className="ph">
              <div className="ph-kicker">Seven visualisations · Bangalore, 1908 – present</div>
              <h1 className="ph-title">
                The calendar<br />Krumbiegel composed.
              </h1>
              <p className="ph-sub">
                Twelve months. Nine species — including Silver Oak, the permanent canopy that runs beneath every season. One city as canvas, 117 years and counting.
              </p>
            </header>
            <div className={`snap-hint${hintGone ? ' gone' : ''}`}>swipe ↓</div>
          </div>
        </div>

        <div className="snap-section" ref={refs[1]}>
          <div className="snap-inner"><Viz01Soundscape isActive={active === 1} /></div>
        </div>
        <div className="snap-section" ref={refs[2]}>
          <div className="snap-inner"><Viz02Wordmark isActive={active === 2} /></div>
        </div>
        <div className="snap-section" ref={refs[3]}>
          <div className="snap-inner"><Viz03Season isActive={active === 3} /></div>
        </div>
        <div className="snap-section" ref={refs[4]}>
          <div className="snap-inner"><Viz04Canvas isActive={active === 4} /></div>
        </div>
        <div className="snap-section" ref={refs[5]}>
          <div className="snap-inner"><Viz05Score isActive={active === 5} /></div>
        </div>
        <div className="snap-section" ref={refs[6]}>
          <div className="snap-inner"><Viz06Loop isActive={active === 6} /></div>
        </div>
        <div className="snap-section" ref={refs[7]}>
          <div className="snap-inner"><Viz07Year isActive={active === 7} /></div>
        </div>

        <div className="snap-section snap-outro" ref={refs[8]}>
          <div className="snap-inner">
            <footer className="pg-foot">
              Species data from T.P. Issar, <em>Blossoms of Bangalore</em>, 1994.<br />
              Part of a series on The Programmed Streets of Bangalore.
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import ColorClock from './ColorClock.jsx';

/* Landing page — full-bleed colour clock with a single welded narrative
   paragraph centred over a breathing aura. No outer card, no pill buttons:
   the three page names appear inline as tracked, bracketed gateways. */
export default function Landing({ onNav }) {
  // Cross-fade wordmark
  const [showKn, setShowKn] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setShowKn((v) => !v), 6000);
    return () => clearInterval(id);
  }, []);

  // Click hand-off — fade the narrative out, then navigate.
  const [leaving, setLeaving] = useState(false);
  const go = (target) => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onNav(target), 320);
  };

  return (
    <main className="landing-hero" aria-label="Hoovugalu — home">
      <div className="landing-hero-clock" aria-hidden="true">
        <ColorClock />
      </div>
      <div className={`landing-hero-narrative${leaving ? ' is-leaving' : ''}`}>
        {/* Breathing aura — a circular blurred lens behind the text only.
            Lifts the ink off the gradient without occluding the clock hands. */}
        <span className="landing-hero-aura" aria-hidden="true" />
        <span className="landing-hero-logo-slot" aria-label="Hoovugalu">
          <img
            src="/HoovugaluLogoEnglish.svg"
            alt="Hoovugalu"
            className={`landing-hero-logo${showKn ? '' : ' is-visible'}`}
            aria-hidden={showKn}
          />
          <img
            src="/HoovugaluLogoKanada.svg"
            alt="ಹೂವುಗಳು"
            className={`landing-hero-logo${showKn ? ' is-visible' : ''}`}
            aria-hidden={!showKn}
          />
        </span>
        <p className="landing-hero-prose">
          A year-long ritusamhara of Gustav Krumbiegel's programmed streets.
          Step inside to experience the city's sonic rhythms via{' '}
          <button
            type="button"
            className="landing-hero-gateway"
            onClick={() => go('soundscape')}
          >
            /&nbsp;SOUNDSCAPE&nbsp;/
          </button>{', '}
          track overlapping seasonal colour compared with Piet Oudolf on the{' '}
          <button
            type="button"
            className="landing-hero-gateway"
            onClick={() => go('wheel')}
          >
            /&nbsp;BLOOM&nbsp;CALENDAR&nbsp;/
          </button>{', '}
          or explore 118 rows of botanical history in the continuous{' '}
          <button
            type="button"
            className="landing-hero-gateway"
            onClick={() => go('loop')}
          >
            /&nbsp;LOOP&nbsp;/
          </button>{'. '}
          Learn more{' '}
          <button
            type="button"
            className="landing-hero-gateway"
            onClick={() => go('about')}
          >
            /&nbsp;ABOUT&nbsp;/
          </button>{' '}
          the composition.
        </p>
      </div>
    </main>
  );
}

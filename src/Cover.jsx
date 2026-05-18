import React from 'react';
import styles from './Cover.module.css';

/* Small horizontal flourish — line · curl · dot · line. Used as a divider
   in the bottom navigation. */
function Ornament({ className = '' }) {
  return (
    <svg
      className={`${styles.ornament} ${className}`}
      viewBox="0 0 80 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.7"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="0" y1="6" x2="26" y2="6" />
      <path d="M30 6 Q 33 2, 36 6 T 42 6 T 48 6" />
      <circle cx="39" cy="6" r="1.3" fill="currentColor" stroke="none" />
      <line x1="52" y1="6" x2="80" y2="6" />
    </svg>
  );
}

/* Single-viewport cover. No scroll, no parallax. */
export default function Cover({ onSelect }) {
  return (
    <div className={styles.appContainer}>
      <div className={styles.grainOverlay} aria-hidden="true" />

      <nav className={styles.nav}>
        <a
          href="#"
          className={styles.navBrand}
          onClick={(e) => e.preventDefault()}
        >
          Hoovugalu
          <span>ಹೂವುಗಳು · BENGALURU</span>
        </a>
      </nav>

      <section className={styles.hero}>
        <div className={styles.petalLayer} aria-hidden="true">
          <svg className={`${styles.floater} ${styles.leaf1}`} viewBox="0 0 60 80" fill="none">
            <path d="M30 2 C50 20 55 50 30 78 C5 50 10 20 30 2Z" fill="#C9A96E" />
          </svg>
          <svg className={`${styles.floater} ${styles.leaf2}`} viewBox="0 0 40 55" fill="none">
            <path d="M20 2 C36 15 38 40 20 53 C2 40 4 15 20 2Z" fill="#8B9E7A" />
          </svg>
          <svg className={`${styles.floater} ${styles.leaf3}`} viewBox="0 0 50 70" fill="none">
            <path d="M25 2 C44 18 46 52 25 68 C4 52 6 18 25 2Z" fill="#D4A574" />
          </svg>
          <svg className={`${styles.floater} ${styles.leaf4}`} viewBox="0 0 35 50" fill="none">
            <path d="M17 2 C32 14 33 36 17 48 C1 36 2 14 17 2Z" fill="#B5987A" />
          </svg>
          <svg className={`${styles.floater} ${styles.leaf5}`} viewBox="0 0 45 60" fill="none">
            <path d="M22 2 C40 16 42 44 22 58 C2 44 4 16 22 2Z" fill="#C9A96E" />
          </svg>
          <svg className={`${styles.floater} ${styles.leaf6}`} viewBox="0 0 55 40" fill="none">
            <path d="M2 20 C15 2 40 2 53 20 C40 38 15 38 2 20Z" fill="#8B9E7A" />
            <line x1="2" y1="20" x2="53" y2="20" stroke="#6B7D5E" strokeWidth="0.8" opacity="0.5" />
          </svg>
          <svg className={`${styles.floater} ${styles.leaf7}`} viewBox="0 0 42 32" fill="none">
            <path d="M2 16 C12 2 30 2 40 16 C30 30 12 30 2 16Z" fill="#8B9E7A" />
          </svg>
        </div>

        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>A visual exploration of Bengaluru</p>
          <h1 className={styles.heroTitle}>Hoovu<em>galu</em></h1>
          <p className={styles.heroKannada}>ಹೂವುಗಳು</p>
          <p className={styles.heroDesc}>
            An interactive anthology of Bengaluru's blooming streets — data, colour, and the city's living calendar rendered as visual experience.
          </p>
        </div>

        <nav className={styles.bottomBar}>
          <Ornament className={styles.ornamentEdge} />
          <button
            type="button"
            className={styles.bottomLink}
            onClick={() => onSelect('wheel')}
          >
            Bloom Calendar
            <span className={styles.bottomLinkSerif}>Hoovugalu</span>
          </button>
          <Ornament />
          <button
            type="button"
            className={styles.bottomLink}
            onClick={() => onSelect('snap')}
          >
            Seven Visualisations
            <span className={styles.bottomLinkSerif}>The Calendar Krumbiegel Composed</span>
          </button>
          <Ornament className={styles.ornamentEdge} />
        </nav>
      </section>
    </div>
  );
}

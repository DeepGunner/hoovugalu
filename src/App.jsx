import React, { useEffect, useState } from 'react';
import Cover from './Cover.jsx';
import Bloom from './components/Bloom/Bloom.jsx';
import BangaloreBloom from './BangaloreBloom.jsx';
import styles from './App.module.css';

function BackChip({ onBack }) {
  return (
    <button
      onClick={onBack}
      aria-label="Back to cover"
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        zIndex: 9999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px 8px 12px',
        borderRadius: 999,
        background: 'rgba(248, 245, 238, 0.92)',
        border: '1px solid rgba(16,15,12,0.18)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        font: '10px/1 "Space Mono", monospace',
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        color: '#26201A',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,.08)',
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>←</span>
      Back
    </button>
  );
}

const EXIT_MS = 280;

export default function App() {
  const [view, setView] = useState('cover');
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Reset scroll when entering the cover so users see the hero.
    if (view === 'cover') window.scrollTo(0, 0);
  }, [view]);

  function navigate(next) {
    if (next === view || exiting) return;
    setExiting(true);
    setTimeout(() => {
      setView(next);
      setExiting(false);
    }, EXIT_MS);
  }

  const wrapperClass = exiting ? styles.pageExit : styles.pageEnter;

  if (view === 'cover') {
    return (
      <div key="cover" className={wrapperClass}>
        <Cover onSelect={navigate} />
      </div>
    );
  }

  if (view === 'wheel') {
    return (
      <div key="wheel" className={wrapperClass}>
        <BackChip onBack={() => navigate('cover')} />
        <Bloom />
      </div>
    );
  }

  // view === 'snap'
  return (
    <div key="snap" className={wrapperClass}>
      <BackChip onBack={() => navigate('cover')} />
      <BangaloreBloom />
    </div>
  );
}

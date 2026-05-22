/**
 * Aggressive audio unlock for mobile in-app webviews (LinkedIn, Instagram,
 * Facebook, Twitter, Threads, etc.). These embedded browsers often leave
 * the WebAudio AudioContext stuck in "suspended" state even after a user
 * gesture. The tricks that survive across them:
 *
 *  1. Silently play an inline <audio> element with a 1-frame WAV. The
 *     act of HTMLAudio playing claims the device audio session, which
 *     in many webviews also unblocks Tone.js's AudioContext.
 *  2. Call Tone.start() AND ctx.resume() — separately, both can be needed.
 *  3. Re-fire on EVERY user gesture, not just the first, because some
 *     webviews re-suspend the context when the page is briefly hidden.
 *
 * This module exposes installAudioUnlock(toneModule) which wires the
 * unlock to global pointer/touch listeners and is safe to call multiple
 * times (idempotent).
 */

// 1-frame PCM WAV, base64 — silent, fully decodable on every browser.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

let installed = false;
let silentAudio = null;

function ensureSilentAudio() {
  if (silentAudio) return silentAudio;
  silentAudio = document.createElement('audio');
  silentAudio.src = SILENT_WAV;
  silentAudio.loop = true;
  silentAudio.volume = 0;
  silentAudio.muted = false; // muted:true defeats the purpose in some webviews
  silentAudio.setAttribute('playsinline', '');
  silentAudio.setAttribute('webkit-playsinline', '');
  silentAudio.preload = 'auto';
  return silentAudio;
}

function tryResume(Tone) {
  // Best-effort unlock: silent <audio> + Tone.start + ctx.resume.
  try {
    const a = ensureSilentAudio();
    // Re-trigger play on every gesture in case the webview paused it.
    const p = a.play();
    if (p && typeof p.then === 'function') p.catch(() => { /* ignore */ });
  } catch (e) { /* ignore */ }
  try {
    if (Tone && typeof Tone.start === 'function') {
      const p = Tone.start();
      if (p && typeof p.then === 'function') p.catch(() => { /* ignore */ });
    }
  } catch (e) { /* ignore */ }
  try {
    const ctx = Tone && Tone.getContext ? Tone.getContext() : null;
    const raw = ctx && (ctx.rawContext || ctx._context || ctx);
    if (raw && raw.state === 'suspended' && typeof raw.resume === 'function') {
      const p = raw.resume();
      if (p && typeof p.then === 'function') p.catch(() => { /* ignore */ });
    }
  } catch (e) { /* ignore */ }
}

export function installAudioUnlock(Tone) {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const events = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
  const handler = () => tryResume(Tone);
  events.forEach((ev) => {
    window.addEventListener(ev, handler, { capture: true, passive: true });
  });
  // Also resume whenever the tab becomes visible again — in-app webviews
  // often suspend the context when the user backgrounds the app briefly.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tryResume(Tone);
  });
}

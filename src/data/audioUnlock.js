/**
 * Aggressive audio unlock for mobile in-app webviews (LinkedIn, Instagram,
 * Facebook, Twitter/X, Threads, etc.) and stock browsers.
 *
 * Strategy:
 *  1. On EVERY user gesture (capture phase) call Tone.start() and resume
 *     the raw AudioContext if it's suspended. Many webviews re-suspend
 *     the context after focus changes, so once isn't enough.
 *  2. Play a one-sample silent buffer through Tone's destination — the
 *     act of any buffer source actually playing claims the audio output
 *     channel, which unblocks Tone's master output in webviews where
 *     start()/resume() alone fail.
 *  3. Run a silent HTMLAudioElement in parallel — different webviews
 *     respond to one or the other.
 *  4. Re-fire on visibilitychange (returning to the tab from a brief
 *     background) because that re-suspends the context in many webviews.
 */

// 1-frame PCM WAV — silent, fully decodable everywhere.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

let installed = false;
let silentAudio = null;

function ensureSilentAudio() {
  if (silentAudio || typeof document === 'undefined') return silentAudio;
  silentAudio = document.createElement('audio');
  silentAudio.src = SILENT_WAV;
  silentAudio.loop = true;
  silentAudio.volume = 0;
  silentAudio.muted = false;
  silentAudio.setAttribute('playsinline', '');
  silentAudio.setAttribute('webkit-playsinline', '');
  silentAudio.setAttribute('autoplay', '');
  silentAudio.preload = 'auto';
  // Don't insert into DOM — keep it lightweight.
  return silentAudio;
}

function safe(fn) {
  try {
    const p = fn();
    if (p && typeof p.then === 'function') p.catch(() => {});
  } catch (e) { /* ignore */ }
}

function tryResume(Tone) {
  safe(() => {
    const a = ensureSilentAudio();
    if (a) return a.play();
  });
  safe(() => (Tone && Tone.start ? Tone.start() : null));
  safe(() => {
    const ctx = Tone && Tone.getContext ? Tone.getContext() : null;
    const raw = ctx && (ctx.rawContext || ctx._context || ctx);
    if (raw && raw.state === 'suspended' && raw.resume) return raw.resume();
  });
  // Play a one-sample silent buffer through Tone's destination. The
  // act of a buffer source actually starting frequently unblocks the
  // master output in webviews where ctx.resume() alone is silently
  // rejected.
  safe(() => {
    const ctx = Tone && Tone.getContext ? Tone.getContext() : null;
    const raw = ctx && (ctx.rawContext || ctx._context);
    if (!raw || !raw.createBuffer || !raw.createBufferSource) return;
    const buffer = raw.createBuffer(1, 1, 22050);
    const source = raw.createBufferSource();
    source.buffer = buffer;
    source.connect(raw.destination);
    if (source.start) source.start(0);
  });
}

export function installAudioUnlock(Tone) {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const events = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
  const handler = () => tryResume(Tone);
  events.forEach((ev) => {
    window.addEventListener(ev, handler, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tryResume(Tone);
  });
}

// Imperative kick — called from inside the Play-button click handler so
// the unlock fires synchronously with the actual user gesture (not just
// the global listener), which is what some hardened webviews require.
export function kickAudio(Tone) {
  tryResume(Tone);
}

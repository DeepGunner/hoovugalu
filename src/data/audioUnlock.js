/**
 * Gentle audio unlock for mobile in-app webviews (LinkedIn, Instagram, etc).
 * Installed once at the top level. Resumes Tone's AudioContext on every
 * user gesture in case the webview re-suspends it, but never touches the
 * raw destination or creates buffer sources — those operations were
 * interfering with Tone's own initialisation flow.
 */

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
  silentAudio.setAttribute('playsinline', '');
  silentAudio.setAttribute('webkit-playsinline', '');
  silentAudio.preload = 'auto';
  return silentAudio;
}

function safe(fn) {
  try {
    const p = fn();
    if (p && typeof p.then === 'function') p.catch(() => {});
  } catch (e) { /* ignore */ }
}

function tryResume(Tone) {
  // Play the silent loop — claims the device audio session in iOS WKWebView.
  safe(() => {
    const a = ensureSilentAudio();
    if (a) return a.play();
  });
  // Resume Tone's context if suspended. We do NOT call Tone.start() here
  // — Tone.start() is reserved for the explicit play-button click so it
  // doesn't race with the synth initialisation.
  safe(() => {
    const ctx = Tone && Tone.getContext ? Tone.getContext() : null;
    const raw = ctx && (ctx.rawContext || ctx._context || ctx);
    if (raw && raw.state === 'suspended' && raw.resume) return raw.resume();
  });
}

export function installAudioUnlock(Tone) {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const events = ['touchstart', 'touchend', 'pointerdown', 'click'];
  const handler = () => tryResume(Tone);
  events.forEach((ev) => {
    window.addEventListener(ev, handler, { capture: true, passive: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tryResume(Tone);
  });
}

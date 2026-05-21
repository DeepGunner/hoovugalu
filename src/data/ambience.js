/* Bangalore Ambience Layer — minimal, no oscillator drones
   ─────────────────────────────────────────────────────────────────────────
   Only continuous noise-based textures + one very gentle low whistle.
   Removed: pad chord (was an electric hum that never resolved), bells,
   drums, thunder, high-pitched birds (sunbird/parakeet were in fire-alarm
   frequency range). What remains is *air*, not *music* — the audio is
   ambient atmosphere that supports the bloom-driven music, never competes.

   Per-month distinction comes from:
   - Wind filter colour (cold = darker, warm = brighter, wet = damped)
   - Rain presence (Jun–Sep)
   - Cicada shimmer (dry summer)
   - Whistle pitch (low, gentle, < 700 Hz — never in alarm range)
*/
import * as Tone from 'tone';

/* Per-month config:
   - WND: wind amplitude (0–1)
   - WND_CUT: wind lowpass cutoff Hz — gives each month its "air colour"
   - RNL/RND: light/heavy rain amplitudes
   - CIC: cicada amplitude
   - BRD: whistle amplitude
   - whistle: { from, to, dur } — a single gentle pitch glide
*/
export const AMBIENCE_MONTHS = [
  // Jan — cold dawn, very still, darker air, low robin-ish whistle
  { WND:0.35, WND_CUT:600,  RNL:0, RND:0,    CIC:0,    BRD:0.40, whistle:{ from:520, to:560, dur:0.40 } },
  // Feb — warming, opening up
  { WND:0.40, WND_CUT:900,  RNL:0, RND:0,    CIC:0,    BRD:0.45, whistle:{ from:580, to:640, dur:0.45 } },
  // Mar — dry warm, the koel's gentle rising call
  { WND:0.50, WND_CUT:1400, RNL:0, RND:0,    CIC:0.08, BRD:0.55, whistle:{ from:500, to:650, dur:0.55 } },
  // Apr — hot dry, koel continues
  { WND:0.60, WND_CUT:1700, RNL:0, RND:0,    CIC:0.25, BRD:0.55, whistle:{ from:500, to:660, dur:0.55 } },
  // May — peak heat, cicada chorus, whistle softer
  { WND:0.55, WND_CUT:1800, RNL:0, RND:0,    CIC:0.65, BRD:0.35, whistle:{ from:540, to:600, dur:0.40 } },
  // Jun — first rain, air dampens, whistle gentle
  { WND:0.45, WND_CUT:1000, RNL:0.40, RND:0.10, CIC:0.20, BRD:0.40, whistle:{ from:480, to:560, dur:0.50 } },
  // Jul — full monsoon, soft whistle through rain
  { WND:0.35, WND_CUT:800,  RNL:0.30, RND:0.65, CIC:0,    BRD:0.25, whistle:{ from:460, to:520, dur:0.55 } },
  // Aug — rain breaks, lifting
  { WND:0.40, WND_CUT:1100, RNL:0.35, RND:0.40, CIC:0,    BRD:0.40, whistle:{ from:520, to:600, dur:0.45 } },
  // Sep — clearing, fresh air, oriole-like flute
  { WND:0.45, WND_CUT:1500, RNL:0.15, RND:0.05, CIC:0,    BRD:0.50, whistle:{ from:500, to:700, dur:0.55 } },
  // Oct — cool clear, brighter air
  { WND:0.40, WND_CUT:1600, RNL:0, RND:0,    CIC:0.12, BRD:0.50, whistle:{ from:560, to:680, dur:0.45 } },
  // Nov — cool clarity, dryer
  { WND:0.40, WND_CUT:1300, RNL:0, RND:0,    CIC:0.05, BRD:0.45, whistle:{ from:560, to:640, dur:0.45 } },
  // Dec — cold close, returns to Jan
  { WND:0.35, WND_CUT:650,  RNL:0, RND:0,    CIC:0,    BRD:0.40, whistle:{ from:520, to:560, dur:0.45 } },
];

export function createAmbience(destination) {
  const dest = destination || Tone.getDestination();
  const reverb = new Tone.Reverb({ decay: 6, wet: 0.45 }).connect(dest);
  const master = new Tone.Gain(0.35).connect(reverb);

  // ── Wind — pink noise through a per-month-tunable lowpass + slow autofilter
  const wndNoise = new Tone.Noise('pink').start();
  const wndFilter = new Tone.Filter({ frequency: 1000, type: 'lowpass', Q: 0.4 });
  const wndAuto = new Tone.AutoFilter({ frequency: 0.05, baseFrequency: 300, octaves: 1.5, depth: 0.5, wet: 0.6 }).start();
  const wndGain = new Tone.Gain(0).connect(master);
  wndNoise.connect(wndFilter); wndFilter.connect(wndAuto); wndAuto.connect(wndGain);

  // ── Light rain — gentle band-passed noise
  const rnlNoise = new Tone.Noise('white').start();
  const rnlFilter = new Tone.Filter({ frequency: 2400, type: 'bandpass', Q: 1.0 });
  const rnlGain = new Tone.Gain(0).connect(master);
  rnlNoise.connect(rnlFilter); rnlFilter.connect(rnlGain);

  // ── Heavy monsoon rain drone — pink noise, lowpassed
  const rndNoise = new Tone.Noise('pink').start();
  const rndFilter = new Tone.Filter({ frequency: 700, type: 'lowpass' });
  const rndGain = new Tone.Gain(0).connect(master);
  rndNoise.connect(rndFilter); rndFilter.connect(rndGain);

  // ── Cicada — high band noise with slow tremolo
  const cicNoise = new Tone.Noise('white').start();
  const cicFilter = new Tone.Filter({ frequency: 5500, type: 'bandpass', Q: 6 });
  const cicTremolo = new Tone.Tremolo({ frequency: 12, depth: 0.7 }).start();
  const cicGain = new Tone.Gain(0).connect(master);
  cicNoise.connect(cicFilter); cicFilter.connect(cicTremolo); cicTremolo.connect(cicGain);

  // ── Gentle whistle — single sine, low pitch (well below alarm range),
  //    slow attack, long release. One voice, soft, far away.
  const brdSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.12, decay: 0.15, sustain: 0.65, release: 0.70 },
    portamento: 0.04,
    volume: -28,
  });
  const brdFilter = new Tone.Filter({ frequency: 1600, type: 'lowpass', Q: 0.3 });
  brdSynth.connect(brdFilter); brdFilter.connect(reverb);

  function triggerWhistle(spec, time) {
    if (!spec) return;
    try {
      brdSynth.triggerAttack(spec.from, time);
      brdSynth.frequency.cancelScheduledValues(time);
      brdSynth.frequency.setValueAtTime(spec.from, time);
      brdSynth.frequency.exponentialRampToValueAtTime(spec.to, time + spec.dur * 0.92);
      brdSynth.triggerRelease(time + spec.dur);
    } catch (e) { /* ignore */ }
  }

  // ── State ──
  let targetCfg = AMBIENCE_MONTHS[0];
  let currentMonth = -1;
  let running = false;
  const RAMP = 1.8;

  function rampGain(node, target) {
    if (!running) {
      node.gain.cancelScheduledValues(0);
      node.gain.value = 0;
      return;
    }
    node.gain.rampTo(target, RAMP);
  }

  function applyConfig(cfg) {
    targetCfg = cfg;
    rampGain(wndGain, cfg.WND * 0.14);
    rampGain(rnlGain, cfg.RNL * 0.15);
    rampGain(rndGain, cfg.RND * 0.20);
    rampGain(cicGain, cfg.CIC * 0.10);
    try { wndFilter.frequency.rampTo(cfg.WND_CUT, RAMP); } catch (e) {}
  }

  // Sparse whistle every ~10–25s when active
  const brdLoop = new Tone.Loop((time) => {
    const cfg = targetCfg;
    if (!running || cfg.BRD <= 0.05) return;
    if (Math.random() > cfg.BRD * 0.22) return;
    triggerWhistle(cfg.whistle, time);
  }, '1m').start(0);

  function setMonth(m) {
    const idx = Math.max(0, Math.min(11, m | 0));
    if (idx === currentMonth) return;
    currentMonth = idx;
    applyConfig(AMBIENCE_MONTHS[idx]);
  }

  function start() {
    if (running) return;
    running = true;
    master.gain.rampTo(0.35, 0.5);
    applyConfig(targetCfg);
  }

  function stop() {
    if (!running) return;
    running = false;
    [wndGain, rnlGain, rndGain, cicGain].forEach((g) => g.gain.rampTo(0, 0.8));
    master.gain.rampTo(0, 0.8);
    try { brdSynth.triggerRelease(Tone.now() + 0.1); } catch (e) {}
  }

  function dispose() {
    try { brdLoop.dispose(); } catch (e) {}
    [wndNoise, wndFilter, wndAuto, rnlNoise, rnlFilter, rndNoise, rndFilter,
     cicNoise, cicFilter, cicTremolo,
     wndGain, rnlGain, rndGain, cicGain,
     brdSynth, brdFilter, reverb, master,
    ].forEach((n) => { try { n.dispose(); } catch (e) {} });
  }

  return { setMonth, start, stop, dispose };
}

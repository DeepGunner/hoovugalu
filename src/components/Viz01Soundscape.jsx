import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { SP, M_LONG, hexRgb } from '../data/bloom.js';
import { createAmbience } from '../data/ambience.js';

export default function Viz01Soundscape({ isActive = true }) {
  const cvRef = useRef(null);
  const moLblRef = useRef(null);
  const spLblRef = useRef(null);
  const slRef = useRef(null);
  const playBtnRef = useRef(null);
  const playIconRef = useRef(null);
  const legendRef = useRef(null);
  const ticksRef = useRef(null);
  const isActiveRef = useRef(isActive);
  const ctrlRef = useRef(null);

  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  useEffect(() => {
    const cv = cvRef.current;
    const moLbl = moLblRef.current;
    const spLbl = spLblRef.current;
    const sl = slRef.current;
    const playBtn = playBtnRef.current;
    const playIcon = playIconRef.current;
    const legendEl = legendRef.current;
    const ticksContainer = ticksRef.current;
    if (!cv) return;

    let W, H, dpr, activeM = +sl.value;
    const sceneCv = document.createElement('canvas');
    let SCTX;
    let gl, program, posBuf, tex;
    let uTime, uRes, uSlats, uTex, uBendPhase;
    const NPART = 20;
    let particles = [];

    function _hash(x, y) {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    }
    function _sn(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = _hash(ix, iy), b = _hash(ix + 1, iy), c = _hash(ix, iy + 1), d = _hash(ix + 1, iy + 1);
      return a * (1 - sx) * (1 - sy) + b * sx * (1 - sy) + c * (1 - sx) * sy + d * sx * sy;
    }
    function bloomingThisMonth(m) {
      return SP.slice(1)
        .map((sp) => ({ sp, b: sp.bloom[m], rgb: hexRgb(sp.c) }))
        .filter((x) => x.b >= 12)
        .sort((a, b) => b.b - a.b);
    }
    function initParticles() {
      particles = SP.flatMap((sp) =>
        Array.from({ length: NPART }, () => ({
          sp,
          x: (0.05 + Math.random() * 0.9) * W,
          y: (0.05 + Math.random() * 0.9) * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 0, tr: 0, a: 0, ta: 0,
          phase: Math.random() * Math.PI * 2,
          ps: 0.008 + Math.random() * 0.014,
          nSeed: Math.random() * 100,
        }))
      );
    }
    function setTargets(hlM) {
      const maxR = Math.min(W, H) * 0.38;
      particles.forEach((p) => {
        const bloom = hlM != null ? p.sp.bloom[hlM] : p.sp.bloom.reduce((s, v) => s + v, 0) / 12;
        const isAct = hlM != null && p.sp.bloom[hlM] > 20;
        p.tr = Math.max(maxR * 0.3, (bloom / 100) * maxR * (hlM == null ? 0.85 : isAct ? 1.15 : 0.4));
        p.ta = hlM == null ? 0.5 : isAct ? 0.8 : 0.15;
      });
    }

    const VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

    const FS = `
precision highp float;
uniform sampler2D uTex;
uniform float     uTime;
uniform vec2      uRes;
uniform float     uSlats;
uniform float     uBendPhase;
varying vec2 vUv;

float hash(vec2 p){return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);}
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),         hash(i+vec2(1.0,0.0)), u.x),
             mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<4;i++){ v += a*vnoise(p); p *= 2.07; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = vUv;
  float vCurve = sin(uv.y * 1.6 + uBendPhase) * 0.5 + 0.5;
  uv.x += (vCurve - 0.5) * 0.025;
  float slatI = uv.x * uSlats + uBendPhase * 0.15;
  float fr = fract(slatI);
  float fromCenter = (fr - 0.5) * 2.0;
  float distEdge = abs(fromCenter);
  float refractAmt = -fromCenter * 0.018;
  float disp = 0.003 + 0.010 * distEdge;
  vec2 baseUv = uv;
  float r = texture2D(uTex, baseUv + vec2(refractAmt + disp, 0.0)).r;
  float g = texture2D(uTex, baseUv + vec2(refractAmt, 0.0)).g;
  float b = texture2D(uTex, baseUv + vec2(refractAmt - disp, 0.0)).b;
  vec3 col = vec3(r,g,b);
  vec3 blur = vec3(0.0);
  blur += texture2D(uTex, baseUv + vec2( 0.007,  0.005)).rgb;
  blur += texture2D(uTex, baseUv + vec2(-0.007, -0.005)).rgb;
  blur += texture2D(uTex, baseUv + vec2( 0.005, -0.008)).rgb;
  blur += texture2D(uTex, baseUv + vec2(-0.005,  0.008)).rgb;
  blur += texture2D(uTex, baseUv + vec2( 0.010,  0.000)).rgb;
  blur += texture2D(uTex, baseUv + vec2(-0.010,  0.000)).rgb;
  blur *= (1.0 / 6.0);
  col = mix(col, blur, 0.32);
  float face = mix(0.948, 1.039, 1.0 - distEdge);
  col *= face;
  float centerPeak = smoothstep(0.45, 0.0, distEdge);
  col += col * centerPeak * 0.032;
  float grain = fbm(vUv * vec2(uRes.x, uRes.y) * 0.010 + uTime * 0.015);
  col += (grain - 0.5) * 0.025;
  float micro = hash(vUv * uRes + uTime);
  col += (micro - 0.5) * 0.008;
  gl_FragColor = vec4(col, 1.0);
}`;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    }
    function initGL() {
      try {
        gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: true }) || cv.getContext('experimental-webgl');
      } catch (e) { gl = null; }
      if (!gl) return false;
      const vs = compileShader(gl.VERTEX_SHADER, VS);
      const fs = compileShader(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) return false;
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);
      posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      uTime = gl.getUniformLocation(program, 'uTime');
      uRes = gl.getUniformLocation(program, 'uRes');
      uSlats = gl.getUniformLocation(program, 'uSlats');
      uTex = gl.getUniformLocation(program, 'uTex');
      uBendPhase = gl.getUniformLocation(program, 'uBendPhase');
      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      return true;
    }

    function setup() {
      const par = cv.parentElement;
      const isLanding = !!cv.closest('.landing-inner');
      W = par.clientWidth || 560;
      if (isLanding) {
        H = par.clientHeight || Math.round(W * 0.54);
      } else if (window.innerWidth <= 560) {
        H = Math.round(window.innerHeight * 0.7);
      } else {
        H = Math.round(W * 0.54);
      }
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.height = H + 'px';
      cv.style.width = W + 'px';
      sceneCv.width = Math.round(W * dpr);
      sceneCv.height = Math.round(H * dpr);
      SCTX = sceneCv.getContext('2d');
      SCTX.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (gl) gl.viewport(0, 0, cv.width, cv.height);
    }

    function drawScene() {
      SCTX.save();
      SCTX.setTransform(dpr, 0, 0, dpr, 0, 0);
      const t = performance.now() * 0.0001;
      SCTX.fillStyle = '#F8F2E8';
      SCTX.fillRect(0, 0, W, H);
      const slvC = hexRgb(SP[0].c);
      const slvX = W * (0.48 + 0.20 * _sn(t * 0.25, 1.3));
      const slvY = H * (0.50 + 0.18 * _sn(2.7, t * 0.20));
      const nBloom = bloomingThisMonth(activeM).length;
      SCTX.globalCompositeOperation = 'multiply';
      const slvAlpha = nBloom > 2 ? 0.38 : 0.55;
      const slv = SCTX.createRadialGradient(slvX, slvY, 0, slvX, slvY, Math.max(W, H) * 0.65);
      slv.addColorStop(0, `rgba(${slvC.r},${slvC.g},${slvC.b},${slvAlpha})`);
      slv.addColorStop(0.5, `rgba(${slvC.r},${slvC.g},${slvC.b},${(slvAlpha * 0.5).toFixed(3)})`);
      slv.addColorStop(1, `rgba(${slvC.r},${slvC.g},${slvC.b},0)`);
      SCTX.fillStyle = slv;
      SCTX.fillRect(0, 0, W, H);

      const blooms = bloomingThisMonth(activeM);
      // Render weakest → strongest so the dominant species sits on top and
      // its hue isn't muddied by multiply-blended weaker layers.
      const renderOrder = blooms.slice(0, 3).reverse();
      renderOrder.forEach((entry, i) => {
        const { rgb: c, b } = entry;
        const intensity = b / 100;
        // Strongest species (last drawn) uses source-over for clean colour;
        // earlier layers use multiply for watercolor depth.
        SCTX.globalCompositeOperation = i === renderOrder.length - 1 ? 'source-over' : 'multiply';
        const phase = i * 2.1 + activeM * 0.5;
        const bx = W * (0.25 + 0.5 * _sn(t * 0.3 + i * 3.1, phase));
        const by = H * (0.3 + 0.4 * _sn(phase, t * 0.25 + i * 2.7));
        const rad = Math.max(W, H) * (0.4 + intensity * 0.25);
        const grad = SCTX.createRadialGradient(bx, by, 0, bx, by, rad);
        const peakA = i === renderOrder.length - 1 ? intensity * 0.85 : intensity * 0.5;
        grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${peakA.toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},${(peakA * 0.55).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
        SCTX.fillStyle = grad;
        SCTX.fillRect(0, 0, W, H);
      });
      SCTX.globalCompositeOperation = 'source-over';

      const breezeT = t * 0.8;
      const pAlphaScale = nBloom > 2 ? 0.55 : 0.72;
      particles.forEach((p) => {
        const nx = (_sn(p.x * 0.003 + breezeT, p.y * 0.003 + p.nSeed) - 0.5) * 0.6;
        const ny = (_sn(p.y * 0.003 + p.nSeed, p.x * 0.003 + breezeT) - 0.5) * 0.4;
        p.vx += nx * 0.02; p.vy += ny * 0.02;
        p.vx *= 0.992; p.vy *= 0.992;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -120) p.x = W + 60;
        if (p.x > W + 120) p.x = -60;
        if (p.y < -120) p.y = H + 60;
        if (p.y > H + 120) p.y = -60;
        p.r += (p.tr - p.r) * 0.035;
        p.a += (p.ta - p.a) * 0.035;
        p.phase += p.ps;
        if (p.r < 1 || p.a < 0.01) return;
        const pr = p.r * (1 + 0.08 * Math.sin(p.phase));
        const { r, g, b } = hexRgb(p.sp.c);
        const grad = SCTX.createRadialGradient(p.x, p.y, 0, p.x, p.y, pr);
        grad.addColorStop(0, `rgba(${r},${g},${b},${(p.a * pAlphaScale).toFixed(3)})`);
        grad.addColorStop(0.45, `rgba(${r},${g},${b},${(p.a * pAlphaScale * 0.43).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        SCTX.beginPath();
        SCTX.arc(p.x, p.y, pr, 0, Math.PI * 2);
        SCTX.fillStyle = grad;
        SCTX.fill();
      });
      SCTX.globalCompositeOperation = 'source-over';
      SCTX.restore();
    }

    let fallback2d = null;
    function drawGlass2DFallback() {
      if (!fallback2d) fallback2d = cv.getContext('2d');
      fallback2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      fallback2d.drawImage(sceneCv, 0, 0, W, H);
    }
    function drawGlass() {
      if (!gl) { drawGlass2DFallback(); return; }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sceneCv);
      gl.useProgram(program);
      const t = performance.now() * 0.001;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uSlats, Math.max(26, W / 22));
      gl.uniform1f(uBendPhase, t * 0.15);
      gl.uniform1i(uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    let rafId = null;
    let running = false;
    function tick() {
      if (!running) return;
      drawScene();
      drawGlass();
      rafId = requestAnimationFrame(tick);
    }
    function startLoop() {
      if (running) return;
      running = true;
      tick();
    }
    function stopLoop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    // Audio
    let audioReady = false, blossomSynth, droneSynth, reverb, soundLoop;
    let ambience = null;
    let currentSeason = null;
    const SCALES = {
      // Lower-register scales for spring (Mar–Apr) and monsoon (May–Aug):
      // the high notes (A5, F#5, F5, Eb5) read as piercing on phone
      // speakers when struck cold. Trimmed to keep just the warm middle
      // register so the attack feels rounded instead of sharp.
      spring: ['E3', 'F#3', 'A3', 'B3', 'C#4', 'E4', 'F#4', 'A4'],
      monsoon: ['C3', 'Eb3', 'F3', 'G3', 'Bb3', 'C4', 'Eb4', 'F4'],
      autumn: ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5'],
      winter: ['C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5'],
    };
    const DRONE = {
      spring: ['E2', 'B2', 'G#3'],
      monsoon: ['C2', 'G2', 'Eb3'],
      autumn: ['A1', 'E2', 'C3'],
      winter: ['D2', 'A2', 'C3'],
    };
    function getSeason(m) {
      if (m >= 1 && m <= 4) return 'spring';
      if (m >= 5 && m <= 8) return 'monsoon';
      if (m >= 9 && m <= 10) return 'autumn';
      return 'winter';
    }
    async function initAudio() {
      if (audioReady) return;
      await Tone.start();
      reverb = new Tone.Reverb({ decay: 9, wet: 0.84 }).toDestination();
      const dly = new Tone.FeedbackDelay('8n.', 0.20).connect(reverb);
      // Softer attack (0.5 → 1.4) so notes fade in like petals instead of
      // striking on, with a touch quieter overall volume.
      blossomSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 1.4, decay: 2.4, sustain: 0.10, release: 6 },
        volume: -16,
      }).connect(dly);
      droneSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsine', count: 3, spread: 12 },
        envelope: { attack: 6, decay: 0, sustain: 1, release: 10 },
        volume: -28,
      }).connect(reverb);
      ambience = createAmbience(reverb);
      ambience.setMonth(activeM);
      audioReady = true;
    }
    function startSoundscape(hlM) {
      if (!audioReady) return;
      const season = getSeason(hlM);
      if (season !== currentSeason) {
        droneSynth.releaseAll(Tone.now() + 1.5);
        const t = Tone.now() + 2;
        DRONE[season].forEach((n) => droneSynth.triggerAttack(n, t));
        currentSeason = season;
      }
      if (soundLoop) { soundLoop.dispose(); Tone.Transport.stop(); }
      const scale = SCALES[season];
      soundLoop = new Tone.Loop((time) => {
        SP.forEach((sp) => {
          if (sp.id === 'SLV') return;
          const prob = (sp.bloom[hlM] / 100) * 0.26;
          if (Math.random() < prob) {
            const note = scale[Math.floor(Math.random() * scale.length)];
            blossomSynth.triggerAttackRelease(note, '4n', time + Math.random() * 1.6);
          }
        });
      }, '2n');
      soundLoop.start(0);
      Tone.Transport.start();
      if (ambience) ambience.start();
    }

    let isPlaying = false, firstTouch = false;
    const ICON_PLAY = '<polygon points="7,4 19,12 7,20" fill="currentColor"/>';
    const ICON_PAUSE = '<rect x="5" y="4" width="4.5" height="16" rx="1" fill="currentColor"/>' +
      '<rect x="14.5" y="4" width="4.5" height="16" rx="1" fill="currentColor"/>';
    function setPlayState(playing) {
      isPlaying = playing;
      playIcon.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
      playBtn.classList.toggle('is-playing', playing);
      playBtn.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    }
    async function togglePlay() {
      if (!firstTouch) {
        firstTouch = true;
        await initAudio();
        startSoundscape(activeM);
        setPlayState(true);
        return;
      }
      if (isPlaying) {
        if (audioReady) {
          Tone.Transport.pause();
          droneSynth.releaseAll(Tone.now() + 0.5);
          currentSeason = null;
          if (ambience) ambience.stop();
        }
        setPlayState(false);
      } else {
        if (audioReady) startSoundscape(activeM);
        setPlayState(true);
      }
    }
    playBtn.addEventListener('click', togglePlay);

    function buildLegend(m) {
      legendEl.innerHTML = '';
      SP.forEach((sp) => {
        const blooming = sp.bloom[m] >= 20 || sp.id === 'SLV';
        const item = document.createElement('span');
        item.className = 'leg-item' + (blooming ? '' : ' dim');
        item.innerHTML = `<span class="leg-dot" style="background:${sp.c}"></span>${sp.id}`;
        item.title = `${sp.name} — ${sp.bloom[m]}% bloom`;
        legendEl.appendChild(item);
      });
    }

    const tickEls = ticksContainer.querySelectorAll('span');
    function highlightTick(m) {
      tickEls.forEach((el, i) => el.classList.toggle('active', i === m));
    }
    const tickHandlers = [];
    tickEls.forEach((el, i) => {
      const h = async () => {
        sl.value = i;
        if (!firstTouch) { firstTouch = true; await initAudio(); setPlayState(true); }
        update(i);
      };
      el.addEventListener('click', h);
      tickHandlers.push({ el, h });
    });

    function update(m) {
      activeM = m;
      // Sync the slider fill split with the thumb position
      try { sl.style.setProperty('--slider-pct', (m / 11 * 100) + '%'); } catch (e) {}
      moLbl.textContent = M_LONG[m];
      const nonSlv = SP.filter((s) => s.id !== 'SLV');
      const active = nonSlv.filter((s) => s.bloom[m] > 20);
      // Build a chip per blooming tree (colored dot + name). Render two
      // identical copies so the mobile marquee animation can loop seamlessly
      // by translating -50% of the doubled width.
      const slv = SP[0]; // Silver Oak always present
      const trees = [slv, ...active];
      const chipsHTML = trees.map((s) =>
        `<span class="r-sp-chip"><span class="r-sp-dot" style="background:${s.c}"></span>${s.name}</span>`
      ).join('<span class="r-sp-sep">·</span>');
      spLbl.innerHTML =
        `<span class="r-sp-inner">${chipsHTML}</span>` +
        `<span class="r-sp-inner" aria-hidden="true">${chipsHTML}</span>`;
      setTargets(m);
      highlightTick(m);
      buildLegend(m);
      if (audioReady && isPlaying) startSoundscape(m);
      if (ambience) ambience.setMonth(m);
    }

    initGL();
    setup();
    initParticles();
    setTargets(+sl.value);
    update(+sl.value);

    // External pause/resume tied to snap activation. Pauses RAF and Tone Transport;
    // resumes the loop and restarts the soundscape if it was playing.
    function pauseExternal() {
      stopLoop();
      if (isPlaying && audioReady) {
        try {
          Tone.Transport.pause();
          droneSynth.releaseAll(Tone.now() + 0.3);
          currentSeason = null;
          if (ambience) ambience.stop();
        } catch (e) { /* ignore */ }
      }
    }
    function resumeExternal() {
      if (running) return;
      // One extra paint to flush any size/state drift before the loop restarts.
      drawScene();
      drawGlass();
      startLoop();
      if (isPlaying && audioReady) {
        try { startSoundscape(activeM); } catch (e) { /* ignore */ }
      }
    }
    ctrlRef.current = { pauseExternal, resumeExternal };

    if (isActiveRef.current) startLoop();

    const onSlInput = async () => {
      if (!firstTouch) { firstTouch = true; await initAudio(); setPlayState(true); }
      update(+sl.value);
    };
    sl.addEventListener('input', onSlInput);
    const onResize = () => {
      setup();
      particles.forEach((p) => {
        p.x = Math.min(Math.max(p.x, 0), W);
        p.y = Math.min(Math.max(p.y, 0), H);
      });
    };
    window.addEventListener('resize', onResize);

    return () => {
      stopLoop();
      ctrlRef.current = null;
      playBtn.removeEventListener('click', togglePlay);
      sl.removeEventListener('input', onSlInput);
      window.removeEventListener('resize', onResize);
      tickHandlers.forEach(({ el, h }) => el.removeEventListener('click', h));
      try {
        if (ambience) { ambience.dispose(); ambience = null; }
        if (soundLoop) soundLoop.dispose();
        if (Tone.Transport) Tone.Transport.stop();
        if (droneSynth) droneSynth.dispose();
        if (blossomSynth) blossomSynth.dispose();
        if (reverb) reverb.dispose();
      } catch (e) { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    const c = ctrlRef.current;
    if (!c) return;
    if (isActive) c.resumeExternal();
    else c.pauseExternal();
  }, [isActive]);

  return (
    <section className="vs" id="v1">
      <div className="vs-num">Soundscape</div>
      <h2 className="vs-title">Listen to the city bloom.</h2>
      <p className="vs-desc">
        Move the slider across the months to watch the canopy shift color and hear the landscape translate into a full-color symphony.
      </p>
      <div className="vs-frame">
        <div className="canvas-slot">
          <canvas id="relay-cv" ref={cvRef} style={{ display: 'block' }} aria-label="Stratigraphic waveform" />
          <div className="player-card" role="group" aria-label="Soundscape player">
            <div className="r-info">
              <button id="r-play" className="play-btn" ref={playBtnRef} aria-label="Play music" title="Play / Pause">
                <svg id="r-play-icon" ref={playIconRef} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="6,3 20,12 6,21" fill="currentColor" />
                </svg>
              </button>
              <span className="r-mo" id="r-mo" ref={moLblRef}></span>
              <span className="r-sp" id="r-sp" ref={spLblRef}></span>
            </div>
            <div className="ctrl-row">
              <input type="range" id="r-sl" ref={slRef} min="0" max="11" defaultValue="4" step="1" />
            </div>
            <div className="mo-ticks" id="r-ticks" ref={ticksRef}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <span key={m} style={{ '--mi': i }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="tree-legend" id="tree-legend" ref={legendRef}></div>
      </div>
    </section>
  );
}

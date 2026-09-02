// src/components/OrbitDashboard/orbitSfx.js
// Tiny synthesized sound-effect kit for the module journey path — no audio
// assets, just WebAudio oscillators, so there's nothing to fetch/license.
// Every call is wrapped defensively: browsers without WebAudio (or a
// suspended context pre-gesture) just silently no-op.

let sharedCtx = null;

function getCtx() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!sharedCtx) sharedCtx = new AC();
    if (sharedCtx.state === "suspended") sharedCtx.resume().catch(() => {});
    return sharedCtx;
  } catch (_) {
    return null;
  }
}

function tone(freq, { duration = 0.12, type = "sine", gain = 0.06, delay = 0, glideTo } = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const t0 = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  } catch (_) {}
}

export const orbitSfx = {
  hover() {
    tone(880, { duration: 0.05, gain: 0.03, type: "sine" });
  },
  select() {
    tone(523.25, { duration: 0.09, gain: 0.07, type: "triangle" });
    tone(783.99, { duration: 0.13, gain: 0.05, type: "triangle", delay: 0.05 });
  },
  locked() {
    tone(200, { duration: 0.18, gain: 0.055, type: "sawtooth", glideTo: 90 });
  },
  complete() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, { duration: 0.2, gain: 0.05, type: "triangle", delay: i * 0.08 })
    );
  },
};

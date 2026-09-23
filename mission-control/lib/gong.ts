/**
 * Asiatischer Gong — Web Audio API synthesis.
 * Inharmonic metal percussion partials, warm attack, long decay.
 * No external file required.
 */
export function playGong() {
  if (typeof window === 'undefined') return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const t = ctx.currentTime;

    // Master compressor for natural limiting
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.005;
    comp.release.value = 0.25;
    comp.connect(ctx.destination);

    // Reverb convolver (impulse response synthesis)
    const reverbLen = ctx.sampleRate * 3.5;
    const irBuf     = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = irBuf.getChannelData(ch);
      for (let i = 0; i < reverbLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLen, 1.8);
      }
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = irBuf;
    reverb.connect(comp);

    const dry = ctx.createGain();
    dry.gain.value = 0.62;
    dry.connect(comp);

    const wet = ctx.createGain();
    wet.gain.value = 0.38;
    wet.connect(reverb);

    // Inharmonic partials of a bronze singing-bowl / gong (ratios vs fundamental)
    // Fundamental ≈ 110 Hz (A2) — warm and resonant
    const hz = 110;
    const partials: Array<{ ratio: number; gain: number; decay: number; vibrato?: number }> = [
      { ratio: 1.000, gain: 0.55, decay: 5.5 },          // fundamental
      { ratio: 2.242, gain: 0.30, decay: 4.0 },          // 2nd partial (inharmonic)
      { ratio: 3.811, gain: 0.18, decay: 2.8 },          // 3rd partial
      { ratio: 5.331, gain: 0.10, decay: 1.8 },          // 4th partial
      { ratio: 7.140, gain: 0.06, decay: 1.2 },          // 5th — shimmer
      { ratio: 9.600, gain: 0.03, decay: 0.7 },          // 6th — bell top
    ];

    partials.forEach(({ ratio, gain: pk, decay }) => {
      const freq = hz * ratio;

      // Oscillator
      const osc = ctx.createOscillator();
      osc.type = ratio < 2 ? 'sine' : 'triangle'; // sine for fundamentals, triangle adds brightness
      osc.frequency.setValueAtTime(freq, t);
      // Slight natural frequency droop (metal cools after strike)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.998, t + decay);

      // Amplitude envelope: fast attack, exponential decay
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(pk, t + 0.008);   // ~8ms attack (crisp strike)
      env.gain.exponentialRampToValueAtTime(0.0001, t + decay);

      osc.connect(env);
      env.connect(dry);
      env.connect(wet);
      osc.start(t);
      osc.stop(t + decay + 0.1);
    });

    // Strike transient: a short noise burst filtered to "thock"
    const noiseLen = Math.floor(ctx.sampleRate * 0.04);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nData    = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nData[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 0.7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(dry);
    noise.start(t);
    noise.stop(t + 0.05);

    // Auto-close after decay to avoid resource leak
    setTimeout(() => ctx.close().catch(() => {}), 8000);
  } catch {
    // Browser may block AudioContext before user gesture — silently ignore
  }
}

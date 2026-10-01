/** Optional local output meter. Failure must leave native audio playback usable. */
export function observePlayback(
  player: HTMLAudioElement,
  onLevel: (level: number) => void,
) {
  let context: AudioContext | null = null;
  let stopped = false,
    frame = 0,
    previous = -1,
    last = 0;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    // Caller pauses the player first: closing a connected context stops its output.
    void context?.close().catch(() => {});
    onLevel(0);
  };
  try {
    context = new AudioContext();
    const ctx = context;
    void ctx
      .resume()
      .then(() => {
        // Never reroute the element into a suspended context (e.g. iOS gesture policy).
        if (stopped || ctx.state !== "running") return;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        const source = ctx.createMediaElementSource(player);
        source.connect(ctx.destination);
        source.connect(analyser);
        const values = new Float32Array(512);
        const tick = (now: number) => {
          if (stopped) return;
          if (now - last >= 50) {
            last = now;
            analyser.getFloatTimeDomainData(values);
            const rms = Math.sqrt(
              values.reduce((sum, v) => sum + v * v, 0) / values.length,
            );
            const level =
              player.paused || player.muted
                ? 0
                : Math.round(Math.min(1, rms * player.volume * 8) * 20) / 20;
            if (previous !== level) {
              previous = level;
              onLevel(level);
            }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      })
      .catch(() => {
        /* No meter is preferable to interrupting speech. */
      });
  } catch {
    /* Web Audio is optional; the audio element still plays. */
  }
  return stop;
}

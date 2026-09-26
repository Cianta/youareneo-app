/** Preserve edits made while transcription was running; never overwrite newer text. */
export function insertTranscript(
  current: string,
  original: string,
  start: number,
  end: number,
  transcript: string,
) {
  if (current !== original) start = end = current.length;
  const prefix = current.slice(0, start),
    suffix = current.slice(end),
    text = transcript.trim();
  const addition =
    (prefix && !/\s$/.test(prefix) ? " " : "") +
    text +
    (suffix && !/^\s/.test(suffix) ? " " : "");
  return { value: prefix + addition + suffix, cursor: start + addition.length };
}

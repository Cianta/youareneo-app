/** Local dates must not shift to yesterday when converted to UTC. */
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function remainingSeconds(
  deadline: number | null,
  fallback: number,
  now = Date.now(),
): number {
  return deadline === null
    ? fallback
    : Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function formatCountdown(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
export function validWebUrl(input: string): string | null {
  try {
    const url = new URL(input);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function overlaps(
  a: { startTime?: string; endTime?: string },
  b: { startTime?: string; endTime?: string },
): boolean {
  return !!(
    a.startTime &&
    a.endTime &&
    b.startTime &&
    b.endTime &&
    a.startTime < b.endTime &&
    b.startTime < a.endTime
  );
}

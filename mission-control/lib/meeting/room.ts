export function roomUrl(raw: string) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      u.href.length <= 2000
      ? u.href
      : null;
  } catch {
    return null;
  }
}

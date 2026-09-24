export function youtubeId(input: string): string | null {
  try {
    const u = new URL(input);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const h = u.hostname.toLowerCase();
    let id: string | null = null;
    if (h === "youtu.be") id = u.pathname.slice(1);
    else if (
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "www.youtube-nocookie.com",
      ].includes(h)
    )
      id =
        u.pathname === "/watch"
          ? u.searchParams.get("v")
          : (u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)$/)?.[1] ??
            null);
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export const DEFAULT_WORK = {
  id: "trinity-work-original",
  name: "Trinity · Waldlicht / Arbeitsfluss",
  dataUrl: "/audio/trinity-work.mp3",
  size: 0,
};
export const DEFAULT_REST = {
  id: "trinity-rest-original",
  name: "Trinity · Abendstille / Pause",
  dataUrl: "/audio/trinity-rest.mp3",
  size: 0,
};

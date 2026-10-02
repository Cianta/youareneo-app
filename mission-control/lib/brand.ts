export type Brand = { appName: string; assistantName: string };
export function brandConfig(): Brand {
  // Dynamic lookup keeps public labels configurable at server runtime in Docker.
  const read = (key: string, fallback: string) =>
    (process.env[key]?.trim() || fallback).slice(0, 80);
  return {
    appName: read("NEXT_PUBLIC_APP_NAME", "guiding.space"),
    assistantName: read("NEXT_PUBLIC_ASSISTANT_NAME", "Trinity"),
  };
}

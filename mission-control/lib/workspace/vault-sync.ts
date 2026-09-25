export type SyncAction = "same" | "write" | "import" | "conflict";
/** Three-way reconciliation; absence never means deletion. */
export function syncAction(
  local: string,
  disk: string | null,
  base?: string,
): SyncAction {
  if (disk === local) return "same";
  if (disk === null) return base ? "conflict" : "write";
  if (base === undefined) return "conflict";
  if (disk === base) return "write";
  if (local === base) return "import";
  return "conflict";
}
export function parseVaultMarkdown(raw: string, name: string) {
  const front = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const fields: Record<string, string> = {};
  front?.[1].split(/\r?\n/).forEach((line) => {
    const match = line.match(/^(id|title|area): (.*)$/);
    if (match) {
      try {
        fields[match[1]] = JSON.parse(match[2]);
      } catch {
        fields[match[1]] = match[2];
      }
    }
  });
  const content = front ? raw.slice(front[0].length).trim() : raw.trim();
  const title =
    fields.title || content.match(/^# (.+)/)?.[1] || name.replace(/\.md$/i, "");
  const body = fields.id
    ? content
        .replace(/^# [^\n]+\n*/, "")
        .replace(/\n+## Verbindungen\n[\s\S]*$/, "")
        .trim()
    : content;
  return { id: fields.id, title, area: fields.area, body };
}

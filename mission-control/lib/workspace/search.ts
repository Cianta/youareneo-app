import type { Destination } from "./navigation";
export type SearchItem = Destination;
export const normalize = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("de").trim();
export function rankItems(
  items: SearchItem[],
  query: string,
  recent: readonly string[] = [],
) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return items
    .filter((item) =>
      words.every((word) =>
        normalize(
          `${item.label} ${item.keywords || ""} ${item.group}`,
        ).includes(word),
      ),
    )
    .sort((a, b) => {
      const rank = (id: string) => {
        const i = recent.indexOf(id);
        return i < 0 ? 10000 : i;
      };
      const match = (item: SearchItem) =>
        normalize(item.label) === normalize(query)
          ? 0
          : normalize(item.label).startsWith(normalize(query))
            ? 1
            : 2;
      return (
        rank(a.id) - rank(b.id) ||
        match(a) - match(b) ||
        a.label.localeCompare(b.label, "de")
      );
    });
}
export function moveSelection(index: number, key: string, count: number) {
  if (!count) return -1;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowDown") return (index + 1) % count;
  if (key === "ArrowUp") return (index - 1 + count) % count;
  return Math.min(Math.max(index, 0), count - 1);
}
export function isEditing(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    !!target.closest('input, textarea, select, [contenteditable="true"]')
  );
}
export function recentIds(raw: string | null): string[] {
  try {
    const ids: unknown = JSON.parse(raw || "[]");
    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string").slice(0, 12)
      : [];
  } catch {
    return [];
  }
}
export function noteItems(
  notes: { id: string; title: string; type: string; tags: string[] }[],
): SearchItem[] {
  return notes.map((n) => ({
    id: `note-${n.id}`,
    label: n.title,
    href: `/notiz?note=${encodeURIComponent(n.id)}`,
    group: n.type === "aufgabe" ? "Eigene Aufgaben" : "Eigene Notizen",
    keywords: n.tags.join(" "),
  }));
}

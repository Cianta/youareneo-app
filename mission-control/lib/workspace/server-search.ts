import type { SupabaseClient } from "@supabase/supabase-js";
import { noteItems, type SearchItem } from "./search";
export async function searchOwnContent(
  sb: SupabaseClient,
  userId: string,
  q: string,
): Promise<SearchItem[]> {
  let notes = sb
    .from("trinity_notes")
    .select("id,title,type,tags")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (q)
    notes = notes.textSearch("search_document", q, {
      type: "websearch",
      config: "german",
    });
  let projects = sb
    .from("trinity_projects")
    .select("name")
    .eq("user_id", userId)
    .order("name")
    .limit(20);
  if (q) projects = projects.ilike("name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  // Fixed number of owner-scoped requests; never query legacy shared files/stores.
  const [n, p, t] = await Promise.all([
    notes,
    projects,
    q
      ? sb
          .from("trinity_notes")
          .select("id,title,type,tags")
          .eq("user_id", userId)
          .contains("tags", [q.replace(/^#/, "").toLocaleLowerCase("de")])
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (n.error || p.error || t.error) throw n.error || p.error || t.error;
  const unique = [
    ...new Map(
      [...(n.data || []), ...(t.data || [])].map((n) => [n.id, n]),
    ).values(),
  ];
  const items: SearchItem[] = [
    ...noteItems(unique),
    ...(p.data || []).map((p) => ({
      id: `project-${p.name}`,
      label: p.name,
      href: `/notiz?project=${encodeURIComponent(p.name)}`,
      group: "Eigene Projekte",
    })),
    ...[...new Set(unique.flatMap((n) => n.tags as string[]))]
      .slice(0, 20)
      .map((tag) => ({
        id: `tag-${tag}`,
        label: `#${tag}`,
        href: `/notiz?tag=${encodeURIComponent(tag)}`,
        group: "Eigene Tags",
      })),
  ];
  return items;
}

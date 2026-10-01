import type { SupabaseClient } from "@supabase/supabase-js";
import { buildGraph, type BrainGraph, type Snapshot } from "./graph";
// Private, process-local, bounded cache. Session verification happens on every request.
const cache = new Map<string, { expires: number; graph: BrainGraph }>();
export async function ownGraph(
  sb: SupabaseClient,
  owner: string,
  refresh = false,
) {
  const now = Date.now(),
    hit = cache.get(owner);
  if (!refresh && hit && hit.expires > now) return hit.graph;
  const { data, error } = await sb.rpc("trinity_brain_snapshot");
  if (error) throw error;
  const graph = buildGraph(data as Snapshot, owner);
  for (const [id, item] of cache) if (item.expires <= now) cache.delete(id);
  if (cache.size >= 32) cache.delete(cache.keys().next().value!);
  cache.set(owner, { expires: now + 30000, graph });
  return graph;
}

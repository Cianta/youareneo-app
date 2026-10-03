import { NODE_TYPES, type BrainGraph, type BrainNode } from "./graph";
export function brainInsights(
  graph: BrainGraph,
  nodes: BrainNode[],
  now = new Date(),
) {
  const ids = new Set(nodes.map((n) => n.id));
  const links = graph.links.filter(
    (l) => ids.has(l.source) && ids.has(l.target),
  );
  const connected = new Set(links.flatMap((l) => [l.source, l.target]));
  const types = NODE_TYPES.map((type) => ({
    type,
    count: nodes.filter((n) => n.type === type).length,
  }));
  const topics = nodes
    .filter((n) => n.type === "tag")
    .map((n) => ({
      ...n,
      visibleDegree: links.filter((l) => l.source === n.id || l.target === n.id)
        .length,
    }))
    .sort((a, b) => b.visibleDegree - a.visibleDegree)
    .slice(0, 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    const date = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
    return {
      date,
      label: d.toLocaleDateString("de-AT", { weekday: "short" }),
      count: nodes.filter(
        (n) =>
          (n.type === "notiz" || n.type === "aufgabe") &&
          n.createdAt.slice(0, 10) === date,
      ).length,
    };
  });
  return {
    types,
    topics,
    days,
    links: links.length,
    connected: connected.size,
    unlinked: nodes.filter(
      (n) =>
        (n.type === "notiz" || n.type === "aufgabe") && !connected.has(n.id),
    ),
  };
}

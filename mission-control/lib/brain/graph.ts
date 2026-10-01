export const NODE_TYPES = [
  "notiz",
  "projekt",
  "aufgabe",
  "tag",
  "person",
  "hermes",
] as const;
export type NodeType = (typeof NODE_TYPES)[number];
export type BrainNode = {
  id: string;
  label: string;
  type: NodeType;
  summary: string;
  href: string;
  createdAt: string;
  degree: number;
  x?: number;
  y?: number;
  z?: number;
};
export type BrainLink = { source: string; target: string; kind: string };
export type BrainGraph = {
  nodes: BrainNode[];
  links: BrainLink[];
  truncated: boolean;
};
type Note = {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  transcript: string;
  type: string;
  project: string | null;
  tags: string[];
  assignee: string | null;
  created_at: string;
};
export type Snapshot = {
  notes: Note[];
  projects: { name: string; user_id: string; created_at: string }[];
  queue: {
    note_id: string;
    user_id: string;
    status: string;
    created_at: string;
  }[];
  truncated?: boolean;
};
const key = (s: string) => s.normalize("NFKC").toLocaleLowerCase("de").trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function buildGraph(
  raw: Snapshot,
  owner: string,
  cap = 2000,
): BrainGraph {
  const nodes = new Map<string, BrainNode>(),
    links = new Map<string, BrainLink>();
  let truncated = !!raw.truncated;
  const add = (node: Omit<BrainNode, "degree">) => {
    if (nodes.has(node.id)) return true;
    if (nodes.size >= cap) {
      truncated = true;
      return false;
    }
    nodes.set(node.id, { ...node, degree: 0 });
    return true;
  };
  const link = (source: string, target: string, kind: string) => {
    if (source === target || !nodes.has(source) || !nodes.has(target)) return;
    const id = source + "\0" + target + "\0" + kind;
    if (!links.has(id)) {
      links.set(id, { source, target, kind });
      nodes.get(source)!.degree++;
      nodes.get(target)!.degree++;
    }
  };
  const notes = raw.notes.filter((n) => n.user_id === owner).slice(0, 1000);
  const projects = raw.projects
    .filter((p) => p.user_id === owner)
    .slice(0, 200);
  for (const n of notes)
    add({
      id: "note:" + n.id,
      label: n.title,
      type: n.type === "aufgabe" ? "aufgabe" : "notiz",
      summary: (n.summary || n.transcript).slice(0, 600),
      href: "/notiz?note=" + encodeURIComponent(n.id),
      createdAt: n.created_at,
    });
  for (const p of projects)
    add({
      id: "project:" + p.name,
      label: p.name,
      type: "projekt",
      summary: "Dein Projekt",
      href: "/notiz?project=" + encodeURIComponent(p.name),
      createdAt: p.created_at,
    });
  const projectPatterns = projects.map((p) => ({
    p,
    re: new RegExp(
      "(?:^|[^\\p{L}\\p{N}_])@(?:" +
        escape(p.name) +
        "|\\[" +
        escape(p.name) +
        "\\])(?=$|[^\\p{L}\\p{N}_])",
      "iu",
    ),
  }));
  for (const n of notes) {
    const id = "note:" + n.id;
    if (!nodes.has(id)) continue;
    if (n.project) link(id, "project:" + n.project, "projekt");
    const text = n.title + "\n" + n.summary + "\n" + n.transcript;
    for (const { p, re } of projectPatterns)
      if (re.test(text)) link(id, "project:" + p.name, "erwaehnung");
    const tags = new Set(
      [
        ...n.tags,
        ...Array.from(
          text.matchAll(/(?:^|[^\p{L}\p{N}_])#([\p{L}\p{N}_-]{1,100})/gu),
          (m) => m[1],
        ),
      ]
        .map(key)
        .filter(Boolean),
    );
    for (const tag of tags) {
      const tid = "tag:" + tag;
      add({
        id: tid,
        label: "#" + tag,
        type: "tag",
        summary: "Gemeinsames Thema deiner Notizen",
        href: n.tags.some((t) => key(t) === tag)
          ? "/notiz?tag=" + encodeURIComponent(tag)
          : "/notiz?note=" + encodeURIComponent(n.id),
        createdAt: n.created_at,
      });
      link(id, tid, "tag");
    }
    if (n.assignee?.trim()) {
      const person = n.assignee.trim(),
        pid = "person:" + key(person);
      add({
        id: pid,
        label: person,
        type: "person",
        summary:
          "Zuständigkeitsangabe aus deinen Notizen; kein externes Personenprofil.",
        href: "/notiz?note=" + encodeURIComponent(n.id),
        createdAt: n.created_at,
      });
      link(id, pid, "zustaendig");
    }
  }
  for (const q of raw.queue) {
    if (q.user_id !== owner || !nodes.has("note:" + q.note_id)) continue;
    const id = "hermes:" + q.note_id;
    add({
      id,
      label: "Hermes · " + q.status.replaceAll("_", " "),
      type: "hermes",
      summary:
        "Auftrag zur verknüpften Notiz. Eine Freigabe ist nur im Notizraum möglich.",
      href: "/notiz?note=" + encodeURIComponent(q.note_id),
      createdAt: q.created_at,
    });
    link("note:" + q.note_id, id, "hermes");
  }
  return { nodes: [...nodes.values()], links: [...links.values()], truncated };
}
export function filterGraph(
  graph: BrainGraph,
  types: readonly NodeType[],
  since: string,
): BrainGraph {
  // Date applies to source notes/tasks and jobs. Keep their related context nodes.
  const time = since ? Date.parse(since) : 0;
  const recent = new Set(
    graph.nodes
      .filter((n) => !time || Date.parse(n.createdAt) >= time)
      .map((n) => n.id),
  );
  if (time)
    for (const l of graph.links) if (recent.has(l.source)) recent.add(l.target);
  const nodes = graph.nodes.filter(
    (n) => types.includes(n.type) && recent.has(n.id),
  );
  const ids = new Set(nodes.map((n) => n.id));
  return {
    ...graph,
    nodes,
    links: graph.links.filter((l) => ids.has(l.source) && ids.has(l.target)),
  };
}
export function matchesNode(node: BrainNode, q: string) {
  const terms = key(q).split(/\s+/).filter(Boolean);
  const hay = key(node.label + " " + node.summary);
  return terms.every((t) => hay.includes(t));
}

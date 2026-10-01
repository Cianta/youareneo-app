import type { BrainGraph, BrainNode, NodeType } from "@/lib/brain/graph";
// Existing forest, sage, gold, cyan and lavender theme accents.
export const colors: Record<NodeType, string> = {
  notiz: "#A8C5A0",
  projekt: "#D4AF37",
  aufgabe: "#A78BFA",
  tag: "#22D3EE",
  person: "#D4A574",
  hermes: "#2DD4BF",
};
export const labels: Record<NodeType, string> = {
  notiz: "Notizen",
  projekt: "Projekte",
  aufgabe: "Aufgaben",
  tag: "Tags",
  person: "Personen",
  hermes: "Hermes",
};
export type RendererProps = {
  data: BrainGraph;
  width: number;
  height: number;
  query: string;
  selected: string | null;
  onSelect: (node: BrainNode) => void;
  reduced: boolean;
  onFail?: () => void;
};
export function tooltip(n: BrainNode) {
  return n.label.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

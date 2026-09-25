export interface BrainNode {
  id: string;
  title: string;
  kind: string;
  area: string;
  body: string;
  href?: string;
  links: string[];
}
export function fileName(node: BrainNode) {
  return `${node.title.replace(/[<>:"/\\|?*\x00-\x1f\[\]#^]/g, "-").slice(0, 65) || "Eintrag"}--${node.id.replace(/[^a-zA-Z0-9_-]/g, "-")}.md`;
}
export function markdownFile(node: BrainNode, nodes: BrainNode[]) {
  return `---\nid: ${JSON.stringify(node.id)}\ntitle: ${JSON.stringify(node.title)}\ntype: ${JSON.stringify(node.kind)}\narea: ${JSON.stringify(node.area)}\n---\n\n# ${node.title}\n\n${node.body}\n\n## Verbindungen\n\n${
    node.links
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n): n is BrainNode => !!n)
      .map(
        (n) =>
          `- [[${fileName(n).slice(0, -3)}|${n.title.replace(/[\[\]|]/g, "")}]]`,
      )
      .join("\n") || "Noch keine Verbindungen."
  }\n`;
}
export function neighbors(nodes: BrainNode[], id: string) {
  return new Set([
    id,
    ...nodes
      .filter((n) => n.id === id || n.links.includes(id))
      .flatMap((n) => [n.id, ...(n.id === id ? n.links : [])]),
  ]);
}
export function downloadBlob(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

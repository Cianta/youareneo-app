"use client";
import { useEffect, useRef } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { type BrainNode, matchesNode } from "@/lib/brain/graph";
import { colors, type RendererProps, tooltip } from "./shared";
export default function Graph2D({
  data,
  width,
  height,
  query,
  selected,
  onSelect,
  reduced,
}: RendererProps) {
  const ref = useRef<ForceGraphMethods<BrainNode>>(undefined);
  useEffect(() => {
    if (!selected) return;
    const n = data.nodes.find((n) => n.id === selected);
    if (n && Number.isFinite(n.x)) {
      ref.current?.centerAt(n.x, n.y, reduced ? 0 : 450);
      ref.current?.zoom(2, reduced ? 0 : 450);
    }
  }, [selected, data, reduced]);
  return (
    <ForceGraph2D
      ref={ref}
      width={width}
      height={height}
      graphData={data}
      backgroundColor="#0f1419"
      nodeLabel={tooltip}
      nodeVal={(n) => 2 + Math.sqrt(n.degree)}
      nodeColor={(n) =>
        query && !matchesNode(n, query) ? "#2a3436" : colors[n.type]
      }
      nodeCanvasObjectMode={() => "after"}
      nodeCanvasObject={(n, ctx, scale) => {
        if (n.id !== selected) return;
        ctx.font = `${13 / scale}px sans-serif`;
        ctx.fillStyle = "#f0f4ef";
        ctx.fillText(
          n.label.slice(0, 50),
          (n.x || 0) + 8 / scale,
          (n.y || 0) - 8 / scale,
        );
      }}
      linkColor={() => "rgba(143,180,160,0.25)"}
      linkWidth={0.6}
      warmupTicks={reduced ? 100 : 40}
      cooldownTicks={reduced ? 0 : 100}
      cooldownTime={4000}
      onEngineStop={() => ref.current?.zoomToFit(reduced ? 0 : 400, 35)}
      onNodeClick={onSelect}
      enableNodeDrag={!reduced}
    />
  );
}

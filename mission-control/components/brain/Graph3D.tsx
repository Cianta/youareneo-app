"use client";
import { useEffect, useRef } from "react";
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import { FogExp2 } from "three";
import { type BrainNode, matchesNode } from "@/lib/brain/graph";
import { colors, type RendererProps, tooltip } from "./shared";
export default function Graph3D({
  data,
  width,
  height,
  query,
  selected,
  onSelect,
  onFail,
}: RendererProps) {
  const ref = useRef<ForceGraphMethods<BrainNode>>(undefined);
  useEffect(() => {
    const graph = ref.current;
    if (!graph) return;
    graph.scene().fog = new FogExp2("#0f1419", 0.00065);
    const canvas = graph.renderer().domElement;
    const fail = (e: Event) => {
      e.preventDefault();
      onFail?.();
    };
    canvas.addEventListener("webglcontextlost", fail);
    return () => canvas.removeEventListener("webglcontextlost", fail);
  }, [onFail]);
  useEffect(() => {
    const n = data.nodes.find((n) => n.id === selected);
    if (!n || !Number.isFinite(n.x)) return;
    const x = n.x || 0,
      y = n.y || 0,
      z = n.z || 0;
    const d = Math.hypot(x, y, z) || 1;
    const ratio = 1 + 100 / d;
    ref.current?.cameraPosition(
      { x: x * ratio, y: y * ratio, z: z ? z * ratio : 100 },
      { x, y, z },
      700,
    );
  }, [selected, data]);
  return (
    <ForceGraph3D
      ref={ref}
      width={width}
      height={height}
      graphData={data}
      backgroundColor="#0f1419"
      nodeLabel={tooltip}
      nodeVal={(n) => 2 + Math.sqrt(n.degree)}
      nodeColor={(n) =>
        query && !matchesNode(n, query) ? "#263238" : colors[n.type]
      }
      nodeOpacity={0.95}
      nodeResolution={8}
      linkColor={() => "#A8C5A0"}
      linkOpacity={0.16}
      linkWidth={0}
      warmupTicks={50}
      cooldownTicks={120}
      cooldownTime={5000}
      showNavInfo={false}
      onNodeClick={onSelect}
      onEngineStop={() => {
        if (!selected) ref.current?.zoomToFit(500, 40);
      }}
    />
  );
}

"use client";

import { Connector, getBranchColor } from "@/lib/tree/layout";

interface TreeConnectorsProps {
  connectors: Connector[];
  bounds: { width: number; height: number; minX: number; maxX: number; maxY: number };
  activeBranch: string | null;
  hoveredId: string | null;
  loaded: boolean;
  allBranches: string[];
}

export default function TreeConnectors({
  connectors,
  bounds,
  activeBranch,
  hoveredId,
  loaded,
  allBranches,
}: TreeConnectorsProps) {
  return (
    <g>
      <defs>
        <filter id="connector-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#E8A63D" floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connectors.map((conn) => {
        const isDimmed = activeBranch && conn.branch !== activeBranch;
        const isHighlighted = hoveredId && (conn.from === hoveredId || conn.to === hoveredId);

        if (conn.type === "spouse") {
          const { fromPos, toPos } = conn;

          return (
            <g key={`spouse-${conn.from}-${conn.to}`}>
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#C9A876"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="4 4"
                opacity={isDimmed ? 0.08 : isHighlighted ? 0.9 : 0.5}
                style={{ transition: "opacity 0.3s ease" }}
              />
              <line
                x1={fromPos.x}
                y1={fromPos.y - 4}
                x2={toPos.x}
                y2={toPos.y - 4}
                stroke="#C9A876"
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={isDimmed ? 0.08 : isHighlighted ? 0.7 : 0.35}
                style={{ transition: "opacity 0.3s ease" }}
              />
              <line
                x1={fromPos.x}
                y1={fromPos.y + 4}
                x2={toPos.x}
                y2={toPos.y + 4}
                stroke="#C9A876"
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={isDimmed ? 0.08 : isHighlighted ? 0.7 : 0.35}
                style={{ transition: "opacity 0.3s ease" }}
              />
            </g>
          );
        }

        // Parent-child: bezier from bottom-center of parent to top-center of child
        const { fromPos, toPos } = conn;
        const midY = (fromPos.y + toPos.y) / 2;
        const variance = (conn.from.charCodeAt(0) * 7 + conn.to.charCodeAt(0) * 3) % 20 - 10;
        const ctrlX1 = fromPos.x + variance;
        const ctrlX2 = toPos.x + variance;
        const path = `M ${fromPos.x} ${fromPos.y} C ${ctrlX1} ${midY}, ${ctrlX2} ${midY}, ${toPos.x} ${toPos.y}`;

        return (
          <path
            key={`${conn.from}-${conn.to}`}
            d={path}
            fill="none"
            stroke={`url(#grad-${conn.branch})`}
            strokeWidth={isHighlighted ? 3.5 : 2.5}
            strokeLinecap="round"
            filter={isHighlighted ? "url(#connector-glow)" : "none"}
            style={{
              opacity: isDimmed ? 0.08 : isHighlighted ? 1 : 0.65,
              transition: "opacity 0.3s ease, stroke-width 0.3s ease",
              strokeDasharray: loaded ? "none" : "800",
              strokeDashoffset: loaded ? "0" : "800",
              transitionProperty: "opacity, stroke-width, stroke-dashoffset",
              transitionDuration: "0.3s, 0.3s, 1.5s",
              transitionTimingFunction: "ease, ease, ease-out",
            }}
          />
        );
      })}
    </g>
  );
}

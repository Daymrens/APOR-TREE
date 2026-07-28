"use client";

import { Connector, getBranchColor } from "@/lib/tree/layout";

const BALETE = "var(--color-balete)";
const RATTAN = "var(--color-rattan)";

interface TreeConnectorsProps {
  connectors: Connector[];
  bounds: { width: number; height: number; minX: number; maxX: number; maxY: number };
  activeBranch: string | null;
  hoveredId: string | null;
  loaded: boolean;
  allBranches: string[];
}

function getStrokeWidth(conn: Connector): number {
  if (conn.type === "spouse") return 2;
  if (conn.depth <= 0) return 4;
  if (conn.depth === 1) return 3;
  return 2.5;
}

function getOpacity(conn: Connector, isDimmed: boolean, isHighlighted: boolean): number {
  if (isDimmed) return 0.06;
  if (isHighlighted) return 1;
  if (conn.type === "spouse") return 0.5;
  if (conn.depth <= 0) return 0.85;
  return 0.6;
}

function getStroke(conn: Connector, allBranches: string[]): string {
  if (conn.type === "spouse") return RATTAN;
  if (conn.depth <= 0) return BALETE;
  return `url(#grad-${conn.branch})`;
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
        {Array.from(new Set(connectors.filter(c => c.type === "parent-child").map(c => c.branch))).map((branch) => {
          const color = getBranchColor(branch, allBranches);
          return (
            <linearGradient key={branch} id={`grad-${branch}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={color} stopOpacity={0.5} />
            </linearGradient>
          );
        })}

        <filter id="connector-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#E8A63D" floodOpacity="0.5" result="color" />
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
        const strokeWidth = getStrokeWidth(conn);
        const opacity = getOpacity(conn, !!isDimmed, !!isHighlighted);
        const stroke = getStroke(conn, allBranches);

        if (conn.type === "spouse") {
          const { fromPos, toPos } = conn;
          const midX = (fromPos.x + toPos.x) / 2;

          return (
            <g key={`spouse-${conn.from}-${conn.to}`} opacity={opacity} style={{ transition: "opacity 0.3s ease" }}>
              <path
                d={`M ${fromPos.x} ${fromPos.y} C ${midX} ${fromPos.y - 12}, ${midX} ${toPos.y + 12}, ${toPos.x} ${toPos.y}`}
                fill="none"
                stroke={RATTAN}
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="5 5"
              />
              <path
                d={`M ${fromPos.x} ${fromPos.y - 3} C ${midX} ${fromPos.y - 15}, ${midX} ${toPos.y + 9}, ${toPos.x} ${toPos.y - 3}`}
                fill="none"
                stroke={RATTAN}
                strokeWidth={1.2}
                strokeLinecap="round"
                opacity={0.35}
              />
              <path
                d={`M ${fromPos.x} ${fromPos.y + 3} C ${midX} ${fromPos.y + 9}, ${midX} ${toPos.y - 15}, ${toPos.x} ${toPos.y + 3}`}
                fill="none"
                stroke={RATTAN}
                strokeWidth={1.2}
                strokeLinecap="round"
                opacity={0.35}
              />
            </g>
          );
        }

        const { fromPos, toPos } = conn;
        const dy = toPos.y - fromPos.y;
        const dx = toPos.x - fromPos.x;

        const varianceBase = (conn.from.charCodeAt(0) * 7 + conn.to.charCodeAt(0) * 3 + conn.from.charCodeAt(Math.min(1, conn.from.length - 1)) * 5) % 50 - 25;
        const variance2 = (conn.to.charCodeAt(0) * 11 + conn.from.charCodeAt(0) * 13) % 40 - 20;

        const ctrlY1 = fromPos.y + dy * 0.35;
        const ctrlY2 = fromPos.y + dy * 0.65;
        const ctrlX1 = fromPos.x + varianceBase;
        const ctrlX2 = toPos.x + variance2;

        const path = `M ${fromPos.x} ${fromPos.y} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${toPos.x} ${toPos.y}`;

        return (
          <path
            key={`${conn.from}-${conn.to}`}
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={isHighlighted ? strokeWidth + 1.5 : strokeWidth}
            strokeLinecap="round"
            filter={isHighlighted ? "url(#connector-glow)" : "none"}
            style={{
              opacity,
              transition: "opacity 0.3s ease, stroke-width 0.3s ease",
              strokeDasharray: loaded ? "none" : "1000",
              strokeDashoffset: loaded ? "0" : "1000",
              transitionProperty: "opacity, stroke-width, stroke-dashoffset",
              transitionDuration: "0.3s, 0.3s, 1.2s",
              transitionTimingFunction: "ease, ease, ease-out",
            }}
          />
        );
      })}
    </g>
  );
}

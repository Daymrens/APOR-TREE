"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { FamilyMember } from "@/lib/types";

const BRANCH_COLORS = [
  "#C23B6E", // hibiscus
  "#E8A63D", // mango
  "#1E3B2C", // balete
  "#C9A876", // rattan
  "#5C5445", // soft
  "#8B5E3C", // brown
  "#2E6B62", // teal
  "#7C3AED", // purple
];

function getBranchColor(branch: string, allBranches: string[]): string {
  const index = allBranches.indexOf(branch);
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}

interface TreeSpineProps {
  members: FamilyMember[];
  activeBranch: string | null;
  onSelect: (member: FamilyMember) => void;
  onHover?: (member: FamilyMember | null) => void;
}

export default function TreeSpine({ members, activeBranch, onSelect, onHover }: TreeSpineProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const allBranches = useMemo(() => {
    const set = new Set(members.map((m) => m.branch));
    return Array.from(set).sort();
  }, [members]);

  const generations = useMemo(() => {
    const map = new Map<number, FamilyMember[]>();
    members.forEach((m) => {
      const gen = m.generation;
      if (!map.has(gen)) map.set(gen, []);
      map.get(gen)!.push(m);
    });
    map.forEach((arr) => arr.sort((a, b) => a.birthOrder - b.birthOrder));
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [members]);

  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  if (!isMobile) {
    return (
      <DesktopTree
        members={members}
        generations={generations}
        memberMap={memberMap}
        allBranches={allBranches}
        activeBranch={activeBranch}
        onSelect={onSelect}
        onHover={onHover}
        loaded={loaded}
        svgRef={svgRef}
      />
    );
  }

  return (
    <MobileTree
      generations={generations}
      allBranches={allBranches}
      activeBranch={activeBranch}
      onSelect={onSelect}
    />
  );
}

// ─── Desktop Tree ────────────────────────────────────────────

function DesktopTree({
  members,
  generations,
  memberMap,
  allBranches,
  activeBranch,
  onSelect,
  onHover,
  loaded,
  svgRef,
}: {
  members: FamilyMember[];
  generations: [number, FamilyMember[]][];
  memberMap: Map<string, FamilyMember>;
  allBranches: string[];
  activeBranch: string | null;
  onSelect: (m: FamilyMember) => void;
  onHover: ((m: FamilyMember | null) => void) | undefined;
  loaded: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const NODE_RADIUS = 30;
  const NODE_SPACING_X = 150;
  const NODE_SPACING_Y = 140;
  const PADDING = 80;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });

  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    let genIndex = 0;

    for (const [, genMembers] of generations) {
      const totalWidth = (genMembers.length - 1) * NODE_SPACING_X;
      const startX = -totalWidth / 2;

      genMembers.forEach((member, i) => {
        map.set(member.id, {
          x: startX + i * NODE_SPACING_X,
          y: genIndex * NODE_SPACING_Y,
        });
      });
      genIndex++;
    }
    return map;
  }, [generations]);

  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, maxY = 0;
    positions.forEach(({ x, y }) => {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    return {
      width: maxX - minX + PADDING * 2 + NODE_RADIUS * 2,
      height: maxY + PADDING * 2 + NODE_RADIUS * 2,
      offsetX: -minX + PADDING + NODE_RADIUS,
      offsetY: PADDING + NODE_RADIUS,
    };
  }, [positions]);

  const connectors = useMemo(() => {
    const lines: { from: string; to: string; fromPos: { x: number; y: number }; toPos: { x: number; y: number }; branch: string }[] = [];

    members.forEach((child) => {
      child.parentIds.forEach((parentId) => {
        const parentPos = positions.get(parentId);
        const childPos = positions.get(child.id);
        if (parentPos && childPos) {
          lines.push({
            from: parentId,
            to: child.id,
            fromPos: parentPos,
            toPos: childPos,
            branch: child.branch,
          });
        }
      });
    });

    return lines;
  }, [members, positions]);

  const uniqueBranches = useMemo(() => {
    const set = new Set(connectors.map(c => c.branch));
    return Array.from(set);
  }, [connectors]);

  // Zoom/pan handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(z + delta, 0.3), 2.5));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffset.current = { ...pan };
    }
  }, [pan, svgRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panOffset.current.x + dx, y: panOffset.current.y + dy });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.2, 2.5))}
          className="w-8 h-8 glass-card rounded-lg flex items-center justify-center text-ink hover:bg-white/70 transition-all duration-200 text-sm font-mono"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}
          className="w-8 h-8 glass-card rounded-lg flex items-center justify-center text-ink hover:bg-white/70 transition-all duration-200 text-sm font-mono"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 glass-card rounded-lg flex items-center justify-center text-ink hover:bg-white/70 transition-all duration-200"
          aria-label="Reset view"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
          </svg>
        </button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute top-2 left-2 z-20 glass-card rounded-lg px-2 py-1 text-xs font-mono text-soft">
        {Math.round(zoom * 100)}%
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-parchment via-parchment to-rattan/10"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${bounds.width} ${bounds.height}`}
          className="w-full min-w-[600px]"
          style={{
            maxHeight: "65vh",
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.2s ease-out",
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            {/* Branch gradients */}
            {uniqueBranches.map((branch) => {
              const color = getBranchColor(branch, allBranches);
              return (
                <linearGradient key={branch} id={`grad-${branch}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.35} />
                </linearGradient>
              );
            })}
            {/* Node glow filter */}
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#C23B6E" floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Hover glow filter */}
            <filter id="hover-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor="#E8A63D" floodOpacity="0.4" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Subtle background pattern */}
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="rgba(201, 168, 118, 0.15)" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width="100%" height="100%" fill="url(#dots)" />

          {/* Generation bands */}
          {generations.map(([gen], i) => {
            const y = i * NODE_SPACING_Y + bounds.offsetY - NODE_SPACING_Y * 0.4;
            const height = NODE_SPACING_Y * 0.8;
            return (
              <rect
                key={`band-${gen}`}
                x={0}
                y={y}
                width={bounds.width}
                height={height}
                fill={i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(201,168,118,0.03)"}
                rx={8}
                style={{
                  opacity: loaded ? 1 : 0,
                  transition: `opacity 0.6s ease ${i * 0.1}s`,
                }}
              />
            );
          })}

          {/* Generation labels */}
          {generations.map(([gen], i) => {
            const y = i * NODE_SPACING_Y + bounds.offsetY;
            return (
              <g
                key={`label-${gen}`}
                style={{
                  opacity: loaded ? 1 : 0,
                  transition: `opacity 0.5s ease ${i * 0.1}s`,
                }}
              >
                <rect
                  x={8}
                  y={y - 10}
                  width={52}
                  height={20}
                  rx={10}
                  fill="rgba(30, 59, 44, 0.08)"
                />
                <text
                  x={34}
                  y={y + 4}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-soft/60"
                  fontWeight="500"
                >
                  Gen {gen}
                </text>
              </g>
            );
          })}

          {/* Connectors */}
          {connectors.map((conn) => {
            const fromX = conn.fromPos.x + bounds.offsetX;
            const fromY = conn.fromPos.y + bounds.offsetY + NODE_RADIUS;
            const toX = conn.toPos.x + bounds.offsetX;
            const toY = conn.toPos.y + bounds.offsetY - NODE_RADIUS;

            const midY = (fromY + toY) / 2;
            const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

            const isDimmed = activeBranch && conn.branch !== activeBranch;
            const isHighlighted = hoveredId && (conn.from === hoveredId || conn.to === hoveredId);

            return (
              <path
                key={`${conn.from}-${conn.to}`}
                d={path}
                fill="none"
                stroke={`url(#grad-${conn.branch})`}
                strokeWidth={isHighlighted ? 3.5 : 2.5}
                strokeLinecap="round"
                style={{
                  opacity: isDimmed ? 0.08 : isHighlighted ? 1 : 0.6,
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

          {/* Nodes */}
          {Array.from(positions.entries()).map(([id, pos], i) => {
            const member = memberMap.get(id);
            if (!member) return null;

            const x = pos.x + bounds.offsetX;
            const y = pos.y + bounds.offsetY;
            const color = getBranchColor(member.branch, allBranches);
            const isDimmed = activeBranch && member.branch !== activeBranch;
            const isHovered = hoveredId === id;

            return (
              <g
                key={id}
                onClick={() => onSelect(member)}
                onMouseEnter={() => {
                  setHoveredId(id);
                  onHover?.(member);
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                  onHover?.(null);
                }}
                className="cursor-pointer"
                style={{
                  opacity: isDimmed ? 0.2 : 1,
                  transition: "opacity 0.3s ease",
                }}
              >
                {/* Outer ring — animated entrance */}
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS + 5}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  strokeOpacity={isHovered ? 0.9 : 0.4}
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? "scale(1)" : "scale(0.2)",
                    transformOrigin: `${x}px ${y}px`,
                    transition: `opacity 0.5s ease ${i * 0.06}s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.06}s, stroke-opacity 0.3s ease, stroke-width 0.3s ease`,
                  }}
                />

                {/* Glow ring on hover */}
                {isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_RADIUS + 8}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.5}
                    strokeOpacity={0.3}
                    className="animate-glow-pulse"
                  />
                )}

                {/* Inner glass circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS}
                  fill="rgba(241, 232, 214, 0.9)"
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth={1.5}
                  style={{
                    filter: isHovered
                      ? "drop-shadow(0 4px 12px rgba(194, 59, 110, 0.25))"
                      : "drop-shadow(0 2px 6px rgba(0,0,0,0.1))",
                    transition: "filter 0.3s ease",
                    transform: isHovered ? "scale(1.08)" : "scale(1)",
                    transformOrigin: `${x}px ${y}px`,
                  }}
                />

                {/* Photo or initial */}
                {member.photoUrl ? (
                  <>
                    <clipPath id={`clip-${id}`}>
                      <circle cx={x} cy={y} r={NODE_RADIUS - 1} />
                    </clipPath>
                    <image
                      href={member.photoUrl}
                      x={x - NODE_RADIUS + 1}
                      y={y - NODE_RADIUS + 1}
                      width={(NODE_RADIUS - 1) * 2}
                      height={(NODE_RADIUS - 1) * 2}
                      clipPath={`url(#clip-${id})`}
                      preserveAspectRatio="xMidYMid slice"
                      style={{
                        opacity: loaded ? 1 : 0,
                        transition: `opacity 0.5s ease ${i * 0.06}s`,
                      }}
                    />
                  </>
                ) : (
                  <text
                    x={x}
                    y={y + 6}
                    textAnchor="middle"
                    className="text-base font-heading fill-balete"
                    fontWeight="bold"
                    style={{
                      opacity: loaded ? 1 : 0,
                      transition: `opacity 0.5s ease ${i * 0.06}s`,
                    }}
                  >
                    {member.fullName.charAt(0)}
                  </text>
                )}

                {/* Deceased indicator — subtle diagonal line */}
                {member.livingStatus === "deceased" && (
                  <>
                    <line
                      x1={x - NODE_RADIUS * 0.45}
                      y1={y - NODE_RADIUS * 0.45}
                      x2={x + NODE_RADIUS * 0.45}
                      y2={y + NODE_RADIUS * 0.45}
                      stroke={color}
                      strokeWidth={2}
                      strokeOpacity={0.4}
                      strokeLinecap="round"
                    />
                    <line
                      x1={x + NODE_RADIUS * 0.45}
                      y1={y - NODE_RADIUS * 0.45}
                      x2={x - NODE_RADIUS * 0.45}
                      y2={y + NODE_RADIUS * 0.45}
                      stroke={color}
                      strokeWidth={2}
                      strokeOpacity={0.4}
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Name label */}
                <text
                  x={x}
                  y={y + NODE_RADIUS + 18}
                  textAnchor="middle"
                  className="text-xs font-sans fill-ink"
                  fontWeight={isHovered ? "600" : "500"}
                  style={{
                    opacity: loaded ? 1 : 0,
                    transition: `opacity 0.5s ease ${i * 0.06}s`,
                  }}
                >
                  {member.nickname || member.fullName.split(" ")[0]}
                </text>

                {/* Branch tag below name */}
                {isHovered && (
                  <g style={{ opacity: 0, animation: "fade-in 0.2s ease forwards" }}>
                    <rect
                      x={x - 20}
                      y={y + NODE_RADIUS + 22}
                      width={40}
                      height={16}
                      rx={8}
                      fill={color}
                      fillOpacity={0.15}
                    />
                    <text
                      x={x}
                      y={y + NODE_RADIUS + 33}
                      textAnchor="middle"
                      className="text-[9px] font-sans"
                      fill={color}
                      fontWeight="500"
                    >
                      {member.branch}
                    </text>
                  </g>
                )}

                {/* Branch indicator dot */}
                <circle
                  cx={x}
                  cy={y - NODE_RADIUS - 10}
                  r={isHovered ? 4 : 3}
                  fill={color}
                  opacity={isHovered ? 1 : 0.7}
                  style={{ transition: "r 0.2s ease, opacity 0.2s ease" }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Mobile Tree ─────────────────────────────────────────────

function MobileTree({
  generations,
  allBranches,
  activeBranch,
  onSelect,
}: {
  generations: [number, FamilyMember[]][];
  allBranches: string[];
  activeBranch: string | null;
  onSelect: (m: FamilyMember) => void;
}) {
  const [expandedGen, setExpandedGen] = useState<number | null>(0);

  return (
    <div className="relative">
      {/* Vertical spine line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rattan/40 via-rattan/20 to-transparent" />

      <div className="space-y-1">
        {generations.map(([gen, genMembers]) => {
          const isExpanded = expandedGen === gen;
          const visibleMembers = activeBranch
            ? genMembers.filter((m) => m.branch === activeBranch)
            : genMembers;

          return (
            <div key={gen}>
              {/* Generation header */}
              <button
                onClick={() => setExpandedGen(isExpanded ? null : gen)}
                className="relative flex items-center gap-3 w-full py-3 pl-2 text-left group"
              >
                {/* Node on spine */}
                <div
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-mango to-[#d4922e] flex items-center justify-center z-10 flex-shrink-0 shadow-lg shadow-mango/25"
                  style={{
                    transform: isExpanded ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <span className="text-parchment text-xs font-mono font-bold">{gen}</span>
                </div>

                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="font-heading text-sm text-balete block">
                      {gen === 0 ? "Root" : `Generation ${gen}`}
                    </span>
                    <span className="text-soft/50 text-[10px] font-sans">
                      {visibleMembers.length} member{visibleMembers.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Branch color dots */}
                    {!activeBranch && (
                      <div className="flex -space-x-1">
                        {Array.from(new Set(visibleMembers.map(m => m.branch))).slice(0, 4).map((branch) => (
                          <div
                            key={branch}
                            className="w-2.5 h-2.5 rounded-full border border-white"
                            style={{ backgroundColor: getBranchColor(branch, allBranches) }}
                          />
                        ))}
                      </div>
                    )}
                    <svg
                      className={`w-4 h-4 text-soft/40 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Members list with animated height */}
              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: isExpanded ? `${visibleMembers.length * 80 + 16}px` : "0px",
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="pl-12 pr-2 pb-3 space-y-2">
                  {visibleMembers.map((member, i) => {
                    const color = getBranchColor(member.branch, allBranches);
                    const isDimmed = activeBranch && member.branch !== activeBranch;

                    return (
                      <button
                        key={member.id}
                        onClick={() => onSelect(member)}
                        className="w-full text-left glass-card rounded-2xl p-3 flex items-center gap-3 hover:shadow-md transition-all duration-200"
                        style={{
                          opacity: isDimmed ? 0.2 : 1,
                          borderLeft: `3px solid ${color}`,
                          animation: isExpanded ? `slide-up 0.3s ease ${i * 0.05}s both` : "none",
                        }}
                      >
                        <div className="relative w-11 h-11 rounded-full flex-shrink-0">
                          {/* Branch color ring */}
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `linear-gradient(135deg, ${color}40, ${color}15)`,
                              padding: "2px",
                            }}
                          >
                            <div className="w-full h-full rounded-full bg-parchment flex items-center justify-center overflow-hidden">
                              {member.photoUrl ? (
                                <img
                                  src={member.photoUrl}
                                  alt={member.fullName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="font-heading text-sm text-balete">
                                  {member.fullName.charAt(0)}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Deceased cross */}
                          {member.livingStatus === "deceased" && (
                            <div className="absolute inset-0 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-soft/30" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" fill="none">
                                <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-sm font-medium text-ink truncate">
                            {member.nickname || member.fullName}
                          </p>
                          <p className="text-soft text-xs font-sans truncate flex items-center gap-1">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            {member.branch}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-soft/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

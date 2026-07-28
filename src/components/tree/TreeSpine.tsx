"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { FamilyMember } from "@/lib/types";
import { computeTreePositions, getBranchColor as layoutGetBranchColor } from "@/lib/tree/layout";
import TreeNodeCard from "@/components/tree/TreeNodeCard";
import TreeConnectors from "@/components/tree/TreeConnectors";

const CARD_WIDTH = 160;
const CARD_HEIGHT = 100;
const NODE_SPACING_X = CARD_WIDTH + 50;  // 210px between cards horizontally
const NODE_SPACING_Y = CARD_HEIGHT + 60; // 160px between generations vertically
const SPOUSE_GAP = 40;  // smaller gap for spouse cards
const PADDING = 100;

function getBranchColor(branch: string, allBranchesList: string[]): string {
  return layoutGetBranchColor(branch, allBranchesList);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

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

  const allBranchesList = useMemo(() => {
    const set = new Set(members.map((m) => m.branch));
    return Array.from(set).sort();
  }, [members]);

  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const { positions, connectors, bounds } = useMemo(() => {
    return computeTreePositions(members, {
      nodeWidth: CARD_WIDTH,
      nodeHeight: CARD_HEIGHT,
      nodeSpacingX: NODE_SPACING_X,
      spouseGap: SPOUSE_GAP,
      generationGapY: NODE_SPACING_Y,
    });
  }, [members]);

  if (!isMobile) {
    return (
      <DesktopTree
        members={members}
        memberMap={memberMap}
        activeBranch={activeBranch}
        onSelect={onSelect}
        onHover={onHover}
        loaded={loaded}
        svgRef={svgRef}
        containerRef={containerRef}
        positions={positions}
        connectors={connectors}
        bounds={bounds}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
        zoom={zoom}
        setZoom={setZoom}
        getBranchColor={getBranchColor}
        allBranchesList={allBranchesList}
      />
    );
  }

  return (
    <MobileTree
      members={members}
allBranchesList={allBranchesList}
      activeBranch={activeBranch}
      onSelect={onSelect}
      getBranchColor={getBranchColor}
    />
  );
}

function DesktopTree({
  members,
  memberMap,
  allBranchesList,
  activeBranch,
  onSelect,
  onHover,
  loaded,
  svgRef,
  containerRef,
  positions,
  connectors,
  bounds,
  hoveredId,
  setHoveredId,
  zoom,
  setZoom,
  getBranchColor,
}: {
  members: FamilyMember[];
  memberMap: Map<string, FamilyMember>;
  allBranchesList: string[];
  activeBranch: string | null;
  onSelect: (m: FamilyMember) => void;
  onHover: ((m: FamilyMember | null) => void) | undefined;
  loaded: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  positions: Map<string, { x: number; y: number }>;
  connectors: Array<{
    type: "parent-child" | "spouse";
    from: string;
    to: string;
    fromPos: { x: number; y: number };
    toPos: { x: number; y: number };
    branch: string;
  }>;
  bounds: { width: number; height: number; minX: number; maxX: number; maxY: number };
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
  getBranchColor: (branch: string, branches: string[]) => string;
}) {
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.min(Math.max(z + delta, 0.3), 2.5));
    }
  }, []);

  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const scaleX = containerWidth / bounds.width;
    const scaleY = containerHeight / bounds.height;
    const fitZoom = Math.min(scaleX, scaleY, 1.5);
    setZoom(fitZoom);

    setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollLeft = 0;
        containerRef.current.scrollTop = 0;
      }
    }, 50);
  }, [bounds.width, bounds.height]);

  const uniqueBranches = useMemo(() => {
    const set = new Set(connectors.map(c => c.branch));
    return Array.from(set);
  }, [connectors]);

  return (
    <div className="relative">
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
          onClick={fitToScreen}
          className="w-8 h-8 glass-card rounded-lg flex items-center justify-center text-ink hover:bg-white/70 transition-all duration-200"
          aria-label="Fit to screen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
          </svg>
        </button>
      </div>

      <div className="absolute top-2 left-2 z-20 glass-card rounded-lg px-2 py-1 text-xs font-mono text-soft">
        {Math.round(zoom * 100)}%
      </div>

      <div
        ref={containerRef}
        className="overflow-auto rounded-2xl border border-white/20 bg-gradient-to-br from-parchment via-parchment to-rattan/10"
        style={{ maxHeight: "70vh" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${bounds.width} ${bounds.height}`}
          className="block"
          style={{
            width: bounds.width * zoom,
            height: bounds.height * zoom,
            transition: "width 0.2s ease-out, height 0.2s ease-out",
          }}
          onWheel={handleWheel}
        >
          <defs>
            {uniqueBranches.map((branch) => {
              const color = getBranchColor(branch, allBranchesList);
              return (
                <linearGradient key={branch} id={`grad-${branch}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.35} />
                </linearGradient>
              );
            })}

            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#C23B6E" floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="hover-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor="#E8A63D" floodOpacity="0.4" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="rgba(201, 168, 118, 0.15)" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#dots)" />

          <TreeConnectors
            connectors={connectors}
            bounds={bounds}
            activeBranch={activeBranch}
            hoveredId={hoveredId}
            loaded={loaded}
            allBranches={allBranchesList}
          />

          {Array.from(positions.entries()).map(([id, pos], i) => {
            const member = memberMap.get(id);
            if (!member) return null;

            const color = getBranchColor(member.branch, allBranchesList);
            const isDimmed = activeBranch && member.branch !== activeBranch;
            const spouseId = member.spouseId;

            return (
              <TreeNodeCard
                key={id}
                node={{
                  id,
                  x: pos.x,
                  y: pos.y,
                  member,
                  spouseId,
                  isSpouse: false,
                }}
                allBranches={allBranchesList}
                onSelect={onSelect}
                onHover={onHover ?? (() => {})}
                activeBranch={activeBranch}
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
                loaded={loaded}
                index={i}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function MobileTree({
  members,
  allBranchesList,
  activeBranch,
  onSelect,
  getBranchColor,
}: {
  members: FamilyMember[];
  allBranchesList: string[];
  activeBranch: string | null;
  onSelect: (m: FamilyMember) => void;
  getBranchColor: (branch: string, branches: string[]) => string;
}) {
  const [expandedGen, setExpandedGen] = useState<number | null>(0);

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

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rattan/40 via-rattan/20 to-transparent" />

      <div className="space-y-1">
        {generations.map(([gen, genMembers]) => {
          const isExpanded = expandedGen === gen;
          const visibleMembers = activeBranch
            ? genMembers.filter((m) => m.branch === activeBranch)
            : genMembers;

          return (
            <div key={gen}>
              <button
                onClick={() => setExpandedGen(isExpanded ? null : gen)}
                className="relative flex items-center gap-3 w-full py-3 pl-2 text-left group"
              >
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
                    {!activeBranch && (
                      <div className="flex -space-x-1">
                        {Array.from(new Set(visibleMembers.map(m => m.branch))).slice(0, 4).map((branch) => (
                          <div
                            key={branch}
                            className="w-2.5 h-2.5 rounded-full border border-white"
                            style={{ backgroundColor: getBranchColor(branch, allBranchesList) }}
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

              <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: isExpanded ? `${visibleMembers.length * 80 + 16}px` : "0px",
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div className="pl-12 pr-2 pb-3 space-y-2">
                  {visibleMembers.map((member, i) => {
                    const color = getBranchColor(member.branch, allBranchesList);
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
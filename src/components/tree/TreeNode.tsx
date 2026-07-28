"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FamilyMember } from "@/lib/types";
import { Connector, getBranchColor } from "@/lib/tree/layout";

interface TreeNodeProps {
  node: {
    id: string;
    x: number;
    y: number;
    member: FamilyMember;
    spouseId: string | null;
    isSpouse: boolean;
  };
  allBranches: string[];
  onSelect: (member: FamilyMember) => void;
  onHover: (member: FamilyMember | null) => void;
  activeBranch: string | null;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  loaded: boolean;
  index: number;
  bounds: { offsetX: number; offsetY: number };
}

const NODE_RADIUS = 30;

export default function TreeNode({
  node,
  allBranches,
  onSelect,
  onHover,
  activeBranch,
  hoveredId,
  setHoveredId,
  loaded,
  index,
  bounds,
}: TreeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showBranchTag, setShowBranchTag] = useState(false);
  const member = node.member;
  const color = getBranchColor(member.branch, allBranches);
  const isDimmed = activeBranch && member.branch !== activeBranch;
  const isSpouseHovered = hoveredId === node.spouseId;

  const handleMouseEnter = () => {
    setIsHovered(true);
    setHoveredId(member.id);
    onHover(member);
    setTimeout(() => setShowBranchTag(true), 150);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoveredId(null);
    onHover(null);
    setShowBranchTag(false);
  };

  return (
    <g
      onClick={() => onSelect(member)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer"
      style={{
        opacity: isDimmed ? 0.2 : 1,
        transition: "opacity 0.3s ease",
      }}
      transform={`translate(${bounds.offsetX}, ${bounds.offsetY})`}
    >
      <defs>
        {member.photoUrl && (
          <clipPath id={`clip-${member.id}`}>
            <circle cx={node.x} cy={node.y} r={NODE_RADIUS - 1} />
          </clipPath>
        )}
      </defs>

      {/* Outer ring - animated entrance */}
      <circle
        cx={node.x}
        cy={node.y}
        r={NODE_RADIUS + 5}
        fill="none"
        stroke={color}
        strokeWidth={isHovered || isSpouseHovered ? 3 : 2}
        strokeOpacity={isHovered || isSpouseHovered ? 0.9 : 0.4}
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? "scale(1)" : "scale(0.2)",
          transformOrigin: `${node.x}px ${node.y}px`,
          transition: `opacity 0.5s ease ${index * 0.06}s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.06}s, stroke-opacity 0.3s ease, stroke-width 0.3s ease`,
        }}
      />

      {/* Glow ring on hover */}
      {(isHovered || isSpouseHovered) && (
        <circle
          cx={node.x}
          cy={node.y}
          r={NODE_RADIUS + 8}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.3}
          className="animate-glow-pulse"
        />
      )}

      {/* Spouse connection indicator */}
      {node.spouseId && !node.isSpouse && (
        <line
          x1={node.x - NODE_RADIUS - 8}
          y1={node.y}
          x2={node.x - NODE_RADIUS - 20}
          y2={node.y}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="3 3"
          strokeOpacity={0.6}
          strokeLinecap="round"
        />
      )}

      {/* Inner glass circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={NODE_RADIUS}
        fill="rgba(241, 232, 214, 0.9)"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth={1.5}
        style={{
          filter: isHovered || isSpouseHovered
            ? "drop-shadow(0 4px 12px rgba(194, 59, 110, 0.25))"
            : "drop-shadow(0 2px 6px rgba(0,0,0,0.1))",
          transition: "filter 0.3s ease, transform 0.3s ease",
          transform: isHovered || isSpouseHovered ? "scale(1.08)" : "scale(1)",
          transformOrigin: `${node.x}px ${node.y}px`,
        }}
      />

      {/* Photo or initial */}
      {member.photoUrl ? (
        <image
          href={member.photoUrl}
          x={node.x - NODE_RADIUS + 1}
          y={node.y - NODE_RADIUS + 1}
          width={(NODE_RADIUS - 1) * 2}
          height={(NODE_RADIUS - 1) * 2}
          clipPath={`url(#clip-${member.id})`}
          preserveAspectRatio="xMidYMid slice"
          style={{
            opacity: loaded ? 1 : 0,
            transition: `opacity 0.5s ease ${index * 0.06}s`,
          }}
        />
      ) : (
        <text
          x={node.x}
          y={node.y + 6}
          textAnchor="middle"
          className="text-base font-heading fill-balete"
          fontWeight="bold"
          style={{
            opacity: loaded ? 1 : 0,
            transition: `opacity 0.5s ease ${index * 0.06}s`,
          }}
        >
          {member.fullName.charAt(0)}
        </text>
      )}

      {/* Deceased indicator - subtle diagonal cross */}
      {member.livingStatus === "deceased" && (
        <>
          <line
            x1={node.x - NODE_RADIUS * 0.45}
            y1={node.y - NODE_RADIUS * 0.45}
            x2={node.x + NODE_RADIUS * 0.45}
            y2={node.y + NODE_RADIUS * 0.45}
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.4}
            strokeLinecap="round"
          />
          <line
            x1={node.x + NODE_RADIUS * 0.45}
            y1={node.y - NODE_RADIUS * 0.45}
            x2={node.x - NODE_RADIUS * 0.45}
            y2={node.y + NODE_RADIUS * 0.45}
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.4}
            strokeLinecap="round"
          />
        </>
      )}

      {/* Spouse indicator on inner edge */}
      {node.spouseId && !node.isSpouse && (
        <circle
          cx={node.x - NODE_RADIUS - 4}
          cy={node.y}
          r={5}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
      )}

      {/* Name label */}
      <text
        x={node.x}
        y={node.y + NODE_RADIUS + 18}
        textAnchor="middle"
        className="text-xs font-sans fill-ink"
        fontWeight={isHovered ? "600" : "500"}
        style={{
          opacity: loaded ? 1 : 0,
          transition: `opacity 0.5s ease ${index * 0.06}s`,
        }}
      >
        {member.nickname || member.fullName.split(" ")[0]}
      </text>

      {/* Branch tag on hover */}
      {showBranchTag && (
        <g style={{ opacity: 0, animation: "fade-in 0.2s ease forwards" }}>
          <rect
            x={node.x - 20}
            y={node.y + NODE_RADIUS + 22}
            width={40}
            height={16}
            rx={8}
            fill={color}
            fillOpacity={0.15}
          />
          <text
            x={node.x}
            y={node.y + NODE_RADIUS + 33}
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
        cx={node.x}
        cy={node.y - NODE_RADIUS - 10}
        r={isHovered ? 4 : 3}
        fill={color}
        opacity={isHovered ? 1 : 0.7}
        style={{ transition: "r 0.2s ease, opacity 0.2s ease" }}
      />
    </g>
  );
}
"use client";

import { useState } from "react";
import type { FamilyMember } from "@/lib/types";
import { getBranchColor } from "@/lib/tree/layout";

const MANGO = "var(--color-mango)";
const RATTAN = "var(--color-rattan)";

interface TreeNodeCardProps {
  node: {
    id: string;
    x: number;
    y: number;
    radius: number;
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
}

export default function TreeNodeCard({
  node,
  allBranches,
  onSelect,
  onHover,
  activeBranch,
  hoveredId,
  setHoveredId,
  loaded,
  index,
}: TreeNodeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const member = node.member;
  const color = getBranchColor(member.branch, allBranches);
  const isDimmed = activeBranch && member.branch !== activeBranch;
  const isDeceased = member.livingStatus === "deceased";
  const r = node.radius;
  const ringColor = isDeceased ? RATTAN : MANGO;

  const handleMouseEnter = () => {
    setIsHovered(true);
    setHoveredId(member.id);
    onHover(member);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setHoveredId(null);
    onHover(null);
  };

  const initial = member.fullName.charAt(0).toUpperCase();
  const displayName = member.nickname || member.fullName.split(" ")[0];

  return (
    <g
      onClick={() => onSelect(member)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer"
      style={{
        opacity: isDimmed ? 0.3 : 1,
        transition: "opacity 0.3s ease, transform 0.3s ease",
        transform: isDimmed ? "scale(0.92)" : "scale(1)",
        transformOrigin: `${node.x}px ${node.y}px`,
      }}
    >
      <defs>
        {member.photoUrl && (
          <clipPath id={`clip-circle-${member.id}`}>
            <circle cx={node.x} cy={node.y} r={r - 4} />
          </clipPath>
        )}
        <radialGradient id={`glow-${member.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={ringColor} stopOpacity={isHovered ? 0.3 : 0} />
          <stop offset="100%" stopColor={ringColor} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Hover glow */}
      {isHovered && (
        <circle
          cx={node.x}
          cy={node.y}
          r={r + 12}
          fill={`url(#glow-${member.id})`}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Outer ring — mango gold (living) or rattan (deceased) */}
      <circle
        cx={node.x}
        cy={node.y}
        r={r + 3}
        fill="none"
        stroke={ringColor}
        strokeWidth={isHovered ? 3.5 : 2.5}
        strokeOpacity={isHovered ? 1 : isDeceased ? 0.7 : 0.7}
        style={{
          transition: "stroke-width 0.3s ease, stroke-opacity 0.3s ease",
          transform: isHovered ? "scale(1.08)" : "scale(1)",
          transformOrigin: `${node.x}px ${node.y}px`,
        }}
      />

      {/* Deceased dashed outer ring */}
      {isDeceased && (
        <circle
          cx={node.x}
          cy={node.y}
          r={r + 8}
          fill="none"
          stroke={RATTAN}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          strokeOpacity={0.6}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Background circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={r}
        fill="rgba(245, 246, 243, 0.96)"
        style={{
          filter: isHovered
            ? "drop-shadow(0 4px 12px rgba(232, 166, 61, 0.35))"
            : "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
          transition: "filter 0.3s ease",
          opacity: loaded ? 1 : 0,
        }}
      />

      {/* Deceased semi-transparent overlay */}
      {isDeceased && (
        <circle
          cx={node.x}
          cy={node.y}
          r={r}
          fill="rgba(23, 26, 23, 0.08)"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Photo or initial */}
      {member.photoUrl ? (
        <image
          href={member.photoUrl}
          xlinkHref={member.photoUrl}
          x={node.x - (r - 4)}
          y={node.y - (r - 4)}
          width={(r - 4) * 2}
          height={(r - 4) * 2}
          clipPath={`url(#clip-circle-${member.id})`}
          preserveAspectRatio="xMidYMid slice"
          style={{
            opacity: loaded ? 1 : 0,
            transition: `opacity 0.5s ease ${index * 0.06}s`,
          }}
        />
      ) : (
        <>
          <circle
            cx={node.x}
            cy={node.y}
            r={r - 4}
            fill={color}
            fillOpacity={0.15}
            style={{
              opacity: loaded ? 1 : 0,
              transition: `opacity 0.5s ease ${index * 0.06}s`,
            }}
          />
          <text
            x={node.x}
            y={node.y + r * 0.12}
            textAnchor="middle"
            fill={color}
            fontWeight="700"
            style={{
              fontSize: r * 0.7,
              fontFamily: "Fraunces, serif",
              opacity: loaded ? 1 : 0,
              transition: `opacity 0.5s ease ${index * 0.06}s`,
            }}
          >
            {initial}
          </text>
        </>
      )}

      {/* Name label below node */}
      <text
        x={node.x}
        y={node.y + r + 18}
        textAnchor="middle"
        fill="#171A17"
        fontWeight="600"
        style={{
          fontSize: Math.max(10, r * 0.32),
          fontFamily: "Fraunces, serif",
          opacity: loaded ? 1 : 0,
          transition: `opacity 0.5s ease ${index * 0.06}s`,
        }}
      >
        {displayName}
      </text>

      {/* Branch + Gen subtitle */}
      <text
        x={node.x}
        y={node.y + r + 18 + Math.max(10, r * 0.32) + 4}
        textAnchor="middle"
        fill="#F5F6F3"
        style={{
          fontSize: Math.max(8, r * 0.24),
          fontFamily: "Inter, sans-serif",
          opacity: loaded ? 0.6 : 0,
          transition: `opacity 0.5s ease ${index * 0.06}s`,
        }}
      >
        {member.branch} · Gen {member.generation}
      </text>

      {/* In memoriam label */}
      {isDeceased && (
        <text
          x={node.x}
          y={node.y + r + 18 + Math.max(10, r * 0.32) + 4 + Math.max(8, r * 0.24) + 3}
          textAnchor="middle"
          fill="#BFA06A"
          style={{
            fontSize: Math.max(7, r * 0.2),
            fontFamily: "Inter, sans-serif",
            fontStyle: "italic",
            opacity: loaded ? 0.8 : 0,
            transition: `opacity 0.5s ease ${index * 0.06}s`,
          }}
        >
          In memoriam
        </text>
      )}

      {/* Deceased cross overlay */}
      {isDeceased && (
        <g style={{ pointerEvents: "none" }} opacity={0.6}>
          <line
            x1={node.x - r * 0.25}
            y1={node.y - r * 0.25}
            x2={node.x + r * 0.25}
            y2={node.y + r * 0.25}
            stroke="#BFA06A"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <line
            x1={node.x + r * 0.25}
            y1={node.y - r * 0.25}
            x2={node.x - r * 0.25}
            y2={node.y + r * 0.25}
            stroke="#BFA06A"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Branch color indicator — small dot at bottom-right of ring */}
      <circle
        cx={node.x + r * 0.65}
        cy={node.y + r * 0.65}
        r={Math.min(4, r * 0.15)}
        fill={color}
        stroke="rgba(245, 246, 243, 0.9)"
        strokeWidth={2}
        style={{
          opacity: loaded ? 0.9 : 0,
          transition: `opacity 0.5s ease ${index * 0.06}s`,
        }}
      />

      {/* Spouse heart indicator */}
      {node.spouseId && !node.isSpouse && (
        <g
          transform={`translate(${node.x + r - 2}, ${node.y - r - 2})`}
          style={{ pointerEvents: "none" }}
        >
          <path
            d="M6 3C4.9 1.9 3.1 1.9 2 3 .9 4.1.9 5.9 2 7l4 4 4-4c1.1-1.1 1.1-2.9 0-4-1.1-1.1-2.9-1.1-4 0L6 3z"
            fill={MANGO}
            fillOpacity={0.6}
            transform="scale(0.7)"
          />
        </g>
      )}
    </g>
  );
}

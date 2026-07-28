"use client";

import { useState } from "react";
import type { FamilyMember } from "@/lib/types";
import { getBranchColor } from "@/lib/tree/layout";

const CARD_WIDTH = 160;
const CARD_HEIGHT = 100;
const AVATAR_SIZE = 48;

interface TreeNodeCardProps {
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
    >
      <defs>
        {member.photoUrl && (
          <clipPath id={`clip-card-${member.id}`}>
            <rect
              x={node.x - CARD_WIDTH / 2 + 8}
              y={node.y - CARD_HEIGHT / 2 + 8}
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              rx={AVATAR_SIZE / 2}
            />
          </clipPath>
        )}
      </defs>

      {/* Card background with branch border */}
      <rect
        x={node.x - CARD_WIDTH / 2}
        y={node.y - CARD_HEIGHT / 2}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        rx={12}
        fill="rgba(241, 232, 214, 0.95)"
        stroke={color}
        strokeWidth={isHovered ? 2.5 : 1.5}
        strokeOpacity={isHovered ? 0.9 : 0.5}
        style={{
          filter: isHovered
            ? "drop-shadow(0 6px 16px rgba(194, 59, 110, 0.3))"
            : "drop-shadow(0 3px 8px rgba(0,0,0,0.12))",
          transition: "filter 0.3s ease, transform 0.3s ease, stroke 0.3s ease, opacity 0.5s ease",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          transformOrigin: `${node.x}px ${node.y}px`,
          opacity: loaded ? 1 : 0,
        }}
      />

      {/* Deceased overlay */}
      {member.livingStatus === "deceased" && (
        <rect
          x={node.x - CARD_WIDTH / 2}
          y={node.y - CARD_HEIGHT / 2}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          rx={12}
          fill="rgba(0,0,0,0.08)"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Photo or initial - top left */}
      <g transform={`translate(${node.x - CARD_WIDTH / 2 + 8}, ${node.y - CARD_HEIGHT / 2 + 8})`}>
        {member.photoUrl ? (
          <image
            href={member.photoUrl}
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            clipPath={`url(#clip-card-${member.id})`}
            preserveAspectRatio="xMidYMid slice"
            style={{
              opacity: loaded ? 1 : 0,
              transition: `opacity 0.5s ease ${index * 0.06}s`,
            }}
          />
        ) : (
          <circle
            cx={AVATAR_SIZE / 2}
            cy={AVATAR_SIZE / 2}
            r={AVATAR_SIZE / 2}
            fill={color}
            style={{
              opacity: loaded ? 1 : 0,
              transition: `opacity 0.5s ease ${index * 0.06}s`,
            }}
          />
        )}
        {!member.photoUrl && (
          <text
            x={AVATAR_SIZE / 2}
            y={AVATAR_SIZE / 2 + 4}
            textAnchor="middle"
            className="text-base font-heading fill-parchment"
            fontWeight="bold"
            style={{
              opacity: loaded ? 1 : 0,
              transition: `opacity 0.5s ease ${index * 0.06}s`,
            }}
          >
            {member.fullName.charAt(0)}
          </text>
        )}
      </g>

      {/* Name and info - right of avatar */}
      <g
        transform={`translate(${node.x - CARD_WIDTH / 2 + 8 + AVATAR_SIZE + 10}, ${node.y - CARD_HEIGHT / 2 + 14})`}
        style={{
          opacity: loaded ? 1 : 0,
          transition: `opacity 0.5s ease ${index * 0.06}s`,
        }}
      >
        <text
          x={0}
          y={0}
          className="text-sm font-heading fill-balete"
          fontWeight="600"
        >
          {member.nickname || member.fullName.split(" ")[0]}
        </text>
        <text
          x={0}
          y={20}
          className="text-[10px] font-sans fill-ink"
        >
          {member.fullName.split(" ").slice(1).join(" ")}
        </text>
        <text
          x={0}
          y={36}
          className="text-[10px] font-sans"
          fill={color}
          fontWeight="500"
        >
          <tspan>{member.branch}</tspan>
          <tspan dx="6" fill="#5C5445">•</tspan>
          <tspan dx="6">Gen {member.generation}</tspan>
        </text>
        {member.livingStatus === "deceased" && (
          <text
            x={0}
            y={52}
            className="text-[10px] font-sans"
            fill="#8B5E3C"
          >
            🕊 In memoriam
          </text>
        )}
      </g>

      {/* Branch indicator bar - left edge */}
      <rect
        x={node.x - CARD_WIDTH / 2}
        y={node.y - CARD_HEIGHT / 2}
        width={4}
        height={CARD_HEIGHT}
        rx={12}
        fill={color}
        fillOpacity={0.3}
        style={{
          opacity: loaded ? 1 : 0,
          transition: `opacity 0.5s ease ${index * 0.06}s`,
        }}
      />

      {/* Deceased cross - top right */}
      {member.livingStatus === "deceased" && (
        <g
          transform={`translate(${node.x + CARD_WIDTH / 2 - 24}, ${node.y - CARD_HEIGHT / 2 + 8})`}
          style={{ pointerEvents: "none" }}
        >
          <line
            x1={0}
            y1={0}
            x2={16}
            y2={16}
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.5}
            strokeLinecap="round"
          />
          <line
            x1={16}
            y1={0}
            x2={0}
            y2={16}
            stroke={color}
            strokeWidth={2}
            strokeOpacity={0.5}
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Spouse indicator - small heart icon on right */}
      {node.spouseId && !node.isSpouse && (
        <g
          transform={`translate(${node.x + CARD_WIDTH / 2 - 20}, ${node.y - 8})`}
          style={{ pointerEvents: "none" }}
        >
          <path
            d="M8 4c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
            fill={color}
            fillOpacity={0.4}
          />
        </g>
      )}
    </g>
  );
}
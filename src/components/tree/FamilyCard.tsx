"use client";

import type { FamilyMember } from "@/lib/types";

interface FamilyCardProps {
  member: FamilyMember;
  color: string;
  onSelect: (member: FamilyMember) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function FamilyCard({ member, color, onSelect }: FamilyCardProps) {
  const isDeceased = member.livingStatus === "deceased";

  return (
    <button
      onClick={() => onSelect(member)}
      data-member-id={member.id}
      className="group relative z-10 w-full text-left bg-surface rounded-2xl border border-line overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-balete/5 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-mango/50"
    >
      {/* Photo area */}
      <div
        className="relative aspect-[4/3] overflow-hidden flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${color}18, ${color}08)`,
        }}
      >
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.fullName}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              isDeceased ? "grayscale-[0.6] sepia-[0.15]" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="font-heading text-4xl sm:text-5xl select-none"
              style={{ color: `${color}b3` }}
            >
              {getInitials(member.fullName)}
            </span>
          </div>
        )}

        {/* Generation chip */}
        <span
          className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-sans font-semibold uppercase tracking-wider backdrop-blur-sm"
          style={{ backgroundColor: `${color}26`, color, border: `1px solid ${color}40` }}
        >
          Gen {member.generation}
        </span>

        {/* In memoriam */}
        {isDeceased && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-sans font-semibold uppercase tracking-wider bg-balete-deep/70 text-parchment/80 backdrop-blur-sm">
            In memoriam
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-heading text-base text-ink truncate group-hover:text-balete transition-colors">
          {member.nickname || member.fullName}
        </p>
        {member.nickname && (
          <p className="text-xs font-sans text-soft/70 truncate">{member.fullName}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-sans text-soft truncate">{member.branch}</span>
          </span>
          <svg className="w-3.5 h-3.5 text-soft/25 group-hover:text-mango flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </button>
  );
}

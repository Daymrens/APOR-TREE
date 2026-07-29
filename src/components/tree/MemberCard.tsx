"use client";

import { useMemo } from "react";
import type { FamilyMember } from "@/lib/types";

interface MemberCardProps {
  member: FamilyMember;
  allMembers: FamilyMember[];
  onClose: () => void;
  onSelect: (member: FamilyMember) => void;
}

const BRANCH_COLORS = [
  "#C23B6E", "#E8A63D", "#1E3B2C", "#C9A876",
  "#5C5445", "#8B5E3C", "#2E6B62", "#7C3AED",
];

function getBranchColor(branch: string, allBranches: string[]): string {
  const index = allBranches.indexOf(branch);
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}

export default function MemberCard({ member, allMembers, onClose, onSelect }: MemberCardProps) {
  const allBranches = useMemo(() => {
    const set = new Set(allMembers.map((m) => m.branch));
    return Array.from(set).sort();
  }, [allMembers]);

  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    allMembers.forEach((m) => map.set(m.id, m));
    return map;
  }, [allMembers]);

  const parents = useMemo(
    () => member.parentIds.map((id) => memberMap.get(id)).filter(Boolean) as FamilyMember[],
    [member.parentIds, memberMap]
  );

  const children = useMemo(
    () => allMembers.filter((m) => m.parentIds.includes(member.id)),
    [member.id, allMembers]
  );

  const spouse = useMemo(
    () => (member.spouseId ? memberMap.get(member.spouseId) : null) as FamilyMember | null,
    [member.spouseId, memberMap]
  );

  const siblings = useMemo(() => {
    if (parents.length === 0) return [];
    return allMembers.filter(
      (m) =>
        m.id !== member.id &&
        m.parentIds.some((pid) => member.parentIds.includes(pid))
    );
  }, [member, allMembers, parents]);

  const color = getBranchColor(member.branch, allBranches);

  function handleRelativeClick(relative: FamilyMember) {
    onSelect(relative);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-parchment/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 clay-dark rounded-full flex items-center justify-center transition-all duration-200 z-10"
        >
          <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-18 h-18 rounded-full p-[3px] flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
            >
              <div className="w-full h-full rounded-full bg-parchment flex items-center justify-center overflow-hidden">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.fullName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-heading text-xl text-balete">
                    {member.fullName.charAt(0)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <h2 className="font-heading text-xl text-balete truncate">
                {member.fullName}
              </h2>
              {member.nickname && (
                <p className="text-soft font-sans text-sm">&ldquo;{member.nickname}&rdquo;</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className="px-2.5 py-1 rounded-xl text-xs font-sans font-medium border"
              style={{
                backgroundColor: `${color}12`,
                color: color,
                borderColor: `${color}25`,
              }}
            >
              Gen {member.generation}
            </span>
            <span
              className="px-2.5 py-1 rounded-xl text-xs font-sans font-medium clay text-ink flex items-center gap-1"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {member.branch}
            </span>
            {member.livingStatus === "deceased" && (
              <span className="px-2.5 py-1 rounded-xl text-xs font-sans bg-soft/10 text-soft border border-soft/20">
                In memoriam
              </span>
            )}
          </div>

          {member.notes && (
            <p className="text-ink font-sans text-sm leading-relaxed mb-3">
              {member.notes}
            </p>
          )}

          <div className="pt-3 border-t border-rattan/20 text-xs font-sans text-soft/60">
            Birth order: {member.birthOrder + 1}
          </div>
        </div>

        {/* Family connections */}
        {(parents.length > 0 || children.length > 0 || spouse || siblings.length > 0) && (
          <div className="px-6 pb-6 space-y-4">
            <h3 className="text-xs font-sans font-medium text-soft/50 uppercase tracking-wider">
              Family Connections
            </h3>

            {/* Spouse */}
            {spouse && (
              <ConnectionSection
                label="Spouse"
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                }
                members={[spouse]}
                allBranches={allBranches}
                onSelect={handleRelativeClick}
              />
            )}

            {/* Parents */}
            {parents.length > 0 && (
              <ConnectionSection
                label="Parent${parents.length > 1 ? 's' : ''}"
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                }
                members={parents}
                allBranches={allBranches}
                onSelect={handleRelativeClick}
              />
            )}

            {/* Children */}
            {children.length > 0 && (
              <ConnectionSection
                label="Child${children.length > 1 ? 'ren' : ''}"
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                }
                members={children}
                allBranches={allBranches}
                onSelect={handleRelativeClick}
              />
            )}

            {/* Siblings */}
            {siblings.length > 0 && (
              <ConnectionSection
                label="Sibling${siblings.length > 1 ? 's' : ''}"
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                }
                members={siblings}
                allBranches={allBranches}
                onSelect={handleRelativeClick}
              />
            )}
          </div>
        )}

        <a
          href={`/tree/${member.id}`}
          className="block text-center text-hibiscus text-sm font-sans hover:underline mt-4 pt-3 border-t border-white/20"
        >
          View full profile →
        </a>
      </div>
    </div>
  );
}

function ConnectionSection({
  label,
  icon,
  members,
  allBranches,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  members: FamilyMember[];
  allBranches: string[];
  onSelect: (m: FamilyMember) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 text-soft/50">
        {icon}
        <span className="text-[11px] font-sans font-medium">{label}</span>
      </div>
      <div className="space-y-1.5">
        {members.map((m) => {
          const color = getBranchColor(m.branch, allBranches);
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/50 transition-all duration-200 text-left group"
            >
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${color}25, ${color}10)`,
                  border: `1.5px solid ${color}30`,
                }}
              >
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt={m.fullName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="font-heading text-xs" style={{ color }}>{m.fullName.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-sans text-ink truncate group-hover:text-balete transition-colors">
                  {m.nickname || m.fullName}
                </p>
                <p className="text-[10px] font-sans text-soft/50 truncate">
                  {m.branch} · Gen {m.generation}
                </p>
              </div>
              <svg className="w-3.5 h-3.5 text-soft/25 group-hover:text-soft/50 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import type { FamilyMember } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";
import Link from "next/link";

const BRANCH_COLORS: Record<string, string> = {
  Apor: "#1E3B2C",
  Jose: "#C23B6E",
  Rosa: "#E8A63D",
  Antonio: "#2E6B62",
};

const FALLBACK_COLOR = "#C9A876";

function getBranchColor(branch: string): string {
  return BRANCH_COLORS[branch] || FALLBACK_COLOR;
}

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "family_members")).then((snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FamilyMember[];
      setMembers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const member = memberMap.get(id);

  const parents = useMemo(
    () => member ? member.parentIds.map((pid) => memberMap.get(pid)).filter(Boolean) as FamilyMember[] : [],
    [member, memberMap]
  );

  const spouse = useMemo(
    () => member?.spouseId ? memberMap.get(member.spouseId) || null : null,
    [member, memberMap]
  );

  const children = useMemo(
    () => member ? members.filter((m) => m.parentIds.includes(member.id)) : [],
    [member, members]
  );

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <BackButton />
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mango/15 mb-4 animate-pulse">
            <svg className="w-8 h-8 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <p className="text-soft font-sans">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <BackButton />
        <div className="text-center py-16 animate-fade-in">
          <p className="text-soft font-sans">Member not found.</p>
        </div>
      </div>
    );
  }

  const color = getBranchColor(member.branch);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <BackButton />

      <div className="animate-fade-in">
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 mb-4">
          <div className="flex flex-col items-center text-center mb-5">
            <div
              className="w-24 h-24 rounded-full p-[3px] mb-4"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
            >
              <div className="w-full h-full rounded-full bg-parchment flex items-center justify-center overflow-hidden">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-heading text-3xl text-balete">
                    {member.fullName.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            <h1 className="font-heading text-2xl text-balete mb-1">
              {member.fullName}
            </h1>

            {member.nickname && (
              <p className="text-soft font-sans text-sm mb-3">
                &ldquo;{member.nickname}&rdquo;
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap justify-center">
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
              <span className="px-2.5 py-1 rounded-xl text-xs font-sans font-medium bg-white/50 text-ink flex items-center gap-1 border border-white/20">
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
          </div>

          <div className="border-t border-rattan/20 pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm font-sans">
              <span className="text-soft/60">Birth order</span>
              <span className="text-ink font-medium">{member.birthOrder + 1}</span>
            </div>
            {member.notes && (
              <div className="pt-2 border-t border-rattan/20">
                <p className="text-ink font-sans text-sm leading-relaxed">
                  {member.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {(parents.length > 0 || spouse || children.length > 0) && (
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 animate-slide-up">
            <h2 className="text-xs font-sans font-medium text-soft/50 uppercase tracking-wider mb-4">
              Family Connections
            </h2>

            {spouse && (
              <ProfileConnection
                label="Spouse"
                members={[spouse]}
                onSelect={() => {}}
              />
            )}

            {parents.length > 0 && (
              <ProfileConnection
                label="Parent"
                members={parents}
                onSelect={() => {}}
              />
            )}

            {children.length > 0 && (
              <ProfileConnection
                label="Child"
                members={children}
                onSelect={() => {}}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileConnection({
  label,
  members,
  onSelect,
}: {
  label: string;
  members: FamilyMember[];
  onSelect: (m: FamilyMember) => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-[11px] font-sans font-medium text-soft/50 mb-2">
        {label}{members.length > 1 ? "s" : ""}
      </p>
      <div className="space-y-1.5">
        {members.map((m) => {
          const color = getBranchColor(m.branch);
          return (
            <Link
              key={m.id}
              href={`/tree/${m.id}`}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/50 transition-all duration-200 group"
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
                <p className="text-[10px] font-sans text-soft/50 truncate flex items-center gap-1">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {m.branch} · Gen {m.generation}
                </p>
              </div>
              <svg className="w-3.5 h-3.5 text-soft/25 group-hover:text-soft/50 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

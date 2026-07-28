"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { FamilyMember } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";
import Skeleton from "@/components/ui/Skeleton";

const BRANCH_COLORS = [
  "#C23B6E", "#E8A63D", "#1E3B2C", "#C9A876",
  "#5C5445", "#8B5E3C", "#2E6B62", "#7C3AED",
];

function getBranchColor(branch: string, allBranches: string[]): string {
  const index = allBranches.indexOf(branch);
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}

export default function MemberProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "family_members"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FamilyMember[];
        setAllMembers(data);
        const found = data.find((m) => m.id === id);
        setMember(found ?? null);
        setLoading(false);
      },
      (error) => {
        console.warn("Firestore not available:", error.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  const allBranches = useMemo(() => {
    const set = new Set(allMembers.map((m) => m.branch));
    return Array.from(set).sort();
  }, [allMembers]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <BackButton />
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mango/15 mb-4">
            <svg className="w-8 h-8 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
            </svg>
          </div>
          <p className="text-soft font-sans">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <BackButton />
        <div className="animate-fade-in mt-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rattan/10 mb-4">
            <svg className="w-8 h-8 text-rattan" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <h2 className="font-heading text-xl text-balete mb-2">Member not found</h2>
          <p className="text-soft font-sans">This profile doesn&apos;t exist or was removed.</p>
        </div>
      </div>
    );
  }

  const memberMap = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    allMembers.forEach((m) => map.set(m.id, m));
    return map;
  }, [allMembers]);

  const parents = useMemo(
    () => member.parentIds.map((pid) => memberMap.get(pid)).filter(Boolean) as FamilyMember[],
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

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <BackButton />
      <div className="text-center mb-8 animate-fade-in">
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full p-[3px] mb-4 animate-float"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
        >
          <div className="w-full h-full rounded-full bg-parchment flex items-center justify-center overflow-hidden">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.fullName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="font-heading text-2xl text-balete">
                {member.fullName.charAt(0)}
              </span>
            )}
          </div>
        </div>
        <h1 className="font-heading text-2xl text-balete mb-1">{member.fullName}</h1>
        {member.nickname && <p className="text-soft text-sm font-sans">&ldquo;{member.nickname}&rdquo;</p>}
        <div className="flex items-center justify-center gap-2 mt-2">
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
            className="px-2.5 py-1 rounded-xl text-xs font-sans font-medium glass-card text-ink flex items-center gap-1"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {member.branch}
          </span>
          {member.livingStatus === "deceased" && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-sans bg-soft/10 text-soft border border-soft/20">
              In memoriam
            </span>
          )}
        </div>
      </div>

      {member.notes && (
        <div className="glass-card rounded-2xl p-5 mb-6 animate-slide-up">
          <p className="text-ink font-sans text-sm leading-relaxed">{member.notes}</p>
        </div>
      )}

      <div className="glass-card rounded-2xl p-5 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h3 className="font-heading text-lg text-balete mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
          </svg>
          Details
        </h3>
        <div className="space-y-3 text-sm font-sans">
          <div className="flex justify-between">
            <span className="text-soft">Birth order</span>
            <span className="text-ink font-medium">{member.birthOrder + 1}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-soft">Status</span>
            <span className="text-ink font-medium capitalize">{member.livingStatus}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-soft">Generation</span>
            <span className="text-ink font-medium">Gen {member.generation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-soft">Branch</span>
            <span className="text-ink font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {member.branch}
            </span>
          </div>
        </div>
      </div>

      {(parents.length > 0 || children.length > 0 || spouse || siblings.length > 0) && (
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <h3 className="font-heading text-lg text-balete mb-4">Family Connections</h3>
          <div className="space-y-4">
            {spouse && (
              <ConnectionSection
                label="Spouse"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                }
                members={[spouse]}
              />
            )}

            {parents.length > 0 && (
              <ConnectionSection
                label={`Parent${parents.length > 1 ? "s" : ""}`}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                }
                members={parents}
              />
            )}

            {children.length > 0 && (
              <ConnectionSection
                label={`Child${children.length > 1 ? "ren" : ""}`}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                }
                members={children}
              />
            )}

            {siblings.length > 0 && (
              <ConnectionSection
                label={`Sibling${siblings.length > 1 ? "s" : ""}`}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                }
                members={siblings}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionSection({
  label,
  icon,
  members,
}: {
  label: string;
  icon: React.ReactNode;
  members: FamilyMember[];
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 text-soft/50">
        {icon}
        <span className="text-[11px] font-sans font-medium">{label}</span>
      </div>
      <div className="space-y-1.5">
        {members.map((m) => {
          const color = getBranchColor(m.branch, Array.from(new Set(members.map((x) => x.branch))));
          return (
            <button
              key={m.id}
              onClick={() => window.location.href = `/tree/${m.id}`}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/50 transition-all duration-200 text-left"
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
                <p className="text-sm font-sans text-ink truncate">{m.nickname || m.fullName}</p>
                <p className="text-[10px] font-sans text-soft/50 truncate">
                  {m.branch} · Gen {m.generation}
                </p>
              </div>
              <svg className="w-3.5 h-3.5 text-soft/25 hover:text-soft/50 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { FamilyMember } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";
import ShareButton from "@/components/ShareButton";
import Skeleton from "@/components/ui/Skeleton";
import TreeSpine from "@/components/tree/TreeSpine";
import MemberCard from "@/components/tree/MemberCard";

const BRANCH_COLORS = [
  "#C23B6E", "#E8A63D", "#1E3B2C", "#C9A876",
  "#5C5445", "#8B5E3C", "#2E6B62", "#7C3AED",
];

function getBranchColor(branch: string, allBranches: string[]): string {
  const index = allBranches.indexOf(branch);
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}

export default function TreePage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBranch, setActiveBranch] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [hoveredMember, setHoveredMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "family_members"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FamilyMember[];
        setMembers(data);
        setLoading(false);
      },
      (error) => {
        if (process.env.NODE_ENV === "development") console.warn("Firestore not available:", error.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const branches = useMemo(() => {
    const set = new Set(members.map((m) => m.branch));
    return Array.from(set).sort();
  }, [members]);

  const generations = useMemo(() => {
    const set = new Set(members.map((m) => m.generation));
    return Array.from(set).sort();
  }, [members]);

  const livingCount = members.filter((m) => m.livingStatus === "living").length;
  const deceasedCount = members.filter((m) => m.livingStatus === "deceased").length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="fixed top-4 right-4 z-50">
        <ShareButton />
      </div>
      <BackButton />

      {/* Header with stats */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="font-heading text-3xl text-balete mb-1">Family Tree</h1>
            <p className="text-soft font-sans text-sm">
              {loading
                ? "Loading..."
                : members.length === 0
                ? "Names are being collected."
                : `${members.length} member${members.length === 1 ? "" : "s"} · ${branches.length} branch${branches.length === 1 ? "" : "es"} · ${generations.length} generation${generations.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {/* Hovered member tooltip (desktop) */}
          {hoveredMember && !loading && (
            <div className="hidden sm:block clay rounded-xl px-3 py-2 text-xs font-sans animate-fade-in max-w-[200px]">
              <p className="font-medium text-ink truncate">{hoveredMember.fullName}</p>
              <p className="text-soft/60 truncate">{hoveredMember.branch} · Gen {hoveredMember.generation}</p>
            </div>
          )}
        </div>

        {/* Stats row */}
        {!loading && members.length > 0 && (
          <div className="flex items-center gap-4 text-xs font-sans text-soft/60 mb-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {livingCount} living
            </span>
            {deceasedCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-soft/40" />
                {deceasedCount} in memoriam
              </span>
            )}
          </div>
        )}

        {/* Branch filter */}
        {branches.length > 1 && (
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <p className="text-soft/50 text-[10px] font-sans mb-1.5 uppercase tracking-wider">Filter by branch</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveBranch(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-200 ${
                  activeBranch === null
                    ? "bg-gradient-to-r from-balete to-[#2E6B62] text-parchment shadow-md"
                    : "clay text-ink"
                }`}
              >
                All
              </button>
              {branches.map((branch) => {
                const color = getBranchColor(branch, branches);
                const isActive = activeBranch === branch;
                return (
                  <button
                    key={branch}
                    onClick={() => setActiveBranch(activeBranch === branch ? null : branch)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? "text-parchment shadow-md"
                        : "clay text-ink"
                    }`}
                    style={isActive ? { background: `linear-gradient(135deg, ${color}, ${color}cc)` } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isActive ? "rgba(255,255,255,0.7)" : color }}
                    />
                    {branch}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tree */}
      {loading ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mango/15 mb-4">
            <svg className="w-8 h-8 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
            </svg>
          </div>
          <p className="text-soft font-sans">Loading family tree...</p>
          <div className="mt-4 space-y-3 max-w-md mx-auto">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-32 w-full mx-auto" />
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mango/15 mb-4">
            <svg className="w-8 h-8 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
            </svg>
          </div>
          <p className="text-soft font-sans">
            The family tree is being built — names are being collected.
          </p>
          <p className="text-soft/60 text-sm font-sans mt-2">
            Ask your family organizer to add members in the admin panel.
          </p>
        </div>
      ) : (
        <TreeSpine
          members={members}
          activeBranch={activeBranch}
          onSelect={setSelectedMember}
          onHover={setHoveredMember}
        />
      )}

      {/* Member card modal */}
      {selectedMember && (
        <MemberCard
          member={selectedMember}
          allMembers={members}
          onClose={() => setSelectedMember(null)}
          onSelect={setSelectedMember}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { FamilyMember } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";
import ShareButton from "@/components/ShareButton";
import Skeleton from "@/components/ui/Skeleton";
import FamilyCard from "@/components/tree/FamilyCard";
import MemberCard from "@/components/tree/MemberCard";
import TreeLines from "@/components/tree/TreeLines";
import { withDerivedBranches, BRANCH_ORDER, BRANCH_COLORS } from "@/lib/branches";

export default function TreePage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBranch, setActiveBranch] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "family_members"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FamilyMember[];
        setMembers(withDerivedBranches(data));
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
    return BRANCH_ORDER.filter((b) => members.some((m) => m.branch === b));
  }, [members]);

  const generations = useMemo(() => {
    const set = new Set(members.map((m) => m.generation));
    return Array.from(set).sort();
  }, [members]);

  const livingCount = members.filter((m) => m.livingStatus === "living").length;
  const deceasedCount = members.filter((m) => m.livingStatus === "deceased").length;

  const generationGroups = useMemo(() => {
    const filtered = activeBranch
      ? members.filter((m) => m.branch === activeBranch)
      : members;
    const groups = new Map<number, FamilyMember[]>();
    filtered.forEach((m) => {
      const list = groups.get(m.generation) ?? [];
      list.push(m);
      groups.set(m.generation, list);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([generation, list]) => ({
        generation,
        members: list.sort((a, b) => a.birthOrder - b.birthOrder),
      }));
  }, [members, activeBranch]);

  const visibleMembers = useMemo(
    () => generationGroups.flatMap((g) => g.members),
    [generationGroups]
  );

  const membersMissingPhotos = useMemo(
    () => members.filter((m) => !m.photoUrl).length,
    [members]
  );

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
                const color = BRANCH_COLORS[branch] ?? "#94a3b8";
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
      ) : generationGroups.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mango/15 mb-4">
            <svg className="w-8 h-8 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
            </svg>
          </div>
          <p className="text-soft font-sans">No members in this branch yet.</p>
        </div>
      ) : (
        <div ref={treeContainerRef} className="relative">
          <TreeLines members={visibleMembers} containerRef={treeContainerRef} />
          <div className="relative space-y-10">
            {generationGroups.map(({ generation, members: groupMembers }) => (
              <section key={generation} className="animate-slide-up" style={{ animationDelay: `${generation * 0.05}s` }}>
                <div className="flex items-baseline gap-3 mb-4 relative z-10">
                  <h2 className="font-heading text-xl text-balete">
                    Generation {generation}
                  </h2>
                  <span className="text-soft/50 font-mono text-xs">
                    {groupMembers.length} member{groupMembers.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {groupMembers.map((m) => (
                    <FamilyCard
                      key={m.id}
                      member={m}
                      color={BRANCH_COLORS[m.branch] ?? "#94a3b8"}
                      onSelect={setSelectedMember}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* Photo hint */}
      {!loading && membersMissingPhotos > 0 && (
        <p className="mt-8 text-center text-xs font-sans text-soft/50">
          {membersMissingPhotos} member{membersMissingPhotos === 1 ? "" : "s"} still need a photo — ask your family organizer to add one in the admin panel.
        </p>
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

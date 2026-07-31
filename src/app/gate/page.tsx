"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import FamilyWordmark from "@/components/FamilyWordmark";
import type { FamilyMember } from "@/lib/types";

const BRANCH_COLORS: Record<string, string> = {
  Apor: "#3E8E68",
  Jose: "#E26A8C",
  Rosa: "#E8A63D",
  Antonio: "#4A9C92",
};

function getBranchColor(branch: string): string {
  return BRANCH_COLORS[branch] || "#C9A876";
}

type Step = "passcode" | "name";

function GateForm() {
  const [step, setStep] = useState<Step>("passcode");
  const [passcode, setPasscode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [filtered, setFiltered] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const isAdmin = redirect.startsWith("/admin");

  // Fetch members on mount (for name search)
  useEffect(() => {
    if (isAdmin) return;
    async function fetchMembers() {
      try {
        const snapshot = await getDocs(collection(db, "family_members"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FamilyMember[];
        setMembers(data);
        setMembersLoaded(true);
      } catch {
        setMembersLoaded(true);
      }
    }
    fetchMembers();
  }, [isAdmin]);

  // Filter members as user types
  useEffect(() => {
    if (!name.trim() || members.length === 0) {
      setFiltered([]);
      setSelectedMember(null);
      return;
    }
    const q = name.toLowerCase();
    const matches = members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.nickname.toLowerCase().includes(q) ||
        m.branch.toLowerCase().includes(q)
    );
    setFiltered(matches.slice(0, 6));
    // Auto-select if exact match
    const exact = members.find(
      (m) =>
        m.fullName.toLowerCase() === q ||
        m.nickname.toLowerCase() === q
    );
    setSelectedMember(exact || null);
  }, [name, members]);

  // Step 1: Passcode verification
  async function handlePasscodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, isAdmin }),
      });

      if (!res.ok) {
        if (isAdmin) {
          setError("Invalid admin passcode.");
        } else {
          setError("That passcode didn't match — check with your family organizer.");
        }
        setLoading(false);
        return;
      }

      if (isAdmin) {
        router.push(redirect);
        return;
      }

      // Family passcode verified — move to name step
      setStep("name");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // Step 2: Name selection
  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (selectedMember) {
        // Store member info in cookie via API
        const res = await fetch("/api/set-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: selectedMember.id,
            memberName: selectedMember.fullName,
            branch: selectedMember.branch,
          }),
        });

        if (!res.ok) {
          setError("Something went wrong saving your profile.");
          setLoading(false);
          return;
        }
      } else {
        // No member selected — store name as guest
        const res = await fetch("/api/set-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: null,
            memberName: name.trim(),
            branch: null,
          }),
        });

        if (!res.ok) {
          setError("Something went wrong saving your profile.");
          setLoading(false);
          return;
        }
      }

      router.push(redirect);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // Step 1: Passcode
  if (step === "passcode") {
    const label = isAdmin ? "Enter the admin passcode" : "Enter the family passcode";
    const placeholder = isAdmin ? "Admin passcode" : "Passcode";
    const buttonText = isAdmin ? "Access admin" : "Continue";

    return (
      <form onSubmit={handlePasscodeSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="passcode" className="block text-soft text-sm font-sans mb-2">
            {label}
          </label>
          <input
            id="passcode"
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full px-4 py-3 input rounded-xl text-ink font-sans placeholder:text-soft/40 focus:outline-none transition-all duration-200"
            placeholder={placeholder}
            required
            autoFocus
          />
        </div>

        {error && (
          <p className="text-hibiscus text-sm font-sans animate-fade-in">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans font-medium transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking...
            </span>
          ) : (
            buttonText
          )}
        </button>
      </form>
    );
  }

  // Step 2: Name selection
  return (
    <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="member-name" className="block text-soft text-sm font-sans mb-2">
          Who are you? Find your name in the family tree
        </label>
        <div className="relative">
          <input
            id="member-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 input rounded-xl text-ink font-sans placeholder:text-soft/40 focus:outline-none transition-all duration-200"
            placeholder="Type your name..."
            autoFocus
            autoComplete="off"
          />
          {name && (
            <button
              type="button"
              onClick={() => { setName(""); setSelectedMember(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-soft/40 hover:text-soft/70 transition-colors"
              aria-label="Clear name"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {filtered.length > 0 && !selectedMember && (
        <div className="space-y-1.5 animate-fade-in">
          {filtered.map((member) => {
            const color = getBranchColor(member.branch);
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setSelectedMember(member);
                  setName(member.fullName);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl card-inset hover:bg-rattan/15 transition-all duration-200 text-left group"
              >
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${color}30, ${color}15)`,
                    border: `1.5px solid ${color}40`,
                  }}
                >
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="font-heading text-sm" style={{ color }}>
                      {member.fullName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm font-sans font-medium truncate">
                    {member.nickname ? (
                      <>{member.fullName} <span className="text-soft/60">({member.nickname})</span></>
                    ) : (
                      member.fullName
                    )}
                  </p>
                  <p className="text-soft/60 text-xs font-sans flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    {member.branch} · Gen {member.generation}
                  </p>
                </div>
                <svg className="w-4 h-4 text-soft/30 group-hover:text-soft/60 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected member badge */}
      {selectedMember && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl card-inset animate-fade-in">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${getBranchColor(selectedMember.branch)}40, ${getBranchColor(selectedMember.branch)}20)`,
            }}
          >
            <svg className="w-4 h-4 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-ink text-sm font-sans font-medium truncate">{selectedMember.fullName}</p>
            <p className="text-soft/60 text-xs font-sans">{selectedMember.branch} branch</p>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedMember(null); setName(""); }}
            className="text-soft/40 hover:text-soft/70 transition-colors"
            aria-label="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading state */}
      {!membersLoaded && (
        <div className="flex items-center gap-2 text-soft/50 text-xs font-sans">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading family tree...
        </div>
      )}

      {error && (
        <p className="text-hibiscus text-sm font-sans animate-fade-in">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full py-3 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans font-medium transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Entering...
          </span>
        ) : selectedMember ? (
          `Enter as ${selectedMember.nickname || selectedMember.fullName.split(" ")[0]}`
        ) : name.trim() ? (
          "Continue as guest"
        ) : (
          "Enter the reunion"
        )}
      </button>

      {/* Back to passcode */}
      <button
        type="button"
        onClick={() => { setStep("passcode"); setError(""); }}
        className="text-soft/50 hover:text-soft text-xs font-sans transition-colors"
      >
        ← Back to passcode
      </button>
    </form>
  );
}

export default function GatePage() {
  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-balete-deep overflow-hidden grain">
      {/* Branch-line texture */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 700"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path d="M 200 0 V 220 C 200 260 160 280 140 320" stroke="rgba(232,166,61,0.18)" strokeWidth="1" />
        <path d="M 200 0 V 260 C 200 300 240 320 260 360" stroke="rgba(194,64,95,0.16)" strokeWidth="1" />
        <path d="M 200 0 V 300" stroke="rgba(191,160,106,0.2)" strokeWidth="1" />
        <circle cx="200" cy="0" r="3" fill="rgba(232,166,61,0.45)" />
        <circle cx="140" cy="320" r="2.5" fill="rgba(191,160,106,0.45)" />
        <circle cx="260" cy="360" r="2.5" fill="rgba(194,64,95,0.4)" />
      </svg>

      <div className="relative w-full max-w-sm mx-4 animate-fade-in">
        <div className="text-center mb-8 animate-slide-up">
          <p className="font-mono text-xs text-mango-light tracking-[0.35em] uppercase mb-4">
            Family Reunion
          </p>
          <FamilyWordmark light className="kinetic-hero--clip text-[clamp(5.5rem,24vw,9rem)] mb-3" />
          <p className="text-parchment/40 text-xs font-mono">— event date TBA —</p>
          <p className="text-parchment/40 text-xs font-sans leading-relaxed max-w-[280px] mx-auto mt-6">
            <span className="text-mango-light/70">A</span>ng <span className="text-mango-light/70">P</span>anaghiusa · <span className="text-mango-light/70">O</span>ras · <span className="text-mango-light/70">R</span>elasyon
            <br />
            <span className="italic text-parchment/30">&ldquo;Unity, Time, and Connection&rdquo;</span>
          </p>
        </div>

        <div className="card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <Suspense fallback={
            <div className="flex items-center justify-center py-8 text-soft/60 text-sm font-sans">
              Loading...
            </div>
          }>
            <GateForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

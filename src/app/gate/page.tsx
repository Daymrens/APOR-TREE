"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import FamilyWordmark from "@/components/FamilyWordmark";
import MemberDataForm from "@/components/MemberDataForm";
import type { FamilyMember, MemberContributionData } from "@/lib/types";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const isAdmin = redirect.startsWith("/admin");

  const [step, setStep] = useState<Step>(isAdmin ? "passcode" : "name");
  const [passcode, setPasscode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [filtered, setFiltered] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerData, setRegisterData] = useState<MemberContributionData>({
    parentName: "",
    fullName: "",
    sex: "male",
    dateOfBirth: "",
    maritalStatus: "single",
    livingStatus: "living",
    siblings: "",
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [registerLoading, setRegisterLoading] = useState(false);

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
        setError("Invalid admin passcode.");
        setLoading(false);
        return;
      }

      router.push(redirect);
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

  // Step 2b: Self-registration — submit to the moderation queue, then enter as a guest.
  async function handleRegister() {
    setRegisterErrors({});
    if (!registerData.parentName.trim()) {
      setRegisterErrors((prev) => ({ ...prev, parentName: "Parent or root connection is required." }));
    }
    if (!registerData.fullName.trim()) {
      setRegisterErrors((prev) => ({ ...prev, fullName: "Full name is required." }));
    }
    if (!registerData.parentName.trim() || !registerData.fullName.trim()) return;

    setRegisterLoading(true);

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: name.trim() || registerData.fullName,
          authorBranch: null,
          type: "add_member",
          category: null,
          title: `Add member: ${registerData.fullName}`,
          description: "Self-registered from the entry page.",
          data: registerData,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      // Enter the site as a guest so the visitor isn't blocked by the middleware.
      const setRes = await fetch("/api/set-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: null, memberName: name.trim(), branch: null }),
      });

      if (!setRes.ok) throw new Error("Failed to save profile");

      router.push(redirect);
    } catch {
      setRegisterErrors((prev) => ({
        ...prev,
        _form: "Something went wrong. Please try again.",
      }));
    } finally {
      setRegisterLoading(false);
    }
  }

  // Step 1: Passcode (admin only)
  if (step === "passcode") {
    const label = "Enter the admin passcode";
    const placeholder = "Admin passcode";
    const buttonText = "Access admin";

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
      <p className="text-xs font-sans text-mango-light/90 bg-rattan/15 rounded-lg px-3 py-2 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          Open registration — no passcode needed.
        </p>
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

      {/* Not in the tree — self-registration */}
      {membersLoaded && !isAdmin && name.trim().length > 2 && filtered.length === 0 && (
        <div className="border-t border-rattan/20 pt-4 mt-1">
          {!registerOpen ? (
            <button
              type="button"
              onClick={() => {
                setRegisterData((prev) => ({ ...prev, fullName: name.trim() }));
                setRegisterOpen(true);
              }}
              className="w-full flex items-center justify-between gap-2 p-3 rounded-xl card text-left transition-all duration-200 hover:border-mango/40"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-full bg-mango/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-ink text-sm font-sans font-medium">Not in the tree yet?</p>
                  <p className="text-soft/60 text-xs font-sans">Add yourself to the family — it goes to the organizer for review.</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-soft/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-ink text-sm font-sans font-semibold">Add yourself to the family</p>
                <button
                  type="button"
                  onClick={() => setRegisterOpen(false)}
                  className="text-soft/40 hover:text-soft/70 text-xs font-sans transition-colors"
                >
                  Close
                </button>
              </div>
              <MemberDataForm data={registerData} onChange={setRegisterData} errors={registerErrors} />
              {registerErrors._form && (
                <p className="text-hibiscus text-xs font-sans">{registerErrors._form}</p>
              )}
              <button
                type="button"
                onClick={() => handleRegister()}
                disabled={registerLoading}
                className="w-full py-3 bg-gradient-to-r from-mango to-[#c9822f] text-balete-deep rounded-xl font-sans font-medium transition-all duration-200 hover:shadow-lg hover:shadow-mango/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerLoading
                  ? "Submitting..."
                  : registerData.fullName.trim()
                    ? `Submit ${registerData.fullName.trim()}`
                    : "Submit"}
              </button>
              <p className="text-soft/50 text-[10px] font-sans text-center">
                Your info will appear on the tree once a family organizer approves it.
              </p>
            </div>
          )}
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

"use client";

import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { addRsvp, subscribeToRsvps } from "@/lib/firestore/rsvps";
import { getBranches } from "@/lib/firestore/members";
import type { Rsvp } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";
import Skeleton from "@/components/ui/Skeleton";

export default function RsvpPage() {
  const [branches, setBranches] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState({ confirmed: 0, maybe: 0, headcount: 0 });

  const [form, setForm] = useState({
    respondentName: "",
    familyBranch: "",
    attending: "yes" as "yes" | "no" | "maybe",
    guestCount: 0,
    guestNames: "",
    dietaryNotes: "",
    contactNumber: "",
  });

  useEffect(() => {
    const memberName = document.cookie
      .split("; ")
      .find((c) => c.startsWith("family-member-name="))
      ?.split("=")[1];
    const memberBranch = document.cookie
      .split("; ")
      .find((c) => c.startsWith("family-member-branch="))
      ?.split("=")[1];

    if (memberName || memberBranch) {
      setForm((prev) => ({
        ...prev,
        respondentName: memberName ? decodeURIComponent(memberName) : prev.respondentName,
        familyBranch: memberBranch ? decodeURIComponent(memberBranch) : prev.familyBranch,
      }));
    }

    setLoadingBranches(true);
    getBranches()
      .then((data) => {
        setBranches(data);
        setLoadingBranches(false);
      })
      .catch((err) => {
        console.warn("Firestore not available:", err.message);
        setLoadingBranches(false);
      });

    const unsub = subscribeToRsvps((rsvps: Rsvp[]) => {
      let confirmed = 0;
      let maybe = 0;
      let headcount = 0;
      rsvps.forEach((r) => {
        if (r.attending === "yes") {
          confirmed++;
          headcount += 1 + r.guestCount;
        } else if (r.attending === "maybe") {
          maybe++;
          headcount += 1 + r.guestCount;
        }
      });
      setCounts({ confirmed, maybe, headcount });
    });

    return () => unsub();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await addRsvp({
        respondentName: form.respondentName,
        familyBranch: form.familyBranch,
        attending: form.attending,
        guestCount: form.guestCount,
        guestNames: form.guestNames
          ? form.guestNames.split(",").map((n) => n.trim())
          : [],
        dietaryNotes: form.dietaryNotes,
        contactNumber: form.contactNumber,
      });

      try {
        await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
          {
            name: form.respondentName,
            branch: form.familyBranch || "Not specified",
            status: form.attending === "yes" ? "Confirmed" : form.attending === "maybe" ? "Maybe" : "Declined",
            guests: String(form.guestCount),
            contact: form.contactNumber,
          },
          { publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY! }
        );
      } catch {
        // Email notification failed silently — RSVP still saved
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <BackButton />
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-hibiscus/20 to-hibiscus/5 p-[3px] mb-6 animate-scale-in">
          <div className="w-full h-full rounded-full bg-parchment flex items-center justify-center">
            <svg className="w-10 h-10 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043A3.745 3.745 0 0 1 4.593 15.068 3.745 3.745 0 0 1 3.55 11.772a3.745 3.745 0 0 1 1.043-3.296A3.745 3.745 0 0 1 6 5.4c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 14 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
        </div>
        <h1 className="font-heading text-3xl text-balete mb-2 animate-slide-up">You&apos;re confirmed!</h1>
        <p className="text-soft font-sans mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Thanks for letting us know, {form.respondentName}. See you at the reunion!
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({
              respondentName: "",
              familyBranch: "",
              attending: "yes",
              guestCount: 0,
              guestNames: "",
              dietaryNotes: "",
              contactNumber: "",
            });
          }}
          className="text-hibiscus font-sans text-sm hover:underline transition-colors"
        >
          Submit another RSVP
        </button>
      </div>
    );
  }

  if (loadingBranches) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <BackButton />
        <div className="space-y-5 mt-8">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex justify-around text-center">
              <div className="space-y-2">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-3xl text-balete mb-2 animate-fade-in">RSVP</h1>
      <p className="text-soft font-sans mb-8 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        Let us know if you&apos;re coming — it helps us plan.
      </p>

      {/* Live counter */}
      <div className="glass-card rounded-2xl p-4 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex justify-around text-center">
          <div>
            <p className="font-mono text-xl text-hibiscus tabular-nums">{counts.confirmed}</p>
            <p className="text-soft text-xs font-sans">Confirmed</p>
          </div>
          <div>
            <p className="font-mono text-xl text-mango tabular-nums">{counts.maybe}</p>
            <p className="text-soft text-xs font-sans">Maybe</p>
          </div>
          <div>
            <p className="font-mono text-xl text-balete tabular-nums">{counts.headcount}</p>
            <p className="text-soft text-xs font-sans">Headcount</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <label htmlFor="name" className="block text-sm font-sans text-ink mb-1">Your name</label>
          <input
            id="name"
            type="text"
            required
            value={form.respondentName}
            onChange={(e) => setForm({ ...form, respondentName: e.target.value })}
            className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl font-sans text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <label htmlFor="branch" className="block text-sm font-sans text-ink mb-1">Family branch</label>
          <select
            id="branch"
            required
            value={form.familyBranch}
            onChange={(e) => setForm({ ...form, familyBranch: e.target.value })}
            className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl font-sans text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all duration-200"
          >
            <option value="">Select a branch</option>
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
            <option value="other">Other / Not sure</option>
          </select>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <label className="block text-sm font-sans text-ink mb-2">Are you coming?</label>
          <div className="flex gap-3" role="radiogroup" aria-label="Attendance">
            {(["yes", "no", "maybe"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={form.attending === option}
                onClick={() => setForm({ ...form, attending: option })}
                className={`flex-1 py-3 rounded-xl border font-sans text-sm transition-all duration-200 ${
                  form.attending === option
                    ? option === "yes"
                      ? "bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment border-transparent shadow-md shadow-hibiscus/20"
                      : option === "maybe"
                      ? "bg-gradient-to-r from-mango to-[#d4922e] text-parchment border-transparent shadow-md shadow-mango/20"
                      : "bg-gradient-to-r from-soft to-[#4a4538] text-parchment border-transparent shadow-md shadow-soft/20"
                    : "bg-white/50 border-white/30 text-ink hover:bg-white/70 hover:border-white/40"
                }`}
              >
                {option === "yes" ? "Yes!" : option === "maybe" ? "Maybe" : "Can't make it"}
              </button>
            ))}
          </div>
        </div>

        {form.attending !== "no" && (
          <>
            <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <label htmlFor="guests" className="block text-sm font-sans text-ink mb-1">
                How many guests are with you?
              </label>
              <input
                id="guests"
                type="number"
                min={0}
                value={form.guestCount}
                onChange={(e) => setForm({ ...form, guestCount: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl font-sans text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "0.35s" }}>
              <label htmlFor="guestNames" className="block text-sm font-sans text-ink mb-1">
                Guest names (optional, comma-separated)
              </label>
              <input
                id="guestNames"
                type="text"
                value={form.guestNames}
                onChange={(e) => setForm({ ...form, guestNames: e.target.value })}
                placeholder="e.g. Juan, Maria"
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <label htmlFor="dietary" className="block text-sm font-sans text-ink mb-1">
                Dietary notes (optional)
              </label>
              <input
                id="dietary"
                type="text"
                value={form.dietaryNotes}
                onChange={(e) => setForm({ ...form, dietaryNotes: e.target.value })}
                placeholder="Allergies, preferences, etc."
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all duration-200"
              />
            </div>
          </>
        )}

        <div className="animate-slide-up" style={{ animationDelay: "0.45s" }}>
          <label htmlFor="contact" className="block text-sm font-sans text-ink mb-1">Contact number</label>
          <input
            id="contact"
            type="tel"
            required
            value={form.contactNumber}
            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
            className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl font-sans text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        {error && <p className="text-hibiscus text-sm font-sans animate-fade-in">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans font-medium transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none animate-slide-up"
          style={{ animationDelay: "0.5s" }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : (
            "Confirm my RSVP"
          )}
        </button>
      </form>
    </div>
  );
}

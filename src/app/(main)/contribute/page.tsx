"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/ui/BackButton";
import ShareButton from "@/components/ShareButton";
import type { Contribution } from "@/lib/types";

const CATEGORIES = [
  { value: "schedule", label: "Schedule" },
  { value: "venue", label: "Venue & logistics" },
  { value: "food", label: "Food & catering" },
  { value: "activities", label: "Activities & games" },
  { value: "general", label: "General" },
];

const TYPES = [
  { value: "correction", label: "Correction" },
  { value: "suggestion", label: "Suggestion" },
  { value: "addition", label: "Addition" },
];

export default function ContributePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Contribution["type"]>("suggestion");
  const [category, setCategory] = useState<Contribution["category"]>("general");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [memberName, setMemberName] = useState<string | null>(null);
  const [memberBranch, setMemberBranch] = useState<string | null>(null);

  useEffect(() => {
    setMemberName(
      document.cookie.split("; ").find((c) => c.startsWith("family-member-name="))?.split("=")[1] || null
    );
    setMemberBranch(
      document.cookie.split("; ").find((c) => c.startsWith("family-member-branch="))?.split("=")[1] || null
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please fill in both title and description.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: memberName || "Anonymous",
          authorBranch: memberBranch || null,
          type,
          category,
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-8">
        <BackButton />
        <section className="text-center py-16 glass-card rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-mango/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-heading text-2xl text-balete mb-2">Thank you!</h2>
          <p className="text-soft font-sans">
            Your contribution has been submitted. The family organizer will review it and you&apos;ll be notified once it&apos;s been processed.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <BackButton />

      <section className="text-center py-8 animate-fade-in">
        <h1 className="font-heading text-3xl sm:text-4xl text-balete mb-2">
          Leave a Contribution
        </h1>
        <p className="text-soft font-sans max-w-md mx-auto">
          Help us keep the reunion info accurate. Submit corrections, suggestions, or additions.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-hibiscus/10 text-hibiscus text-sm font-sans">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-sans font-medium text-balete mb-1.5">
              What kind of change?
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value as Contribution["type"])}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-200 ${
                    type === t.value
                      ? "bg-gradient-to-r from-balete to-[#2E6B62] text-parchment shadow-md"
                      : "glass-card hover:bg-white/70 text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-sans font-medium text-balete mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Contribution["category"])}
                className="w-full glass-card rounded-xl px-3 py-2 text-sm font-sans text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-sans font-medium text-balete mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={memberName || ""}
                readOnly
                className="w-full glass-card rounded-xl px-3 py-2 text-sm font-sans text-ink opacity-70"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-balete mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Date change for Saturday dinner"
              className="w-full glass-card rounded-xl px-3 py-2 text-sm font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/40"
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-balete mb-1.5">
              Details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to change or what you&apos;d like to add..."
              rows={5}
              className="w-full glass-card rounded-xl px-3 py-2 text-sm font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/40 resize-y"
              maxLength={500}
            />
            <p className="text-soft/50 text-[10px] font-sans mt-1">
              {description.length}/500
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-balete to-[#2E6B62] text-parchment font-heading font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-balete/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit contribution"}
          </button>
        </div>
      </form>

      <div className="mt-8 flex justify-center">
        <ShareButton />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/ui/BackButton";
import ShareButton from "@/components/ShareButton";
import type { Contribution, MemberContributionData } from "@/lib/types";

const CATEGORIES = [
  { value: "schedule", label: "Schedule" },
  { value: "venue", label: "Venue & logistics" },
  { value: "food", label: "Food & catering" },
  { value: "activities", label: "Activities & games" },
  { value: "general", label: "General" },
];

const TYPES = [
  { value: "suggestion", label: "Suggestion" },
  { value: "correction", label: "Correction" },
  { value: "addition", label: "Addition" },
  { value: "add_member", label: "Add member" },
];

function MemberDataForm({
  data,
  onChange,
  errors,
}: {
  data: MemberContributionData;
  onChange: (d: MemberContributionData) => void;
  errors: Record<string, string>;
}) {
  const inputClass =
    "w-full clay rounded-xl px-3 py-2 text-sm font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/40 [&>option]:bg-parchment";
  const labelClass = "block text-sm font-sans font-medium text-balete mb-1.5";

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Parents / Root connection</label>
        <input
          type="text"
          value={data.parentName}
          onChange={(e) => onChange({ ...data, parentName: e.target.value })}
          placeholder="e.g. Juan & Maria Apor"
          className={inputClass}
        />
        {errors.parentName && (
          <p className="text-hibiscus text-xs font-sans mt-1">{errors.parentName}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Full name</label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
          placeholder="Full name of the person to add"
          className={inputClass}
        />
        {errors.fullName && (
          <p className="text-hibiscus text-xs font-sans mt-1">{errors.fullName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Sex</label>
          <select
            value={data.sex}
            onChange={(e) => onChange({ ...data, sex: e.target.value as "male" | "female" })}
            className={inputClass}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Date of birth</label>
          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange({ ...data, dateOfBirth: e.target.value })}
            className={inputClass}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Marital status</label>
          <select
            value={data.maritalStatus}
            onChange={(e) =>
              onChange({ ...data, maritalStatus: e.target.value as "married" | "single" })
            }
            className={inputClass}
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={data.livingStatus}
            onChange={(e) =>
              onChange({ ...data, livingStatus: e.target.value as "living" | "deceased" })
            }
            className={inputClass}
          >
            <option value="living">Living</option>
            <option value="deceased">Deceased</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Siblings (optional)</label>
        <input
          type="text"
          value={data.siblings}
          onChange={(e) => onChange({ ...data, siblings: e.target.value })}
          placeholder="e.g. Maria, Jose, Ana"
          className={inputClass}
        />
        <p className="text-soft/40 text-[10px] font-sans mt-1">Comma-separated names</p>
      </div>
    </div>
  );
}

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

  const [memberData, setMemberData] = useState<MemberContributionData>({
    parentName: "",
    fullName: "",
    sex: "male",
    dateOfBirth: "",
    maritalStatus: "single",
    livingStatus: "living",
    siblings: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAddMember = type === "add_member";

  useEffect(() => {
    setMemberName(
      document.cookie.split("; ").find((c) => c.startsWith("family-member-name="))?.split("=")[1] || null
    );
    setMemberBranch(
      document.cookie.split("; ").find((c) => c.startsWith("family-member-branch="))?.split("=")[1] || null
    );
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (isAddMember) {
      if (!memberData.parentName.trim()) errs.parentName = "Parent or root connection is required.";
      if (!memberData.fullName.trim()) errs.fullName = "Full name is required.";
    } else {
      if (!title.trim()) errs.title = "Title is required.";
      if (!description.trim()) errs.description = "Description is required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        authorName: memberName || "Anonymous",
        authorBranch: memberBranch || null,
        type,
        category: isAddMember ? null : category,
        title: isAddMember ? `Add member: ${memberData.fullName}` : title.trim(),
        description: isAddMember
          ? `Parent: ${memberData.parentName}\nSex: ${memberData.sex}\nDOB: ${memberData.dateOfBirth || "—"}\nMarital status: ${memberData.maritalStatus}\nStatus: ${memberData.livingStatus}\nSiblings: ${memberData.siblings || "—"}`
          : description.trim(),
      };

      if (isAddMember) {
        body.data = memberData;
      }

      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        <section className="text-center py-16 clay rounded-2xl p-8">
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

      <form onSubmit={handleSubmit} className="clay rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
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
                  onClick={() => {
                    setType(t.value as Contribution["type"]);
                    setErrors({});
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-200 ${
                    type === t.value
                      ? "bg-gradient-to-r from-balete to-[#2E6B62] text-parchment shadow-md"
                      : "clay hover:bg-white/70 text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isAddMember ? (
            <MemberDataForm data={memberData} onChange={setMemberData} errors={errors} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-sans font-medium text-balete mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Contribution["category"])}
                    className="w-full clay rounded-xl px-3 py-2 text-sm font-sans text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40"
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
                    className="w-full clay rounded-xl px-3 py-2 text-sm font-sans text-ink opacity-70"
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
                  className="w-full clay rounded-xl px-3 py-2 text-sm font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/40"
                  maxLength={120}
                />
                {errors.title && (
                  <p className="text-hibiscus text-xs font-sans mt-1">{errors.title}</p>
                )}
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
                  className="w-full clay rounded-xl px-3 py-2 text-sm font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/40 resize-y"
                  maxLength={500}
                />
                <p className="text-soft/50 text-[10px] font-sans mt-1">
                  {description.length}/500
                </p>
                {errors.description && (
                  <p className="text-hibiscus text-xs font-sans mt-1">{errors.description}</p>
                )}
              </div>
            </>
          )}

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

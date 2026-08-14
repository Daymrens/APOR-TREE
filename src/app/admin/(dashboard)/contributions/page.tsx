"use client";

import { useState, useEffect, useCallback } from "react";
import type { Contribution } from "@/lib/types";
import Skeleton from "@/components/ui/Skeleton";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-mango/15 text-mango border-mango/30",
  approved: "bg-green-500/15 text-green-700 border-green-500/30",
  rejected: "bg-red-500/15 text-red-700 border-red-500/30",
};

const TYPE_LABELS: Record<string, string> = {
  correction: "Correction",
  suggestion: "Suggestion",
  addition: "Addition",
  add_member: "Add member",
};

const CATEGORY_LABELS: Record<string, string> = {
  schedule: "Schedule",
  venue: "Venue",
  food: "Food",
  activities: "Activities",
  general: "General",
};

const SEX_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
};

function ReviewField({ label, value, capitalize }: { label: string; value?: string; capitalize?: boolean }) {
  return (
    <p>
      <span className="text-soft text-xs">{label}</span>
      <br />
      <span className={`text-ink text-sm font-medium ${capitalize ? "capitalize" : ""}`}>{value || "—"}</span>
    </p>
  );
}

function renderReviewFields(c: Contribution) {
  const d = (c.data ?? {}) as Record<string, string>;

  if (c.type === "suggestion") {
    return (
      <div>
        <div className="p-3 rounded-xl bg-balete/5 border border-balete/10 text-ink text-sm font-sans leading-relaxed">
          {c.description || "—"}
        </div>
        {d.text && (
          <p className="text-soft text-xs font-sans mt-2">Suggestion text: {d.text}</p>
        )}
      </div>
    );
  }

  let fields;
  if (c.type === "add_member") {
    fields = (
      <div className="grid grid-cols-2 gap-3">
        <ReviewField label="Relation" value={d.relation} capitalize />
        <ReviewField label="Target person" value={d.targetName} />
        <ReviewField label="Branch" value={d.branch} />
        <ReviewField label="Parent / Root" value={d.parentName} />
        <ReviewField label="Full name" value={d.fullName} />
        <ReviewField label="Sex" value={SEX_LABELS[d.sex] || d.sex} />
        <ReviewField label="Date of birth" value={d.dateOfBirth} />
        <ReviewField label="Marital status" value={d.maritalStatus} capitalize />
        <ReviewField label="Living status" value={d.livingStatus} capitalize />
        <ReviewField label="Siblings" value={d.siblings} />
      </div>
    );
  } else if (c.type === "correction") {
    fields = (
      <div className="grid grid-cols-2 gap-3">
        <ReviewField label="Person" value={d.personName} />
        <ReviewField label="Field" value={d.field} />
        <ReviewField label="Corrected value" value={d.correctedValue} />
        <ReviewField label="Note" value={d.note} />
      </div>
    );
  } else {
    fields = (
      <p className="text-ink text-sm font-sans leading-relaxed">
        {c.description || "—"}
      </p>
    );
  }

  return (
    <div>
      {fields}
      {c.description && (
        <p className="text-soft text-xs font-sans mt-3 border-t border-balete/10 pt-3">
          {c.description}
        </p>
      )}
    </div>
  );
}

export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [reviewing, setReviewing] = useState<Contribution | null>(null);

  const fetchContributions = useCallback(async () => {
    try {
      const res = await fetch("/api/contributions");
      const data = await res.json();
      if (Array.isArray(data)) setContributions(data);
    } catch {
      if (process.env.NODE_ENV === "development") console.warn("Failed to fetch contributions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContributions();
    const interval = setInterval(fetchContributions, 60000);
    return () => clearInterval(interval);
  }, [fetchContributions]);

  async function handleApprove(id: string) {
    setActioning(id);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/approve-contribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setActionError("Failed to approve contribution. Please try again.");
        return;
      }
      setContributions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "approved" as const } : c))
      );
    } catch {
      setActionError("Failed to approve contribution. Please try again.");
    } finally {
      setActioning(null);
    }
  }

  async function handleDelete(id: string) {
    setActioning(id);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/delete-contribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setActionError("Failed to delete contribution. Please try again.");
        return;
      }
      setContributions((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setActionError("Failed to delete contribution. Please try again.");
    } finally {
      setActioning(null);
    }
  }

  const filtered = contributions.filter((c) => {
    const statusOk = filter === "all" || c.status === filter;
    const typeOk =
      typeFilter === "all" ||
      (typeFilter === "add_member" && c.type === "add_member") ||
      (typeFilter === "correction" && c.type === "correction") ||
      (typeFilter === "suggestion" && c.type === "suggestion");
    return statusOk && typeOk;
  });

  return (
    <>
    <main className="flex-1 p-6 ml-0 sm:ml-56 bg-parchment min-h-screen">
      <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-2xl text-balete mb-1">Contributions</h1>
          <p className="text-soft text-sm font-sans mb-6">
            Review and manage member submissions
          </p>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-200 ${
                  filter === f
                    ? "bg-gradient-to-r from-balete to-[#2E6B62] text-parchment shadow-md"
                    : "clay hover:bg-surface-2 text-ink"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Type filter tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(["all", "add_member", "correction", "suggestion"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-200 ${
                  typeFilter === t
                    ? "bg-balete text-parchment shadow-md"
                    : "text-balete border border-balete/30 bg-transparent hover:bg-balete/10"
                }`}
              >
                {t === "all"
                  ? "All types"
                  : t === "add_member"
                    ? "Additions"
                    : t === "correction"
                      ? "Corrections"
                      : "Suggestions"}
              </button>
            ))}
          </div>

          {actionError && (
            <p className="text-hibiscus text-sm font-sans mb-4">{actionError}</p>
          )}

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="clay rounded-2xl p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 clay rounded-2xl p-8">
              <p className="text-soft font-sans">No contributions found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((c) => {
                const statusStyle = STATUS_STYLES[c.status] || STATUS_STYLES.pending;
                const isMember = c.type === "add_member";

                return (
                  <div
                    key={c.id}
                    className="clay rounded-2xl p-5 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading text-base text-balete truncate">
                          {c.title}
                        </h3>
                        <p className="text-soft text-xs font-sans mt-0.5">
                          {c.authorName}
                          {c.authorBranch ? ` · ${c.authorBranch}` : ""}
                          {!isMember && c.category ? ` · ${CATEGORY_LABELS[c.category] || c.category}` : ""}
                          {" · "}
                          {TYPE_LABELS[c.type] || c.type}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-sans font-medium border ${statusStyle}`}
                      >
                        {c.status}
                      </span>
                    </div>

                    {/* Add member structured data */}
                    {isMember && c.data ? (
                      <div className="mb-3 p-3 rounded-xl bg-balete/5 border border-balete/10 text-xs font-sans space-y-1">
                        <p><span className="text-soft">Parent / Root:</span> <span className="text-ink font-medium">{c.data.parentName}</span></p>
                        <p><span className="text-soft">Full name:</span> <span className="text-ink font-medium">{c.data.fullName}</span></p>
                        <div className="flex gap-4">
                          <p><span className="text-soft">Sex:</span> <span className="text-ink">{SEX_LABELS[c.data.sex] || c.data.sex}</span></p>
                          <p><span className="text-soft">DOB:</span> <span className="text-ink">{c.data.dateOfBirth || "—"}</span></p>
                        </div>
                        <div className="flex gap-4">
                          <p><span className="text-soft">Marital status:</span> <span className="text-ink capitalize">{c.data.maritalStatus}</span></p>
                          <p><span className="text-soft">Status:</span> <span className="text-ink capitalize">{c.data.livingStatus}</span></p>
                        </div>
                        {c.data.siblings && (
                          <p><span className="text-soft">Siblings:</span> <span className="text-ink">{c.data.siblings}</span></p>
                        )}
                      </div>
                    ) : (
                      <p className="text-ink text-sm font-sans leading-relaxed mb-3 line-clamp-3">
                        {c.description}
                      </p>
                    )}

                    {c.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(c.id)}
                          disabled={actioning === c.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium bg-green-500/15 text-green-700 border border-green-500/30 hover:bg-green-500/25 transition-all duration-200 disabled:opacity-50"
                        >
                          {actioning === c.id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => setReviewing(c)}
                          disabled={actioning === c.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium bg-balete/15 text-balete border border-balete/30 hover:bg-balete/25 transition-all duration-200"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={actioning === c.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium bg-red-500/15 text-red-700 border border-red-500/30 hover:bg-red-500/25 transition-all duration-200 disabled:opacity-50"
                        >
                          {actioning === c.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setReviewing(null)}>
          <div className="bg-parchment rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-balete/10 sticky top-0 bg-parchment">
              <div>
                <h3 className="font-heading text-lg text-balete">{reviewing.title}</h3>
                <p className="text-soft text-xs font-sans mt-0.5">
                  {reviewing.authorName}{reviewing.authorBranch ? ` · ${reviewing.authorBranch}` : ""} · {TYPE_LABELS[reviewing.type] || reviewing.type}
                </p>
              </div>
              <button onClick={() => setReviewing(null)} className="text-soft hover:text-ink text-xl leading-none">×</button>
            </div>
            <div className="p-5 space-y-3">
              {renderReviewFields(reviewing)}
              {reviewing.status === "pending" && (
                <div className="flex items-center gap-2 pt-2 border-t border-balete/10">
                  <button
                    onClick={() => { handleApprove(reviewing.id); setReviewing(null); }}
                    disabled={actioning === reviewing.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium bg-green-500/15 text-green-700 border border-green-500/30 hover:bg-green-500/25 transition-all duration-200 disabled:opacity-50"
                  >
                    {actioning === reviewing.id ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => { handleDelete(reviewing.id); setReviewing(null); }}
                    disabled={actioning === reviewing.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-sans font-medium bg-red-500/15 text-red-700 border border-red-500/30 hover:bg-red-500/25 transition-all duration-200 disabled:opacity-50"
                  >
                    {actioning === reviewing.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

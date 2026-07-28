"use client";

import { useState, useEffect, useCallback } from "react";
import type { Contribution } from "@/lib/types";
import AdminSidebar from "@/components/admin/AdminSidebar";
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

export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchContributions = useCallback(async () => {
    try {
      const res = await fetch("/api/contributions");
      const data = await res.json();
      setContributions(data);
    } catch {
      if (process.env.NODE_ENV === "development") console.warn("Failed to fetch contributions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContributions();
    const interval = setInterval(fetchContributions, 10000);
    return () => clearInterval(interval);
  }, [fetchContributions]);

  async function handleApprove(id: string) {
    setActioning(id);
    try {
      await fetch("/api/admin/approve-contribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setContributions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "approved" as const } : c))
      );
    } catch {
      if (process.env.NODE_ENV === "development") console.warn("Failed to approve contribution");
    } finally {
      setActioning(null);
    }
  }

  async function handleDelete(id: string) {
    setActioning(id);
    try {
      await fetch("/api/admin/delete-contribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setContributions((prev) => prev.filter((c) => c.id !== id));
    } catch {
      if (process.env.NODE_ENV === "development") console.warn("Failed to delete contribution");
    } finally {
      setActioning(null);
    }
  }

  const filtered = filter === "all"
    ? contributions
    : contributions.filter((c) => c.status === filter);

  return (
    <div className="flex min-h-screen bg-parchment">
      <AdminSidebar />

      <main className="flex-1 p-6 ml-0 sm:ml-56">
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
                    : "glass-card hover:bg-white/70 text-ink"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-2xl p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-2xl p-8">
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
                    className="glass-card rounded-2xl p-5 hover:shadow-md transition-all duration-200"
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
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { subscribeToRsvps } from "@/lib/firestore/rsvps";
import type { Rsvp } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";

export default function AdminRsvpsPage() {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const unsub = subscribeToRsvps((data) => {
      setRsvps(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const branches = Array.from(new Set(rsvps.map((r) => r.familyBranch))).sort();
  const filtered = filter === "all" ? rsvps : rsvps.filter((r) => r.familyBranch === filter);

  function exportCsv() {
    const headers = ["Name", "Branch", "Attending", "Guests", "Guest Names", "Dietary", "Contact", "Date"];
    const rows = filtered.map((r) => [
      r.respondentName,
      r.familyBranch,
      r.attending,
      r.guestCount,
      r.guestNames.join("; "),
      r.dietaryNotes,
      r.contactNumber,
      r.submittedAt?.toDate().toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <BackButton />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl text-balete">RSVPs</h1>
          <p className="text-soft font-sans text-sm mt-0.5">
            {filtered.length} of {rsvps.length} responses
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-balete text-parchment rounded-xl font-sans text-sm font-medium hover:bg-balete/90 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="mb-5">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-rattan/40 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-hibiscus/30 focus:border-hibiscus/50 transition-colors text-ink"
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-rattan/20 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-4 w-32 bg-rattan/10 rounded-lg animate-pulse mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-soft font-sans text-sm">No RSVPs yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-rattan/20 bg-rattan/5">
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Name</th>
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Branch</th>
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Status</th>
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Guests</th>
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rsvp) => (
                  <tr key={rsvp.id} className="border-b border-rattan/10 last:border-0 hover:bg-rattan/5 transition-colors">
                    <td className="py-3 px-5 text-ink font-medium">{rsvp.respondentName}</td>
                    <td className="py-3 px-5 text-soft">{rsvp.familyBranch}</td>
                    <td className="py-3 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          rsvp.attending === "yes"
                            ? "bg-balete/10 text-balete"
                            : rsvp.attending === "maybe"
                            ? "bg-mango/10 text-mango"
                            : "bg-hibiscus/10 text-hibiscus"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          rsvp.attending === "yes"
                            ? "bg-balete"
                            : rsvp.attending === "maybe"
                            ? "bg-mango"
                            : "bg-hibiscus"
                        }`} />
                        {rsvp.attending === "yes" ? "Confirmed" : rsvp.attending === "maybe" ? "Maybe" : "Declined"}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-soft tabular-nums font-mono">{rsvp.guestCount}</td>
                    <td className="py-3 px-5 text-soft">{rsvp.contactNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

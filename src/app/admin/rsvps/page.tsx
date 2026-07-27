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
    const headers = [
      "Name",
      "Branch",
      "Attending",
      "Guests",
      "Guest Names",
      "Dietary",
      "Contact",
      "Date",
    ];
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton />
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl text-balete">RSVPs</h1>
        <button
          onClick={exportCsv}
          className="px-4 py-2 bg-mango text-parchment rounded-full font-sans text-sm hover:bg-mango/90 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-rattan rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-hibiscus"
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-soft font-sans">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-soft font-sans py-8 text-center">No RSVPs yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-rattan/30">
                <th className="text-left py-2 px-3 text-soft font-medium">Name</th>
                <th className="text-left py-2 px-3 text-soft font-medium">Branch</th>
                <th className="text-left py-2 px-3 text-soft font-medium">Status</th>
                <th className="text-left py-2 px-3 text-soft font-medium">Guests</th>
                <th className="text-left py-2 px-3 text-soft font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rsvp) => (
                <tr key={rsvp.id} className="border-b border-rattan/10">
                  <td className="py-2 px-3 text-ink">{rsvp.respondentName}</td>
                  <td className="py-2 px-3 text-soft">{rsvp.familyBranch}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        rsvp.attending === "yes"
                          ? "bg-hibiscus/10 text-hibiscus"
                          : rsvp.attending === "maybe"
                          ? "bg-mango/10 text-mango"
                          : "bg-soft/10 text-soft"
                      }`}
                    >
                      {rsvp.attending}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-soft tabular-nums font-mono">
                    {rsvp.guestCount}
                  </td>
                  <td className="py-2 px-3 text-soft">{rsvp.contactNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

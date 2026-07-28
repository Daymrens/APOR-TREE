"use client";

import { useEffect, useState } from "react";
import { subscribeToRsvps } from "@/lib/firestore/rsvps";
import type { Rsvp } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";

const BRANCH_COLORS: Record<string, string> = {
  Apor: "#1E3B2C",
  Jose: "#C23B6E",
  Rosa: "#E8A63D",
  Antonio: "#2E6B62",
};

const ATTENDING_LABELS: Record<string, string> = {
  yes: "Confirmed",
  maybe: "Maybe",
  no: "Declined",
};

const ATTENDING_COLORS = {
  yes: "#2E6B62",
  maybe: "#E8A63D",
  no: "#C23B6E",
};

const CHART_SEGMENTS = [
  { key: "yes", label: "Confirmed", color: ATTENDING_COLORS.yes },
  { key: "maybe", label: "Maybe", color: ATTENDING_COLORS.maybe },
  { key: "no", label: "Declined", color: ATTENDING_COLORS.no },
];

export default function AdminDashboardPage() {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToRsvps((data) => {
      setRsvps(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const total = rsvps.length;
  const counts: Record<string, number> = {
    yes: rsvps.filter((r) => r.attending === "yes").length,
    maybe: rsvps.filter((r) => r.attending === "maybe").length,
    no: rsvps.filter((r) => r.attending === "no").length,
  };
  const totalGuests = rsvps.reduce((sum, r) => sum + r.guestCount, 0);
  const headcount = total + totalGuests;
  const recent = rsvps.slice(0, 5);

  const pcts: Record<string, number> = {
    yes: total > 0 ? (counts.yes / total) * 100 : 0,
    maybe: total > 0 ? (counts.maybe / total) * 100 : 0,
    no: total > 0 ? (counts.no / total) * 100 : 0,
  };

  const branches = Array.from(new Set(rsvps.map((r) => r.familyBranch))).sort();
  const branchCounts = branches.map((b) => ({
    name: b,
    count: rsvps.filter((r) => r.familyBranch === b).length,
    color: BRANCH_COLORS[b] ?? "#8B7355",
    guests: rsvps
      .filter((r) => r.familyBranch === b)
      .reduce((s, r) => s + r.guestCount, 0),
  }));

  function downloadCsv() {
    const headers = ["Name", "Branch", "Status", "Guests", "Contact"];
    const rows = rsvps.map((r) => [
      r.respondentName,
      r.familyBranch,
      r.attending,
      r.guestCount,
      r.contactNumber,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvp-dashboard-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function DonutChart() {
    const radius = 36;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const cx = 50;
    const cy = 50;

    return (
      <svg viewBox="0 0 100 100" className="w-44 h-44">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#f0ebe3"
          strokeWidth={strokeWidth}
        />
        {CHART_SEGMENTS.map((seg, i) => {
          const offset = CHART_SEGMENTS.slice(0, i).reduce((s, s2) => s + pcts[s2.key], 0);
          const rotation = -90 + offset * 360;
          const dashLen = pcts[seg.key] / 100 * circumference;
          const gapLen = (1 - pcts[seg.key] / 100) * circumference;
          if (pcts[seg.key] === 0) return null;
          return (
            <circle
              key={seg.key}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLen} ${gapLen}`}
              strokeLinecap="butt"
              transform={`rotate(${rotation} ${cx} ${cy})`}
            />
          );
        })}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#2B2620"
          fontSize="7"
          fontFamily="var(--font-sans)"
          fontWeight="bold"
        >
          {pcts.yes.toFixed(0)}%
        </text>
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#2E6B62"
          fontSize="5.5"
          fontFamily="var(--font-sans)"
        >
          Confirmed
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#5C5445"
          fontSize="5.5"
          fontFamily="var(--font-sans)"
        >
          {pcts.maybe.toFixed(0)}% · Maybe · {pcts.no.toFixed(0)}% · Declined
        </text>
      </svg>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <BackButton />
        <div className="mt-4 space-y-3">
          <div className="h-8 w-40 bg-rattan/10 rounded-lg animate-pulse" />
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-rattan/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <BackButton />
      <h1 className="font-heading text-2xl text-balete mb-6">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-rattan/20 rounded-2xl p-5 shadow-sm">
          <p className="text-soft font-sans text-[10px] font-semibold uppercase tracking-[0.1em] mb-2">Total RSVPs</p>
          <p className="font-heading text-3xl text-balete tabular-nums">{total}</p>
        </div>
        <div className="bg-white border border-rattan/20 rounded-2xl p-5 shadow-sm">
          <p className="text-soft font-sans text-[10px] font-semibold uppercase tracking-[0.1em] mb-2">Confirmed</p>
          <p className="font-heading text-3xl tabular-nums" style={{ color: ATTENDING_COLORS.yes }}>{counts.yes}</p>
        </div>
        <div className="bg-white border border-rattan/20 rounded-2xl p-5 shadow-sm">
          <p className="text-soft font-sans text-[10px] font-semibold uppercase tracking-[0.1em] mb-2">Maybe</p>
          <p className="font-heading text-3xl tabular-nums" style={{ color: ATTENDING_COLORS.maybe }}>{counts.maybe}</p>
        </div>
        <div className="bg-white border border-rattan/20 rounded-2xl p-5 shadow-sm">
          <p className="text-soft font-sans text-[10px] font-semibold uppercase tracking-[0.1em] mb-2">Declined</p>
          <p className="font-heading text-3xl tabular-nums" style={{ color: ATTENDING_COLORS.no }}>{counts.no}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-rattan/20 rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <h2 className="font-heading text-lg text-balete mb-4 self-start">Attendance</h2>
          {total === 0 ? (
            <p className="text-soft font-sans text-sm py-8">No RSVPs yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <DonutChart />
              <div className="space-y-2.5 font-sans text-sm">
                {CHART_SEGMENTS.map((seg) => (
                  <div key={seg.key} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-soft">{seg.label}</span>
                    <span className="font-mono text-ink font-medium tabular-nums">{pcts[seg.key].toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-rattan/20 rounded-2xl p-6 shadow-sm">
          <h2 className="font-heading text-lg text-balete mb-4">Branch Breakdown</h2>
          {branches.length === 0 ? (
            <p className="text-soft font-sans text-sm py-8">No RSVPs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead>
                  <tr className="border-b border-rattan/20">
                    <th className="text-left py-2 px-3 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Branch</th>
                    <th className="text-left py-2 px-3 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">RSVPs</th>
                    <th className="text-left py-2 px-3 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Guests</th>
                  </tr>
                </thead>
                <tbody>
                  {branchCounts.map((b) => (
                    <tr key={b.name} className="border-b border-rattan/10 last:border-0">
                      <td className="py-2.5 px-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                        <span className="text-ink">{b.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-ink tabular-nums font-mono">{b.count}</td>
                      <td className="py-2.5 px-3 text-soft tabular-nums font-mono">{b.guests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Headcount */}
      <div className="bg-white border border-rattan/20 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-heading text-lg text-balete mb-1">Headcount Summary</h2>
            <p className="text-soft font-sans text-sm">
              <span className="text-ink font-medium tabular-nums font-mono">{headcount}</span> total people across all RSVPs (respondents + guests)
            </p>
          </div>
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-balete text-parchment rounded-xl font-sans text-sm font-medium hover:bg-balete/90 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download CSV
          </button>
        </div>
      </div>

      {/* Recent RSVPs */}
      <div className="bg-white border border-rattan/20 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-rattan/20">
          <h2 className="font-heading text-lg text-balete">Recent RSVPs</h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-soft font-sans text-sm p-6 text-center">No RSVPs yet.</p>
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
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-rattan/10 last:border-0 hover:bg-rattan/5 transition-colors">
                    <td className="py-3 px-5 text-ink font-medium">{r.respondentName}</td>
                    <td className="py-3 px-5 text-soft">{r.familyBranch}</td>
                    <td className="py-3 px-5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${ATTENDING_COLORS[r.attending]}15`,
                          color: ATTENDING_COLORS[r.attending],
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ATTENDING_COLORS[r.attending] }} />
                        {ATTENDING_LABELS[r.attending]}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-soft tabular-nums font-mono">{r.guestCount}</td>
                    <td className="py-3 px-5 text-soft">{r.contactNumber}</td>
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

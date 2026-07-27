"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin/rsvps";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, isAdmin: true }),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="admin-passcode" className="block text-parchment/80 text-sm mb-2 font-sans">
          Admin passcode
        </label>
        <input
          id="admin-passcode"
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full px-4 py-3 bg-parchment/10 border border-rattan/30 rounded-[12px] text-parchment placeholder:text-parchment/40 focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent font-sans"
          placeholder="Admin passcode"
          required
          autoFocus
        />
      </div>

      {error && <p className="text-hibiscus text-sm font-sans">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-hibiscus text-parchment rounded-[999px] font-sans font-medium hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Checking..." : "Access admin"}
      </button>
    </form>
  );
}

export default function AdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-balete px-4">
      <div className="w-full max-w-sm">
        <nav className="flex gap-3 mb-6 justify-center">
          <a href="/admin/dashboard" className="px-4 py-2 bg-hibiscus/10 text-hibiscus rounded-full font-sans text-sm font-medium hover:bg-hibiscus/20 transition-colors">Dashboard</a>
          <a href="/admin/rsvps" className="px-4 py-2 bg-rattan/20 text-soft rounded-full font-sans text-sm font-medium hover:bg-rattan/30 transition-colors">RSVPs</a>
        </nav>
        <div className="text-center mb-8">
          <h1 className="font-heading text-2xl text-parchment mb-2">Admin Access</h1>
          <p className="text-parchment/60 text-sm font-sans">
            For organizers managing RSVPs and the schedule.
          </p>
        </div>

        <Suspense fallback={<div className="text-parchment/60 text-center font-sans">Loading...</div>}>
          <AdminForm />
        </Suspense>
      </div>
    </div>
  );
}

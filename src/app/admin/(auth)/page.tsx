"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin/dashboard";

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
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full px-4 py-3.5 bg-white/5 border border-white/20 rounded-[14px] text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-mango/50 focus:border-mango/40 font-sans text-center tracking-widest text-lg"
          placeholder=". . . . . . . ."
          required
          autoFocus
        />
      </div>

      {error && (
        <p className="text-hibiscus text-sm font-sans text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-mango/90 hover:bg-mango text-balete rounded-[14px] font-sans font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Checking..." : "Enter"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-balete px-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[16px] bg-mango/15 mb-4">
            <svg className="w-7 h-7 text-mango" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-heading text-xl text-white mb-1">Admin</h1>
          <p className="text-white/40 text-xs font-sans">
            Organizers only
          </p>
        </div>

        <Suspense fallback={<div className="text-white/30 text-center font-sans text-sm">Loading...</div>}>
          <AdminForm />
        </Suspense>
      </div>
    </div>
  );
}

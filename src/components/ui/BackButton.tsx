"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center justify-center w-10 h-10 rounded-xl glass-card hover:bg-white/40 hover:scale-110 active:scale-95 transition-all duration-200 mb-4"
      aria-label="Go back"
    >
      <svg
        className="w-5 h-5 text-ink"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 19.5 8.25 12l7.5-7.5"
        />
      </svg>
    </button>
  );
}

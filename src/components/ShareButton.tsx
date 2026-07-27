"use client";

import { useState } from "react";

const SHARE_URL = "https://apor-tree.vercel.app";
const SHARE_TEXT = "Join the APOR Family Reunion!";

export default function ShareButton() {
  const [shared, setShared] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "APOR Family Reunion",
          text: SHARE_TEXT,
          url: SHARE_URL,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
      }
    } else {
      try {
        await navigator.clipboard.writeText(SHARE_URL);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-xl text-sm font-sans text-ink hover:bg-white/60 transition-all duration-200"
    >
      {shared ? (
        <>
          <svg className="w-4 h-4 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Link copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
          Share this reunion
        </>
      )}
    </button>
  );
}
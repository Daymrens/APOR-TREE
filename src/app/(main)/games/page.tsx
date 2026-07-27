"use client";

import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import ShareButton from "@/components/ShareButton";

export default function GamesPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="fixed top-4 right-4 z-50">
        <ShareButton />
      </div>
      <BackButton />
      <h1 className="font-heading text-3xl text-balete mb-2 animate-fade-in">
        Games
      </h1>
      <p
        className="text-soft font-sans mb-8 animate-fade-in"
        style={{ animationDelay: "0.05s" }}
      >
        Fun activities for the whole family.
      </p>

      <div className="space-y-4">
        <Link
          href="/games/trivia"
          className="glass-card rounded-2xl p-6 flex items-center gap-4 group transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/10 hover:scale-[1.01] active:scale-[0.99] animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-hibiscus to-[#a82f5a] flex items-center justify-center shrink-0">
            <svg
              className="w-7 h-7 text-parchment"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-lg text-balete group-hover:text-hibiscus transition-colors">
              Family Trivia
            </h2>
            <p className="text-soft text-sm font-sans">
              Test your knowledge about the Apor family
            </p>
          </div>
          <svg
            className="w-5 h-5 text-soft/40 group-hover:text-hibiscus group-hover:translate-x-1 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

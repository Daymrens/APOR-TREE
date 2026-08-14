"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import FamilyWordmark from "@/components/FamilyWordmark";
import Countdown from "@/components/ui/Countdown";
import ShareButton from "@/components/ShareButton";
import { getConfig } from "@/lib/firestore/config";
import type { ReunionConfig } from "@/lib/types";

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export default function HomePage() {
  const [counts, setCounts] = useState({
    confirmed: 0,
    maybe: 0,
    headcount: 0,
  });
  const [greeting, setGreeting] = useState<string | null>(null);
  const [config, setConfig] = useState<ReunionConfig | null>(null);
  const [drawn, setDrawn] = useState(false);
  const spineRef = useRef<SVGSVGElement>(null);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const check = () => {
      prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };
    check();
    window.addEventListener("change", check);
    return () => window.removeEventListener("change", check);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion.current) {
      setDrawn(true);
      return;
    }
    if (!spineRef.current) return;
    const path = spineRef.current.querySelector(".spine-trunk") as SVGPathElement;
    if (!path) { setDrawn(true); return; }
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    requestAnimationFrame(() => {
      path.style.transition = "stroke-dashoffset 1s ease-out";
      path.style.strokeDashoffset = "0";
    });
    const timer = setTimeout(() => setDrawn(true), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    function getCookie(name: string): string | null {
      const cookies = document.cookie.split(";");
      for (const c of cookies) {
        const [key, ...rest] = c.trim().split("=");
        if (key === name) {
          return safeDecode(rest.join("="));
        }
      }
      return null;
    }
    const memberName = getCookie("family-member-name");
    if (memberName) {
      setGreeting(memberName);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rsvp-count")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("rsvp-count failed"))))
      .then((data) => {
        if (cancelled) return;
        const c = data.counts;
        if (c) {
          setCounts({
            confirmed: c.yes ?? 0,
            maybe: c.maybe ?? 0,
            headcount: (c.yes ?? 0) + (c.maybe ?? 0),
          });
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV === "development") console.warn("rsvp-count unavailable:", error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sections = [
    { href: "/rsvp", title: "Confirm your RSVP", desc: "Let us know you're coming, and who's joining you.", icon: "📋", delay: 0.2, span: "bento--wide", dot: "bg-hibiscus" },
    { href: "/schedule", title: "Schedule", desc: "What's happening and when.", icon: "📅", delay: 0.3, span: "", dot: "bg-mango" },
    { href: "/location", title: "Location", desc: "Map, parking, getting there.", icon: "📍", delay: 0.4, span: "", dot: "bg-rattan" },
    { href: "/gallery", title: "Photo gallery", desc: "Browse and upload reunion photos.", icon: "📷", delay: 0.5, span: "bento--wide", dot: "bg-mango" },
    { href: "/games", title: "Games", desc: "Trivia, bingo, icebreakers.", icon: "🎮", delay: 0.6, span: "", dot: "bg-rattan" },
    { href: "/tree", title: "Family tree", desc: "Explore generations of connections.", icon: "🌳", delay: 0.7, span: "", dot: "bg-hibiscus" },
    { href: "/contribute", title: "Leave a contribution", desc: "Suggest corrections or additions to reunion details.", icon: "✏️", delay: 0.8, span: "bento--full", dot: "bg-mango" },
  ];

  const years = config?.eventDates?.start
    ? config.eventDates.start.toDate().getFullYear()
    : new Date().getFullYear();

  return (
    <div className="min-h-screen">
      {/* ── Dark editorial hero band ─────────────────────────────── */}
      <section className="hero-band">
        <div className="max-w-[1100px] mx-auto px-4 pt-16 pb-14 sm:pt-20 sm:pb-16">
          <div className="flex justify-between items-start mb-10">
            <p className="font-mono text-[11px] text-mango-light tracking-[0.35em] uppercase">
              Family Reunion · {years}
            </p>
            <span className="hidden sm:flex">
              <ShareButton light />
            </span>
          </div>

          {greeting && (
            <p className="text-parchment/70 font-sans text-sm mb-6 animate-fade-in">
              Welcome back, <span className="text-mango-light font-medium">{greeting}</span>
            </p>
          )}

          {/* Signature: kinetic wordmark, clipped to the viewport edge */}
          <div className="mb-2 animate-fade-in">
            <FamilyWordmark light className="kinetic-hero--clip text-[clamp(5.5rem,20vw,13rem)]" />
          </div>
          <div className="hero-rule w-full sm:w-2/3 mb-8" />

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
            <div className="max-w-md">
              <p className="text-parchment/80 font-sans text-base sm:text-lg leading-relaxed mb-8">
                One place for the whole family — the reunion, the tree, the memories,
                and the games. Passcode, then gather.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/rsvp"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-mango text-balete-deep rounded-full font-sans font-semibold text-sm transition-all duration-200 hover:bg-mango-light hover:scale-[1.02] active:scale-[0.98]"
                >
                  Confirm your RSVP
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/tree"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-parchment/20 text-parchment rounded-full font-sans text-sm transition-all duration-200 hover:border-mango-light hover:text-mango-light"
                >
                  Explore the tree
                </Link>
              </div>
            </div>

            {/* Stats strip — social proof via numbers */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="font-mono text-4xl sm:text-5xl text-mango-light font-medium tabular-nums">{counts.confirmed}</p>
                <p className="text-parchment/50 text-xs font-sans mt-1">Confirmed</p>
              </div>
              <div>
                <p className="font-mono text-4xl sm:text-5xl text-hibiscus-light font-medium tabular-nums">{counts.maybe}</p>
                <p className="text-parchment/50 text-xs font-sans mt-1">Maybe</p>
              </div>
              <div>
                <p className="font-mono text-4xl sm:text-5xl text-parchment font-medium tabular-nums">{counts.headcount}</p>
                <p className="text-parchment/50 text-xs font-sans mt-1">Headcount</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Light content below ─────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-4 py-10 sm:py-14 relative">
        {/* Branching spine SVG */}
        <svg
          ref={spineRef}
          className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 pointer-events-none"
          viewBox="0 0 2 1200"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ zIndex: 0 }}
        >
          <path
            className="spine-trunk"
            d="M 1 60 L 1 1140"
            stroke="url(#spine-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: prefersReducedMotion.current ? "none" : "stroke-dashoffset 1s ease-out" }}
          />
          <defs>
            <linearGradient id="spine-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E8A63D" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#BFA06A" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#BFA06A" stopOpacity="0.06" />
            </linearGradient>
          </defs>
        </svg>

        {/* Countdown */}
        <section className="mb-10 relative animate-fade-in" style={{ zIndex: 1 }}>
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 rounded-full bg-hibiscus mt-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-sans text-xs text-soft/60 uppercase tracking-wider mb-3">Countdown</p>
              {config?.eventDates?.start ? (
                <Countdown targetDate={config.eventDates.start.toDate()} />
              ) : (
                <div className="card p-6">
                  <p className="font-heading text-2xl text-ink mb-1">Event date TBA</p>
                  <p className="text-soft text-sm font-sans">Stay tuned for announcements.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Leaf bento */}
        <section className="bento grid-cols-2 sm:grid-cols-4 relative reveal" style={{ zIndex: 1 }}>
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={`card card-hover relative p-5 flex flex-col items-start gap-3 group ${section.span} ${
                section.span === "bento--full" ? "sm:flex-row sm:items-center" : ""
              }`}
              style={{ animationDelay: `${section.delay}s` }}
            >
              {/* Leaf node dot */}
              <div className={`absolute -top-1 left-5 w-2 h-2 rounded-full border-2 border-surface ${section.dot}`} />

              <span className="text-xl leading-none mt-0.5">{section.icon}</span>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg text-ink mb-0.5 group-hover:text-hibiscus transition-colors duration-200">
                  {section.title}
                </h2>
                <p className="text-soft text-sm font-sans">{section.desc}</p>
              </div>
              <svg className="w-4 h-4 text-soft/30 group-hover:text-hibiscus transition-colors duration-200 flex-shrink-0 sm:ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}

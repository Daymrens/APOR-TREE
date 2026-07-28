"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import BackButton from "@/components/ui/BackButton";
import Countdown from "@/components/ui/Countdown";
import ShareButton from "@/components/ShareButton";
import { getConfig } from "@/lib/firestore/config";
import type { ReunionConfig } from "@/lib/types";

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
    const memberName = document.cookie
      .split("; ")
      .find((c) => c.startsWith("family-member-name="))
      ?.split("=")[1];
    if (memberName) {
      setGreeting(decodeURIComponent(memberName));
    }
  }, []);

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, "rsvps"),
        (snapshot) => {
          let confirmed = 0;
          let maybe = 0;
          let headcount = 0;

          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.attending === "yes") {
              confirmed++;
              headcount += 1 + (data.guestCount || 0);
            } else if (data.attending === "maybe") {
              maybe++;
              headcount += 1 + (data.guestCount || 0);
            }
          });

          setCounts({ confirmed, maybe, headcount });
        },
        (error) => {
          console.warn("Firestore not available:", error.message);
        }
      );

      return () => unsub();
    } catch (error) {
      console.warn("Firestore not available:", error);
    }
  }, []);

  const sections = [
    { href: "/rsvp", title: "Confirm your RSVP", desc: "Let us know if you're coming, and who's joining you.", icon: "📋", delay: 0.3 },
    { href: "/schedule", title: "View the schedule", desc: "See what's happening and when to be there.", icon: "📅", delay: 0.4 },
    { href: "/location", title: "Location & logistics", desc: "Map, parking, and everything you need to get there.", icon: "📍", delay: 0.5 },
    { href: "/gallery", title: "Photo gallery", desc: "Browse and upload reunion photos.", icon: "📷", delay: 0.6 },
    { href: "/games", title: "Games & activities", desc: "Trivia, bingo, and icebreakers for all ages.", icon: "🎮", delay: 0.7 },
    { href: "/tree", title: "Family tree", desc: "Explore generations of APOR family connections.", icon: "🌳", delay: 0.8 },
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 relative">
      <BackButton />
      <ShareButton />

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
            <stop offset="0%" stopColor="#1E3B2C" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#C9A876" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#C9A876" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Hero node */}
      <section className="text-center py-12 sm:py-16 relative animate-fade-in" style={{ zIndex: 1 }}>
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-mango/25 to-mango/5 p-[3px] mb-6 animate-scale-in">
          <div className="w-full h-full rounded-full bg-parchment flex items-center justify-center">
            <span className="font-heading text-3xl text-balete font-bold">A</span>
          </div>
        </div>
        <h1 className="font-heading text-5xl sm:text-6xl mb-3 gradient-text animate-slide-up">
          APOR
        </h1>
        <p className="text-soft font-sans text-lg animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Family Reunion
        </p>
        {greeting && (
          <p className="text-hibiscus font-sans text-base mt-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Welcome back, <span className="font-medium">{greeting}</span>!
          </p>
        )}
      </section>

      {/* Countdown node */}
      <section className="mb-8 relative animate-slide-up" style={{ animationDelay: "0.15s", zIndex: 1 }}>
        {config?.eventDates?.start ? (
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 rounded-full bg-hibiscus mt-2 flex-shrink-0 shadow-lg shadow-hibiscus/40" />
            <div className="flex-1">
              <Countdown targetDate={config.eventDates.start.toDate()} />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-3 h-3 rounded-full bg-hibiscus mt-2 flex-shrink-0 shadow-lg shadow-hibiscus/40" />
            <div className="flex-1 glass-card rounded-2xl p-6">
              <p className="font-heading text-2xl text-hibiscus mb-1">Event date TBA</p>
              <p className="text-soft text-sm font-sans">Stay tuned for announcements.</p>
            </div>
          </div>
        )}
      </section>

      {/* RSVP Counter node */}
      <section className="glass-card rounded-2xl p-6 mb-8 relative animate-slide-up" style={{ animationDelay: "0.2s", zIndex: 1 }}>
        <div className="flex items-start gap-4">
          <div className="w-3 h-3 rounded-full bg-mango mt-2 flex-shrink-0 shadow-lg shadow-mango/40" />
          <div className="flex-1">
            <p className="font-sans text-xs text-soft/50 uppercase tracking-wider mb-3">Who's coming</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-mono text-3xl text-hibiscus font-medium tabular-nums">
                  {counts.confirmed}
                </p>
                <p className="text-soft text-sm font-sans mt-1">Confirmed</p>
              </div>
              <div>
                <p className="font-mono text-3xl text-mango font-medium tabular-nums">
                  {counts.maybe}
                </p>
                <p className="text-soft text-sm font-sans mt-1">Maybe</p>
              </div>
              <div>
                <p className="font-mono text-3xl text-balete font-medium tabular-nums">
                  {counts.headcount}
                </p>
                <p className="text-soft text-sm font-sans mt-1">Headcount</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaf cards */}
      <section className="space-y-3 relative" style={{ zIndex: 1 }}>
        {/* Branch connectors from spine to cards */}
        <svg className="absolute left-1/2 top-0 bottom-0 w-px pointer-events-none" viewBox="0 0 2 1200" fill="none" preserveAspectRatio="none" aria-hidden="true" style={{ zIndex: 0 }}>
          <line x1="1" y1="0" x2="1" y2="1200" stroke="#C9A876" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 8" />
        </svg>

        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="glass-card rounded-2xl p-5 flex items-start gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-hibiscus/40 group relative pl-8"
            style={{ animationDelay: `${section.delay}s` }}
          >
            {/* Branch dot on spine */}
            <div className="absolute left-[calc(50%-6px)] top-5 w-3 h-3 rounded-full bg-parchment border-2 border-rattan/40 group-hover:border-hibiscus/60 transition-colors duration-300" />

            {/* Branch line from spine to card */}
            <div className="absolute left-[calc(50%+6px)] top-6 w-8 h-px bg-gradient-to-r from-rattan/30 to-transparent" />

            <span className="text-xl mt-0.5">{section.icon}</span>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading text-lg text-balete mb-0.5 group-hover:text-hibiscus transition-colors duration-200">
                {section.title}
              </h2>
              <p className="text-soft text-sm font-sans">{section.desc}</p>
            </div>
            <svg className="w-4 h-4 text-soft/30 group-hover:text-soft/60 transition-colors duration-200 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
      </section>

      <div className="mt-10 flex justify-center">
        <ShareButton />
      </div>
    </div>
  );
}
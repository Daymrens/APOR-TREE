"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <BackButton />
      {/* Hero */}
      <section className="text-center py-12 sm:py-16 animate-fade-in">
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

      {/* Countdown */}
      <section className="mb-8 animate-slide-up" style={{ animationDelay: "0.15s" }}>
        {config?.eventDates?.start ? (
          <Countdown targetDate={config.eventDates.start.toDate()} />
        ) : (
          <div className="text-center glass-card rounded-2xl p-6">
            <p className="font-heading text-2xl text-hibiscus mb-1">Event date TBA</p>
            <p className="text-soft text-sm font-sans">Stay tuned for announcements.</p>
          </div>
        )}
      </section>

      {/* RSVP Counter */}
      <section className="glass-card rounded-2xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
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
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/rsvp"
          className="glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-hibiscus/40 animate-fade-in-stagger-1"
        >
          <h2 className="font-heading text-xl text-balete mb-1">
            Confirm your RSVP
          </h2>
          <p className="text-soft text-sm font-sans">
            Let us know if you&apos;re coming, and who&apos;s joining you.
          </p>
        </Link>

        <Link
          href="/schedule"
          className="glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-hibiscus/40 animate-fade-in-stagger-2"
        >
          <h2 className="font-heading text-xl text-balete mb-1">
            View the schedule
          </h2>
          <p className="text-soft text-sm font-sans">
            See what&apos;s happening and when to be there.
          </p>
        </Link>

        <Link
          href="/location"
          className="glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-hibiscus/40 animate-fade-in-stagger-3"
        >
          <h2 className="font-heading text-xl text-balete mb-1">
            Location & logistics
          </h2>
          <p className="text-soft text-sm font-sans">
            Map, parking, and everything you need to get there.
          </p>
        </Link>

        <Link
          href="/gallery"
          className="glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-hibiscus/40 animate-fade-in-stagger-4"
        >
          <h2 className="font-heading text-xl text-balete mb-1">
            Photo gallery
          </h2>
          <p className="text-soft text-sm font-sans">
            Browse and upload reunion photos.
          </p>
        </Link>
      </section>

      <div className="mt-8 flex justify-center">
        <ShareButton />
      </div>
    </div>
  );
}

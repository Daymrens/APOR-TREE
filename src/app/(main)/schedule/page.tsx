"use client";

import { useEffect, useState } from "react";
import { getSchedule } from "@/lib/firestore/schedule";
import { getConfig } from "@/lib/firestore/config";
import type { ScheduleItem, ReunionConfig } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";
import Skeleton from "@/components/ui/Skeleton";

function ScheduleIcon({ type }: { type: string }) {
  const iconClass = "w-5 h-5";

  switch (type) {
    case "food":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12" />
        </svg>
      );
    case "game":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6.75a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 0-.75.75v8.25c0 .414.336.75.75.75h12a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75h-2.25a.75.75 0 0 1-.75-.75" />
        </svg>
      );
    case "photo":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
        </svg>
      );
    case "program":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      );
    case "travel":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      );
    case "ceremony":
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      );
  }
}

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [config, setConfig] = useState<ReunionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    Promise.all([getSchedule(), getConfig()])
      .then(([schedule, cfg]) => {
        setItems(schedule);
        setConfig(cfg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const grouped = items.reduce<Record<number, ScheduleItem[]>>((acc, item) => {
    (acc[item.day] = acc[item.day] || []).push(item);
    return acc;
  }, {});

  const days = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  function getItemStatus(item: ScheduleItem): "happening" | "next" | "past" | "future" {
    if (!config?.eventDates?.start) return "future";
    const eventStart = config.eventDates.start.toDate();
    const itemDate = new Date(eventStart);
    itemDate.setDate(itemDate.getDate() + item.day - 1);
    const [h, m] = item.startTime.split(":").map(Number);
    itemDate.setHours(h, m, 0, 0);
    const endTime = item.endTime ? (() => {
      const [eh, em] = item.endTime.split(":").map(Number);
      const e = new Date(eventStart);
      e.setDate(e.getDate() + item.day - 1);
      e.setHours(eh, em, 0, 0);
      return e;
    })() : new Date(itemDate.getTime() + 60 * 60 * 1000);

    if (now >= itemDate && now <= endTime) return "happening";
    if (now > endTime) return "past";
    return "future";
  }

  function getNextItem(): ScheduleItem | null {
    for (const day of days) {
      const sorted = grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (const item of sorted) {
        if (getItemStatus(item) === "future" || getItemStatus(item) === "next") return item;
      }
    }
    return null;
  }

  const nextItem = getNextItem();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-3xl text-balete mb-2 animate-fade-in">Schedule</h1>
      <p className="text-soft font-sans mb-8 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        Here&apos;s what&apos;s happening and when.
      </p>

      {config && (config.venueName || config.venueAddress || config.contactPerson) && (
        <div className="clay rounded-2xl p-5 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {config.venueName && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mango/15 to-mango/5 flex items-center justify-center text-mango flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading text-lg text-balete">{config.venueName}</h2>
                {config.venueAddress && (
                  <p className="font-sans text-soft text-sm">{config.venueAddress}</p>
                )}
              </div>
            </div>
          )}
          {config.contactPerson && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hibiscus/15 to-hibiscus/5 flex items-center justify-center text-hibiscus flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </div>
              <div>
                <p className="font-sans text-ink text-sm">{config.contactPerson}</p>
                {config.contactNumber && (
                  <a href={`tel:${config.contactNumber}`} className="font-mono text-hibiscus text-sm hover:underline transition-colors">
                    {config.contactNumber}
                  </a>
                )}
              </div>
            </div>
          )}
          {config.parkingNotes && (
            <div className="flex items-center gap-3 mt-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-balete/15 to-balete/5 flex items-center justify-center text-balete flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <p className="font-sans text-soft text-sm">{config.parkingNotes}</p>
            </div>
          )}
        </div>
      )}

      {!loading && days.length > 0 && (nextItem || items.some(i => getItemStatus(i) === "happening")) && (
        <div className="mb-8 space-y-3 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          {items.filter(i => getItemStatus(i) === "happening").map(item => (
            <div key={`live-${item.id}`} className="clay rounded-2xl p-4 border-l-4 border-hibiscus animate-glow-pulse">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-hibiscus uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-hibiscus animate-pulse" />
                  Happening now
                </span>
              </div>
              <h3 className="font-sans font-medium text-ink">{item.title}</h3>
              <p className="text-soft text-sm font-sans mt-0.5">
                <span className="font-mono text-hibiscus">{item.startTime}{item.endTime ? `–${item.endTime}` : ""}</span>
                {item.location && <span className="text-rattan"> · {item.location}</span>}
              </p>
            </div>
          ))}
          {nextItem && getItemStatus(nextItem) === "future" && (
            <div className="clay rounded-2xl p-4 border-l-4 border-mango">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-mango uppercase tracking-wider">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  Up next
                </span>
              </div>
              <h3 className="font-sans font-medium text-ink">{nextItem.title}</h3>
              <p className="text-soft text-sm font-sans mt-0.5">
                <span className="font-mono text-mango">{nextItem.startTime}{nextItem.endTime ? `–${nextItem.endTime}` : ""}</span>
                {nextItem.location && <span className="text-rattan"> · {nextItem.location}</span>}
              </p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : days.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rattan/10 mb-4">
            <svg className="w-8 h-8 text-rattan" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <p className="text-soft font-sans">
            Schedule not announced yet — check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {days.map((day, dayIndex) => (
            <div key={day} className="animate-slide-up" style={{ animationDelay: `${dayIndex * 0.15}s` }}>
              <h2 className="font-heading text-lg text-balete mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-mango/20 to-mango/5 text-mango text-sm font-mono font-medium">
                  {day}
                </span>
                Day {day}
              </h2>

              <div className="relative">
                {/* Timeline connector */}
                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-rattan/20" />

                <div className="space-y-3">
                  {grouped[day]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((item, i) => {
                      const status = getItemStatus(item);
                      return (
                      <div
                        key={item.id}
                        className={`clay rounded-2xl p-4 flex gap-4 relative animate-fade-in ${
                          status === "happening" ? "ring-2 ring-hibiscus/40 bg-hibiscus/5" : ""
                        }`}
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        {/* Timeline dot */}
                        <div className={`absolute left-[15px] top-4 w-2 h-2 rounded-full z-10 ${
                          status === "happening" ? "bg-hibiscus animate-pulse" : status === "past" ? "bg-rattan/30" : "bg-hibiscus/60"
                        }`} />

                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hibiscus/10 to-hibiscus/5 flex items-center justify-center flex-shrink-0 text-hibiscus ml-2">
                          <ScheduleIcon type={item.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-mono text-sm text-hibiscus tabular-nums">
                              {item.startTime}
                              {item.endTime ? `–${item.endTime}` : ""}
                            </span>
                            <h3 className="font-sans font-medium text-ink truncate">
                              {item.title}
                            </h3>
                          </div>
                          {item.description && (
                            <p className="text-soft text-sm font-sans">
                              {item.description}
                            </p>
                          )}
                          {item.location && (
                            <div className="flex items-center gap-1 text-rattan text-xs font-sans mt-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                              </svg>
                              {item.location}
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

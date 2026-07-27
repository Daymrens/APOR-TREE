"use client";

import { useEffect, useState } from "react";
import { getConfig } from "@/lib/firestore/config";
import type { ReunionConfig } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";

export default function LocationPage() {
  const [config, setConfig] = useState<ReunionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="space-y-3">
          <div className="glass-card rounded-2xl h-48 animate-pulse" />
          <div className="glass-card rounded-2xl h-24 animate-pulse" />
          <div className="glass-card rounded-2xl h-24 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-3xl text-balete mb-2 animate-fade-in">Location</h1>
      <p className="text-soft font-sans mb-8 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        Everything you need to get there.
      </p>

      {/* Map embed */}
      {config?.mapEmbedUrl && (
        <div className="rounded-2xl overflow-hidden shadow-lg mb-6 aspect-video bg-rattan/20 animate-slide-up gradient-border">
          <iframe
            src={config.mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mango/15 to-mango/5 flex items-center justify-center text-mango">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-lg text-balete">Venue</h2>
              <p className="font-sans text-ink text-sm">{config?.venueName || "TBA"}</p>
            </div>
          </div>
          {config?.venueAddress && (
            <p className="font-sans text-soft text-sm mt-1 ml-[52px]">{config.venueAddress}</p>
          )}
        </div>

        {config?.parkingNotes && (
          <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-balete/15 to-balete/5 flex items-center justify-center text-balete">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading text-lg text-balete">Parking</h2>
                <p className="font-sans text-soft text-sm">{config.parkingNotes}</p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hibiscus/15 to-hibiscus/5 flex items-center justify-center text-hibiscus">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 1.498 1.404 2.808a1.125 1.125 0 0 1-1.004 1.593H6.101a1.125 1.125 0 0 1-1.004-1.593l1.404-2.808M12 11.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75V12Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-lg text-balete">Getting there</h2>
              <p className="font-sans text-soft text-sm">
                {config?.venueName
                  ? `Head to ${config.venueName}${config.venueAddress ? ` at ${config.venueAddress}` : ""}. Look for the APOR family signs — we'll make sure you find your way.`
                  : "Location details coming soon."}
              </p>
            </div>
          </div>
        </div>

        {config?.contactPerson && (
          <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rattan/15 to-rattan/5 flex items-center justify-center text-rattan">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
              </div>
              <div>
                <h2 className="font-heading text-lg text-balete">Contact person</h2>
                <p className="font-sans text-ink text-sm">{config.contactPerson}</p>
                {config.contactNumber && (
                  <a
                    href={`tel:${config.contactNumber}`}
                    className="font-mono text-hibiscus text-sm hover:underline transition-colors"
                  >
                    {config.contactNumber}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

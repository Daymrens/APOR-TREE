"use client";

import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/ui/BackButton";
import type { ReunionConfig } from "@/lib/types";

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl font-sans text-sm backdrop-blur shadow-lg animate-in slide-in-from-top-4 ${
        type === "success"
          ? "bg-balete/15 text-balete border border-balete/20"
          : "bg-hibiscus/15 text-hibiscus border border-hibiscus/20"
      }`}
    >
      {message}
    </div>
  );
}

function toDatetimeLocal(timestamp: { seconds: number; nanoseconds?: number } | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp.seconds * 1000);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminConfigPage() {
  const [config, setConfig] = useState<ReunionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [form, setForm] = useState({
    eventDateStart: "",
    eventDateEnd: "",
    venueName: "",
    venueAddress: "",
    mapEmbedUrl: "",
    contactPerson: "",
    contactNumber: "",
    parkingNotes: "",
    coverImageUrl: "",
  });

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
    },
    []
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/get-config");
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setConfig(data.config);
            setForm({
              eventDateStart: toDatetimeLocal(data.config.eventDates?.start),
              eventDateEnd: toDatetimeLocal(data.config.eventDates?.end),
              venueName: data.config.venueName ?? "",
              venueAddress: data.config.venueAddress ?? "",
              mapEmbedUrl: data.config.mapEmbedUrl ?? "",
              contactPerson: data.config.contactPerson ?? "",
              contactNumber: data.config.contactNumber ?? "",
              parkingNotes: data.config.parkingNotes ?? "",
              coverImageUrl: data.config.coverImageUrl ?? "",
            });
          }
        }
      } catch {
        showToast("Failed to load config", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Update failed");
      showToast("Config saved", "success");
    } catch {
      showToast("Failed to save config", "error");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 bg-parchment border border-rattan/60 rounded-xl font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-hibiscus/60 transition-colors placeholder:text-soft/40";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <BackButton />
        <div className="mt-4 space-y-3">
          <div className="h-8 w-48 bg-rattan/10 rounded-lg animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-rattan/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <BackButton />
      <h1 className="font-heading text-2xl text-balete mb-1">Reunion Config</h1>
      <p className="text-soft font-sans text-sm mb-6">
        Manage event details, venue info, and contact details.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Event Dates */}
        <div className="bg-white border border-rattan/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-mango/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <h2 className="font-heading text-lg text-balete">Event Dates</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-2">Start</label>
              <input
                type="datetime-local"
                value={form.eventDateStart}
                onChange={(e) => setForm({ ...form, eventDateStart: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-2">End</label>
              <input
                type="datetime-local"
                value={form.eventDateEnd}
                onChange={(e) => setForm({ ...form, eventDateEnd: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Venue */}
        <div className="bg-white border border-rattan/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-balete/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-balete" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <h2 className="font-heading text-lg text-balete">Venue</h2>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={form.venueName}
              onChange={(e) => setForm({ ...form, venueName: e.target.value })}
              className={inputClass}
              placeholder="Venue name"
              aria-label="Venue name"
            />
            <input
              type="text"
              value={form.venueAddress}
              onChange={(e) => setForm({ ...form, venueAddress: e.target.value })}
              className={inputClass}
              placeholder="Venue address"
              aria-label="Venue address"
            />
            <input
              type="url"
              value={form.mapEmbedUrl}
              onChange={(e) => setForm({ ...form, mapEmbedUrl: e.target.value })}
              className={inputClass}
              placeholder="Map embed URL"
              aria-label="Map embed URL"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border border-rattan/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-hibiscus/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </div>
            <h2 className="font-heading text-lg text-balete">Contact</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className={inputClass}
              placeholder="Contact person"
              aria-label="Contact person"
            />
            <input
              type="tel"
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              className={inputClass}
              placeholder="Contact number"
              aria-label="Contact number"
            />
          </div>
        </div>

        {/* Additional */}
        <div className="bg-white border border-rattan/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rattan/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-rattan" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="font-heading text-lg text-balete">Additional</h2>
          </div>
          <div className="space-y-3">
            <textarea
              value={form.parkingNotes}
              onChange={(e) => setForm({ ...form, parkingNotes: e.target.value })}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Parking notes"
              aria-label="Parking notes"
            />
            <input
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              className={inputClass}
              placeholder="Cover image URL"
              aria-label="Cover image URL"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-hibiscus text-parchment rounded-xl font-sans font-medium text-sm hover:bg-hibiscus/90 transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? "Saving..." : "Save config"}
        </button>
      </form>
    </div>
  );
}

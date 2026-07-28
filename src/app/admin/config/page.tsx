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
      className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl font-sans text-sm backdrop-blur shadow-lg ${
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton />
        <p className="text-soft font-sans text-sm">Loading config...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <BackButton />
      <h1 className="font-heading text-2xl text-balete mb-2">Reunion Config</h1>
      <p className="text-soft font-sans mb-6 text-sm">
        Manage event details, venue info, and contact details.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl p-6">
          <h2 className="font-heading text-lg text-balete mb-4">Event Dates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Start date &amp; time</label>
              <input
                type="datetime-local"
                value={form.eventDateStart}
                onChange={(e) => setForm({ ...form, eventDateStart: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink mb-1">End date &amp; time</label>
              <input
                type="datetime-local"
                value={form.eventDateEnd}
                onChange={(e) => setForm({ ...form, eventDateEnd: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl p-6">
          <h2 className="font-heading text-lg text-balete mb-4">Venue</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Venue name</label>
              <input
                type="text"
                value={form.venueName}
                onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Venue address</label>
              <input
                type="text"
                value={form.venueAddress}
                onChange={(e) => setForm({ ...form, venueAddress: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Map embed URL</label>
              <input
                type="url"
                value={form.mapEmbedUrl}
                onChange={(e) => setForm({ ...form, mapEmbedUrl: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl p-6">
          <h2 className="font-heading text-lg text-balete mb-4">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Contact person</label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Contact number</label>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl p-6">
          <h2 className="font-heading text-lg text-balete mb-4">Additional</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Parking notes</label>
              <textarea
                value={form.parkingNotes}
                onChange={(e) => setForm({ ...form, parkingNotes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Cover image URL</label>
              <input
                type="url"
                value={form.coverImageUrl}
                onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-hibiscus text-parchment rounded-full font-sans font-medium hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save config"}
        </button>
      </form>
    </div>
  );
}

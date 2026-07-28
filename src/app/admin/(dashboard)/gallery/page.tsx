"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/ui/BackButton";
import type { GalleryPhoto } from "@/lib/types";

type Filter = "all" | "pending" | "approved";

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function fetchPhotos() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/list-photos");
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch {
      console.error("Failed to load photos");
    }
    setLoading(false);
  }

  async function handleApprove(id: string) {
    try {
      await fetch("/api/admin/approve-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, approved: true } : p)));
    } catch {
      console.error("Failed to approve photo");
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch("/api/admin/delete-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setConfirmDelete(null);
    } catch {
      console.error("Failed to delete photo");
    }
  }

  const filtered = photos.filter((p) => {
    if (filter === "pending") return !p.approved;
    if (filter === "approved") return p.approved;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <BackButton />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl text-balete">Gallery</h1>
          <p className="text-soft font-sans text-sm mt-0.5">
            {filtered.length} of {photos.length} photos
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["all", "pending", "approved"] as const).map((f) => {
          const count = f === "all" ? photos.length : f === "pending" ? photos.filter((p) => !p.approved).length : photos.filter((p) => p.approved).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-sans text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-balete text-parchment shadow-sm"
                  : "bg-white border border-rattan/40 text-soft hover:bg-rattan/5"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-rattan/10 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-rattan/20 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rattan/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-soft/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M2.25 18V6.75A2.25 2.25 0 0 1 4.5 4.5h15A2.25 2.25 0 0 1 21.75 6.75v11.25" />
            </svg>
          </div>
          <p className="text-soft font-sans text-sm">No photos found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((photo) => (
            <div
              key={photo.id}
              className="bg-white border border-rattan/20 rounded-2xl overflow-hidden shadow-sm group"
            >
              <div className="aspect-square overflow-hidden bg-rattan/5 relative">
                <img
                  src={photo.thumbnailUrl || photo.storageUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {!photo.approved && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 bg-mango/90 text-parchment rounded-md text-[10px] font-sans font-semibold uppercase tracking-wide">
                      Pending
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-ink text-sm font-sans font-medium truncate">{photo.caption}</p>
                <p className="text-soft/60 text-xs font-sans mt-0.5">{photo.uploaderName}</p>
                <div className="flex items-center justify-between mt-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      photo.approved
                        ? "bg-balete/10 text-balete"
                        : "bg-mango/10 text-mango"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${photo.approved ? "bg-balete" : "bg-mango"}`} />
                    {photo.approved ? "Approved" : "Pending"}
                  </span>
                  <div className="flex gap-1">
                    {!photo.approved && (
                      <button
                        onClick={() => handleApprove(photo.id)}
                        className="px-3 py-1 bg-balete/10 text-balete rounded-lg text-xs font-medium hover:bg-balete/20 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {confirmDelete === photo.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="px-2 py-1 bg-hibiscus text-parchment rounded-lg text-xs font-medium hover:bg-hibiscus/90 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 bg-rattan/10 text-soft rounded-lg text-xs font-medium hover:bg-rattan/20 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(photo.id)}
                        className="px-3 py-1 bg-rattan/10 text-soft rounded-lg text-xs font-medium hover:bg-rattan/20 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

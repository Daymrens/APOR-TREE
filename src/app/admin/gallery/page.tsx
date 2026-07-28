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
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, approved: true } : p))
      );
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-2xl text-balete mb-6">Gallery Management</h1>

      <div className="flex gap-2 mb-6">
        {(["all", "pending", "approved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-sans text-sm font-medium transition-colors ${
              filter === f
                ? "bg-hibiscus text-parchment"
                : "bg-white/40 backdrop-blur-sm border border-rattan/30 text-soft hover:bg-white/60"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-soft font-sans">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-soft font-sans py-8 text-center">No photos found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((photo) => (
            <div
              key={photo.id}
              className="bg-white/40 backdrop-blur-md border border-rattan/20 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="aspect-square overflow-hidden bg-rattan/10">
                <img
                  src={photo.thumbnailUrl || photo.storageUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-ink text-sm font-sans font-medium truncate">{photo.caption}</p>
                <p className="text-soft/70 text-xs font-sans mt-1">{photo.uploaderName}</p>
                <div className="flex items-center justify-between mt-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      photo.approved
                        ? "bg-hibiscus/10 text-hibiscus"
                        : "bg-mango/10 text-mango"
                    }`}
                  >
                    {photo.approved ? "Approved" : "Pending"}
                  </span>
                  <div className="flex gap-1">
                    {!photo.approved && (
                      <button
                        onClick={() => handleApprove(photo.id)}
                        className="px-3 py-1 bg-hibiscus/10 text-hibiscus rounded-full text-xs font-medium hover:bg-hibiscus/20 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {confirmDelete === photo.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 bg-soft/10 text-soft rounded-full text-xs font-medium hover:bg-soft/20 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(photo.id)}
                        className="px-3 py-1 bg-soft/10 text-soft rounded-full text-xs font-medium hover:bg-soft/20 transition-colors"
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

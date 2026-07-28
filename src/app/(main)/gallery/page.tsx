"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import BackButton from "@/components/ui/BackButton";
import type { GalleryPhoto } from "@/lib/types";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    const q = query(
      collection(db, "gallery_photos"),
      orderBy("uploadedAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as GalleryPhoto[];
        setPhotos(data);
        setLoading(false);
      },
      (error) => {
        if (process.env.NODE_ENV === "development") console.warn("Firestore not available:", error.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

  const goNext = useCallback(() => {
    if (selectedIndex === null || photos.length === 0) return;
    setSelectedIndex((selectedIndex + 1) % photos.length);
  }, [selectedIndex, photos.length]);

  const goPrev = useCallback(() => {
    if (selectedIndex === null || photos.length === 0) return;
    setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length);
  }, [selectedIndex, photos.length]);

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  useEffect(() => {
    if (selectedIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        closeLightbox();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedIndex, goNext, goPrev, closeLightbox]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-balete mb-1 animate-fade-in">Gallery</h1>
          <p className="text-soft font-sans text-sm animate-fade-in" style={{ animationDelay: "0.05s" }}>
            {loading
              ? "Loading..."
              : photos.length === 0
              ? "No photos or videos yet."
              : `${photos.length} item${photos.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <a
          href="/gallery/upload"
          className="px-4 py-2 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans text-sm transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.02] active:scale-[0.98]"
        >
          Add photos & videos
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-rattan/10 animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rattan/10 mb-4">
            <svg className="w-8 h-8 text-rattan" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
          <p className="text-soft font-sans">
            No photos or videos yet — be the first to add one from the reunion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
              className="relative aspect-square rounded-2xl overflow-hidden bg-rattan/10 focus:outline-none focus:ring-2 focus:ring-hibiscus transition-all duration-200 hover:scale-[1.03] hover:shadow-lg animate-fade-in"
              style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
            >
              {photo.mediaType === "video" ? (
                <>
                  <video
                    src={photo.thumbnailUrl || photo.storageUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={photo.thumbnailUrl || photo.storageUrl}
                  alt={photo.caption || "Reunion photo"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 glass rounded-full flex items-center justify-center text-parchment hover:bg-white/25 transition-all duration-200 z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-parchment/70 text-sm font-mono tabular-nums z-10 glass px-3 py-1 rounded-full">
            {selectedIndex! + 1} / {photos.length}
          </div>

          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center text-parchment hover:bg-white/25 transition-all duration-200 z-10"
              aria-label="Previous photo"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center text-parchment hover:bg-white/25 transition-all duration-200 z-10"
              aria-label="Next photo"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          <div
            className="max-w-3xl w-full mx-4 sm:mx-12 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedPhoto.mediaType === "video" ? (
              <video
                src={selectedPhoto.storageUrl}
                className="w-full max-h-[80vh] object-contain rounded-2xl"
                key={selectedPhoto.id}
                controls
                autoPlay
              />
            ) : (
              <img
                src={selectedPhoto.storageUrl}
                alt={selectedPhoto.caption || "Reunion photo"}
                className="w-full max-h-[80vh] object-contain rounded-2xl"
                key={selectedPhoto.id}
              />
            )}
            {(selectedPhoto.caption || selectedPhoto.uploaderName) && (
              <div className="mt-3 glass rounded-xl px-4 py-3 text-parchment text-sm font-sans">
                {selectedPhoto.caption && <p>{selectedPhoto.caption}</p>}
                {selectedPhoto.uploaderName && (
                  <p className="text-parchment/50 text-xs mt-1">by {selectedPhoto.uploaderName}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

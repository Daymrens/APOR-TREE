"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import BackButton from "@/components/ui/BackButton";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const FULL_MAX_DIM = 1200;
const THUMB_MAX_DIM = 300;

interface UploadResult {
  name: string;
  success: boolean;
  error?: string;
}

function resizeImage(file: File, maxDim: number, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to resize image"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

function validateFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return `"${file.name}" is not an image file.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = Math.round(file.size / (1024 * 1024));
    return `"${file.name}" is ${sizeMB}MB — max is 10MB.`;
  }
  return null;
}

function blobToFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: "image/jpeg" });
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [results, setResults] = useState<UploadResult[]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(selected).forEach((file) => {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(" "));
    } else {
      setError("");
    }

    if (validFiles.length > 0) {
      const dt = new DataTransfer();
      validFiles.forEach((f) => dt.items.add(f));
      setFiles(dt.files);

      const previews: string[] = validFiles.map((f) => URL.createObjectURL(f));
      setPreview(previews);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files || !name.trim()) return;
    setError("");
    setUploading(true);
    setProgress(0);
    setResults([]);

    const uploadResults: UploadResult[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      try {
        const [fullBlob, thumbBlob] = await Promise.all([
          resizeImage(file, FULL_MAX_DIM),
          resizeImage(file, THUMB_MAX_DIM, 0.8),
        ]);

        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const baseName = `${timestamp}-${safeName}`;

        const fullFile = blobToFile(fullBlob, baseName);
        const thumbFile = blobToFile(thumbBlob, baseName);

        const [fullResult, thumbResult] = await Promise.all([
          uploadToCloudinary(fullFile, "gallery/full"),
          uploadToCloudinary(thumbFile, "gallery/thumbs"),
        ]);

        await addDoc(collection(db, "gallery_photos"), {
          storageUrl: fullResult.url,
          thumbnailUrl: thumbResult.url,
          uploaderName: name.trim(),
          caption: caption.trim(),
          uploadedAt: Timestamp.now(),
          approved: true,
        });

        uploadResults.push({ name: file.name, success: true });
      } catch (err) {
        uploadResults.push({
          name: file.name,
          success: false,
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }

      setProgress(Math.round(((i + 1) / total) * 100));
      setResults([...uploadResults]);
    }

    const failed = uploadResults.filter((r) => !r.success);
    if (failed.length === total) {
      setError("All uploads failed. Please try again.");
      setUploading(false);
    } else if (failed.length > 0) {
      setCaption("");
      setFiles(null);
      setPreview([]);
      setUploading(false);
    } else {
      router.push("/gallery");
    }
  }

  const failedCount = results.filter((r) => !r.success).length;
  const successCount = results.filter((r) => r.success).length;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <BackButton />
      <h1 className="font-heading text-3xl text-balete mb-2 animate-fade-in">Add photos</h1>
      <p className="text-soft font-sans mb-8 animate-fade-in" style={{ animationDelay: "0.05s" }}>
        Share your moments from the reunion.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <label htmlFor="upload-name" className="block text-sm font-sans text-ink mb-1">
            Your name
          </label>
          <input
            id="upload-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl font-sans text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <label htmlFor="upload-caption" className="block text-sm font-sans text-ink mb-1">
            Caption (optional)
          </label>
          <input
            id="upload-caption"
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's happening in this photo?"
            className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <label className="block text-sm font-sans text-ink mb-1">Photos</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-8 border-2 border-dashed border-rattan/40 rounded-2xl text-soft font-sans text-sm hover:border-hibiscus/50 hover:text-hibiscus hover:bg-hibiscus/5 transition-all duration-200 disabled:opacity-50 group"
          >
            {files ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-5 h-5 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
                {files.length} file(s) selected
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <svg className="w-5 h-5 group-hover:text-hibiscus transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
                Tap to select photos
              </span>
            )}
          </button>
          <p className="text-soft/60 text-xs font-sans mt-1">Max 10MB per image</p>
        </div>

        {preview.length > 0 && (
          <div className="grid grid-cols-3 gap-3 animate-fade-in">
            {preview.map((url, i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden">
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="aspect-square object-cover"
                />
                {results[i] && (
                  <div
                    className={`absolute inset-0 rounded-2xl flex items-center justify-center backdrop-blur-sm ${
                      results[i].success ? "bg-hibiscus/20" : "bg-red-500/30"
                    }`}
                  >
                    {results[i].success ? (
                      <svg className="w-8 h-8 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-red-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="glass-card rounded-2xl p-4 animate-fade-in">
            <div className="flex justify-between text-sm font-sans text-ink mb-2">
              <span>Uploading {successCount + failedCount} of {files?.length}...</span>
              <span className="font-mono tabular-nums">{progress}%</span>
            </div>
            <div className="w-full bg-rattan/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-hibiscus to-mango h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!uploading && failedCount > 0 && successCount > 0 && (
          <div className="glass-card rounded-2xl p-4 font-sans text-sm text-mango animate-fade-in">
            {successCount} uploaded, {failedCount} failed.
          </div>
        )}

        {error && <p className="text-hibiscus text-sm font-sans animate-fade-in">{error}</p>}

        <button
          type="submit"
          disabled={uploading || !files || !name.trim()}
          className="w-full py-3 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans font-medium transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none animate-slide-up"
          style={{ animationDelay: "0.25s" }}
        >
          {uploading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading...
            </span>
          ) : (
            "Upload photos"
          )}
        </button>
      </form>
    </div>
  );
}

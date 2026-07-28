"use client";

import { useState } from "react";
import BackButton from "@/components/ui/BackButton";

interface ImportResult {
  name: string;
  id?: string;
  error?: string;
}

const EXAMPLE_JSON = `[
  {
    "fullName": "Juan Dela Cruz",
    "nickname": "Johnny",
    "generation": 2,
    "branch": "Apor",
    "parentIds": [],
    "spouseId": null,
    "birthOrder": 1,
    "photoUrl": null,
    "livingStatus": "living",
    "notes": ""
  }
]`;

export default function AdminImportPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function handleValidate() {
    setValidationError("");
    setResults(null);
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setValidationError("Input must be a JSON array of member objects.");
        return;
      }
      if (parsed.length === 0) {
        setValidationError("Array must contain at least one member.");
        return;
      }
      for (let i = 0; i < parsed.length; i++) {
        const m = parsed[i];
        if (!m.fullName || typeof m.fullName !== "string") {
          setValidationError(`Member at index ${i} is missing a valid "fullName".`);
          return;
        }
      }
      setToast({ message: `Valid — ${parsed.length} member(s) ready to import.`, type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setValidationError("Invalid JSON. Please check the format and try again.");
    }
  }

  async function handleImport() {
    setValidationError("");
    setResults(null);
    let parsed: Record<string, unknown>[];
    try {
      parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setValidationError("Input must be a JSON array with at least one member.");
        return;
      }
    } catch {
      setValidationError("Invalid JSON. Please check the format and try again.");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/admin/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: parsed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setValidationError(data.error || "Import failed.");
        setImporting(false);
        return;
      }
      const data = await res.json();
      setResults(data.results);
    } catch {
      setValidationError("Something went wrong. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const successCount = results?.filter((r) => !r.error).length ?? 0;
  const failCount = results?.filter((r) => r.error).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl font-sans text-sm backdrop-blur shadow-lg animate-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-balete/15 text-balete border border-balete/20"
              : "bg-hibiscus/15 text-hibiscus border border-hibiscus/20"
          }`}
        >
          {toast.message}
        </div>
      )}

      <BackButton />
      <h1 className="font-heading text-2xl text-balete mb-1">Bulk Import</h1>
      <p className="text-soft font-sans text-sm mb-6">
        Paste a JSON array of family members to add them all at once.
      </p>

      <div className="bg-white border border-rattan/20 rounded-2xl p-6 mb-5 shadow-sm">
        <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-3">
          JSON input
        </label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          rows={12}
          placeholder='[{"fullName": "Juan Dela Cruz", ...}]'
          className="w-full px-4 py-3 bg-rattan/5 border border-rattan/30 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-hibiscus/30 focus:border-hibiscus/50 resize-none transition-colors placeholder:text-soft/30"
        />
        {validationError && (
          <p className="text-hibiscus text-sm font-sans mt-2 flex items-center gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {validationError}
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleValidate}
            disabled={!jsonInput.trim() || importing}
            className="px-5 py-2.5 bg-rattan/10 text-ink rounded-xl font-sans text-sm font-medium hover:bg-rattan/20 transition-colors disabled:opacity-50"
          >
            Validate
          </button>
          <button
            onClick={handleImport}
            disabled={!jsonInput.trim() || importing}
            className="px-5 py-2.5 bg-hibiscus text-parchment rounded-xl font-sans text-sm font-medium hover:bg-hibiscus/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-rattan/20 rounded-2xl p-6 mb-5 shadow-sm">
        <h2 className="font-sans text-xs font-semibold text-soft uppercase tracking-[0.1em] mb-3">
          Example format
        </h2>
        <pre className="bg-rattan/5 border border-rattan/20 rounded-xl p-4 text-xs text-ink/70 font-mono overflow-x-auto whitespace-pre">
          {EXAMPLE_JSON}
        </pre>
      </div>

      {results && (
        <div className="bg-white border border-rattan/20 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-rattan/20 flex items-center justify-between">
            <h2 className="font-sans text-xs font-semibold text-soft uppercase tracking-[0.1em]">Import results</h2>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-balete/10 text-balete rounded-md text-xs font-sans font-medium">{successCount} added</span>
              {failCount > 0 && (
                <span className="px-2 py-0.5 bg-hibiscus/10 text-hibiscus rounded-md text-xs font-sans font-medium">{failCount} failed</span>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-rattan/20 bg-rattan/5">
                  <th className="px-5 py-2.5 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">Name</th>
                  <th className="px-5 py-2.5 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">Status</th>
                  <th className="px-5 py-2.5 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">ID</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-rattan/10 last:border-0 hover:bg-rattan/5 transition-colors">
                    <td className="px-5 py-3 font-sans text-sm text-ink">{r.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-sans font-medium ${
                          r.error
                            ? "bg-hibiscus/10 text-hibiscus"
                            : "bg-balete/10 text-balete"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${r.error ? "bg-hibiscus" : "bg-balete"}`} />
                        {r.error ? "Failed" : "Added"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-soft">{r.id ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

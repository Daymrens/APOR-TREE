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
    <div className="max-w-3xl mx-auto px-4 py-8">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl font-sans text-sm backdrop-blur shadow-lg ${
            toast.type === "success"
              ? "bg-balete/15 text-balete border border-balete/20"
              : "bg-hibiscus/15 text-hibiscus border border-hibiscus/20"
          }`}
        >
          {toast.message}
        </div>
      )}

      <BackButton />
      <h1 className="font-heading text-2xl text-balete mb-2">Bulk import members</h1>
      <p className="text-soft font-sans mb-6 text-sm">
        Paste a JSON array of family members to add them all at once.
      </p>

      <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
        <label className="block text-sm font-sans text-ink mb-2 font-medium">
          JSON input
        </label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          rows={12}
          placeholder='[{"fullName": "Juan Dela Cruz", ...}]'
          className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent resize-none"
        />

        {validationError && (
          <p className="text-hibiscus text-sm font-sans mt-2">{validationError}</p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleValidate}
            disabled={!jsonInput.trim() || importing}
            className="px-5 py-2.5 bg-white border border-rattan text-ink rounded-full font-sans text-sm font-medium hover:bg-white/80 transition-colors disabled:opacity-50"
          >
            Validate
          </button>
          <button
            onClick={handleImport}
            disabled={!jsonInput.trim() || importing}
            className="px-5 py-2.5 bg-hibiscus text-parchment rounded-full font-sans text-sm font-medium hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import"}
          </button>
        </div>
      </div>

      <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl p-6 mb-6">
        <h2 className="font-sans text-sm font-medium text-ink mb-3">
          Example format
        </h2>
        <pre className="bg-balete/5 border border-rattan/30 rounded-xl p-4 text-xs text-ink/80 font-mono overflow-x-auto whitespace-pre">
          {EXAMPLE_JSON}
        </pre>
      </div>

      {results && (
        <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-sans text-sm font-medium text-ink">
              Import results
            </h2>
            <span className="text-xs font-sans text-soft">
              {successCount} succeeded, {failCount} failed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-rattan/30">
                  <th className="px-3 py-2 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-3 py-2 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-3 py-2 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-rattan/20 hover:bg-white/30 transition-colors"
                  >
                    <td className="px-3 py-2 font-sans text-sm text-ink">
                      {r.name}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-sans font-medium ${
                          r.error
                            ? "bg-hibiscus/10 text-hibiscus"
                            : "bg-balete/10 text-balete"
                        }`}
                      >
                        {r.error ? "Failed" : "Added"}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-soft">
                      {r.id ?? "—"}
                    </td>
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

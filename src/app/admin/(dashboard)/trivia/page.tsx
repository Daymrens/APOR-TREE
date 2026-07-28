"use client";

import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/ui/BackButton";
import type { TriviaQuestion } from "@/lib/types";

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

export default function AdminTriviaPage() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<TriviaQuestion | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<TriviaQuestion | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
    },
    []
  );

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/list-trivia");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions ?? []);
      }
    } catch {
      showToast("Failed to load questions", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const form = editing
    ? { ...editing, choices: [...editing.choices] }
    : { question: "", choices: ["", "", "", ""], correctIndex: 0, points: 10, explanation: "" };

  function handleChange(field: string, value: string | number, choiceIndex?: number) {
    setEditing((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      if (field === "choices" && choiceIndex !== undefined) {
        next.choices = [...prev.choices];
        next.choices[choiceIndex] = value as string;
      } else {
        (next as Record<string, unknown>)[field] = value;
      }
      return next;
    });
  }

  function handleAddChoice() {
    setEditing((prev) => {
      if (!prev) return null;
      return { ...prev, choices: [...prev.choices, ""] };
    });
  }

  function handleRemoveChoice(index: number) {
    setEditing((prev) => {
      if (!prev || prev.choices.length <= 2) return prev;
      const next = { ...prev, choices: prev.choices.filter((_, i) => i !== index) };
      if (next.correctIndex >= next.choices.length) next.correctIndex = next.choices.length - 1;
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = editing ? { ...editing, id: editing.id } : form;
      const res = await fetch(editing ? "/api/admin/update-trivia" : "/api/admin/add-trivia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast(editing ? "Question updated" : "Question added", "success");
      setEditing(null);
      setShowAdd(false);
      loadQuestions();
    } catch {
      showToast(editing ? "Failed to update question" : "Failed to add question", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/delete-trivia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleting.id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Question deleted", "success");
      setDeleting(null);
      loadQuestions();
    } catch {
      showToast("Failed to delete question", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <BackButton />
        <div className="mt-4 space-y-3">
          <div className="h-8 w-48 bg-rattan/10 rounded-lg animate-pulse" />
          <div className="h-64 bg-rattan/10 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <BackButton />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl text-balete">Trivia Questions</h1>
          <p className="text-soft font-sans text-sm mt-0.5">
            {questions.length} question{questions.length === 1 ? "" : "s"} • Admin managed
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({
              id: "",
              question: "",
              choices: ["", "", "", ""],
              correctIndex: 0,
              points: 10,
              explanation: "",
            });
            setShowAdd(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-mango text-parchment rounded-xl font-sans text-sm font-medium hover:bg-mango/90 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Question
        </button>
      </div>

      <div className="bg-white border border-rattan/20 rounded-2xl overflow-hidden shadow-sm">
        {questions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-rattan/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-soft/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712a21.194 21.194 0 0 1-6.634 13.15 21.194 21.194 0 0 1-6.634-13.15c1.171-1.025 1.171-2.687 0-3.712Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <p className="text-soft font-sans text-sm">No questions yet. Add your first family trivia question!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-rattan/20 bg-rattan/5">
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Question</th>
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Choices</th>
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Correct</th>
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em]">Points</th>
                  <th className="text-left py-2.5 px-5 text-soft font-medium text-[10px] uppercase tracking-[0.1em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-b border-rattan/10 last:border-0 hover:bg-rattan/5 transition-colors">
                    <td className="py-3 px-5 text-ink font-medium truncate max-w-[300px]">{q.question}</td>
                    <td className="py-3 px-5 text-soft max-w-[200px]">
                      {q.choices.map((c, i) => (
                        <span key={i} className="inline-block mr-2 text-xs px-1.5 py-0.5 rounded bg-rattan/10">
                          {String.fromCharCode(65 + i)}. {c}
                        </span>
                      ))}
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {String.fromCharCode(65 + q.correctIndex)}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-soft font-mono tabular-nums">{q.points}</td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(q)}
                          className="px-3 py-1.5 text-mango hover:bg-mango/10 rounded-lg font-sans text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(q)}
                          className="px-3 py-1.5 text-hibiscus hover:bg-hibiscus/10 rounded-lg font-sans text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showAdd || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-rattan/20 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="font-heading text-lg text-balete">
                {editing?.id ? "Edit Question" : "Add Question"}
              </h2>
              <button
                onClick={() => { setEditing(null); setShowAdd(false); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-soft hover:text-ink hover:bg-rattan/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-sans text-ink mb-1">Question</label>
                <textarea
                  required
                  value={form.question}
                  onChange={(e) => handleChange("question", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-parchment border border-rattan/60 rounded-xl font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-hibiscus/60 transition-colors placeholder:text-soft/40 resize-none"
                  placeholder="e.g., What year was the first Apor reunion?"
                />
              </div>

              <div>
                <label className="block text-sm font-sans text-ink mb-1">Choices (2+)</label>
                <div className="space-y-2">
                  {form.choices.map((choice, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center font-mono text-xs font-bold text-hibiscus bg-hibiscus/10 rounded">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <input
                        required
                        type="text"
                        value={choice}
                        onChange={(e) => handleChange("choices", e.target.value, index)}
                        className="flex-1 px-4 py-3 bg-parchment border border-rattan/60 rounded-xl font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-hibiscus/60 transition-colors placeholder:text-soft/40"
                        placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                      />
                      {form.choices.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChoice(index)}
                          className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-soft/50 hover:text-hibiscus hover:bg-hibiscus/10 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddChoice}
                    className="inline-flex items-center gap-2 text-mango hover:text-mango/80 font-sans text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Choice
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-sans text-ink mb-1">Correct Answer Index</label>
                  <select
                    value={form.correctIndex}
                    onChange={(e) => handleChange("correctIndex", Number(e.target.value))}
                    className="w-full px-4 py-3 bg-parchment border border-rattan/60 rounded-xl font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-hibiscus/60 transition-colors"
                  >
                    {form.choices.map((_, i) => (
                      <option key={i} value={i}>
                        {String.fromCharCode(65 + i)} - {form.choices[i] || "(empty)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-sans text-ink mb-1">Points</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.points}
                    onChange={(e) => handleChange("points", Number(e.target.value))}
                    className="w-full px-4 py-3 bg-parchment border border-rattan/60 rounded-xl font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-hibiscus/60 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-sans text-ink mb-1">Explanation (optional)</label>
                <textarea
                  value={form.explanation}
                  onChange={(e) => handleChange("explanation", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-parchment border border-rattan/60 rounded-xl font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-hibiscus/60 transition-colors placeholder:text-soft/40 resize-none"
                  placeholder="Why is this the correct answer? (shown after answering)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-hibiscus text-parchment rounded-xl font-sans font-medium text-sm hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing?.id ? "Save Changes" : "Add Question"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(null); setShowAdd(false); }}
                  className="px-6 py-3 bg-rattan/10 text-ink rounded-xl font-sans font-medium text-sm hover:bg-rattan/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-hibiscus/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <p className="font-sans text-ink font-medium mb-1">
              Delete <span className="font-semibold">"{deleting.question.slice(0, 30)}..."</span>?
            </p>
            <p className="font-sans text-soft text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 py-3 bg-hibiscus text-parchment rounded-xl font-sans font-medium text-sm hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 py-3 bg-rattan/10 text-ink rounded-xl font-sans font-medium text-sm hover:bg-rattan/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
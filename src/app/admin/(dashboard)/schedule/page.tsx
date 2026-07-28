"use client";

import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/ui/BackButton";

interface ScheduleItem {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  icon: string;
}

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

function ScheduleForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: ScheduleItem | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    day: initial?.day ?? 1,
    startTime: initial?.startTime ?? "",
    endTime: initial?.endTime ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    location: initial?.location ?? "",
    icon: initial?.icon ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  const inputClass =
    "w-full px-4 py-3 bg-parchment border border-rattan/60 rounded-xl font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-hibiscus/60 transition-colors placeholder:text-soft/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-rattan/20 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-heading text-lg text-balete">
            {initial ? "Edit schedule" : "Add schedule item"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-soft hover:text-ink hover:bg-rattan/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-2">Day</label>
              <input
                type="number"
                min={1}
                required
                value={form.day}
                onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-2">Icon</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. 🎉"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-2">Start time</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-2">End time</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-2">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className="block text-xs font-sans font-semibold text-soft uppercase tracking-[0.1em] mb-2">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-hibiscus text-parchment rounded-xl font-sans font-medium text-sm hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : initial ? "Save changes" : "Add item"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-rattan/10 text-ink rounded-xl font-sans font-medium text-sm hover:bg-rattan/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteDialog({
  itemName,
  onConfirm,
  onCancel,
  deleting,
}: {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-hibiscus/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        <p className="font-sans text-ink font-medium mb-1">
          Delete <span className="font-semibold">{itemName}</span>?
        </p>
        <p className="font-sans text-soft text-sm mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 bg-hibiscus text-parchment rounded-xl font-sans font-medium text-sm hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-rattan/10 text-ink rounded-xl font-sans font-medium text-sm hover:bg-rattan/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<ScheduleItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
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

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/list-schedule");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch {
      showToast("Failed to load schedule", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch("/api/admin/update-schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...data }),
        });
        if (!res.ok) throw new Error("Update failed");
        showToast("Schedule item updated", "success");
      } else {
        const res = await fetch("/api/admin/add-schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Add failed");
        showToast("Schedule item added", "success");
      }
      setEditing(null);
      setShowAdd(false);
      await loadItems();
    } catch {
      showToast(editing ? "Failed to update item" : "Failed to add item", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingItem(true);
    try {
      const res = await fetch("/api/admin/delete-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleting.id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Schedule item deleted", "success");
      setDeleting(null);
      await loadItems();
    } catch {
      showToast("Failed to delete item", "error");
    } finally {
      setDeletingItem(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <BackButton />
        <div className="mt-4 space-y-3">
          <div className="h-8 w-48 bg-rattan/10 rounded-lg animate-pulse" />
          <div className="h-64 bg-rattan/10 rounded-2xl animate-pulse mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <BackButton />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl text-balete">Schedule</h1>
          <p className="text-soft font-sans text-sm mt-0.5">
            {items.length} items
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-mango text-parchment rounded-xl font-sans text-sm font-medium hover:bg-mango/90 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add item
        </button>
      </div>

      <div className="bg-white border border-rattan/20 rounded-2xl overflow-hidden shadow-sm">
        {items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-rattan/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-soft/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="text-soft font-sans text-sm">No schedule items yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-rattan/20 bg-rattan/5">
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">Day</th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">Time</th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">Title</th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">Description</th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">Location</th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-rattan/10 last:border-0 hover:bg-rattan/5 transition-colors">
                    <td className="px-5 py-3 font-sans text-sm text-ink">
                      {item.icon ? `${item.icon} ` : ""}Day {item.day}
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-ink tabular-nums">
                      {item.startTime} – {item.endTime}
                    </td>
                    <td className="px-5 py-3 font-sans text-sm font-medium text-ink">
                      {item.title}
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-soft max-w-[200px] truncate">
                      {item.description}
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-ink">
                      {item.location}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(item)}
                          className="px-3 py-1.5 text-mango hover:bg-mango/10 rounded-lg font-sans text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(item)}
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
        <ScheduleForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setShowAdd(false);
          }}
          saving={saving}
        />
      )}

      {deleting && (
        <DeleteDialog
          itemName={deleting.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          deleting={deletingItem}
        />
      )}
    </div>
  );
}

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

const EMPTY_FORM = {
  day: 1,
  startTime: "",
  endTime: "",
  title: "",
  description: "",
  location: "",
  icon: "",
};

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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="font-heading text-xl text-balete mb-4">
          {initial ? "Edit schedule item" : "Add schedule item"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Day</label>
              <input
                type="number"
                min={1}
                required
                value={form.day}
                onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Icon</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. 🎉"
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-sans text-ink mb-1">Start time</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink mb-1">End time</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-hibiscus text-parchment rounded-full font-sans font-medium hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : initial ? "Save changes" : "Add item"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-white border border-rattan text-ink rounded-full font-sans font-medium hover:bg-white/80 transition-colors"
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <p className="font-sans text-ink mb-1">
          Delete <span className="font-semibold">{itemName}</span>?
        </p>
        <p className="font-sans text-soft text-sm mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 bg-hibiscus text-parchment rounded-full font-sans font-medium hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-white border border-rattan text-ink rounded-full font-sans font-medium hover:bg-white/80 transition-colors"
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton />
        <p className="text-soft font-sans text-sm">Loading schedule...</p>
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
      <h1 className="font-heading text-2xl text-balete mb-2">Manage schedule</h1>
      <p className="text-soft font-sans mb-6 text-sm">
        Add, edit, and remove reunion schedule items.
      </p>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2 bg-mango text-parchment rounded-full font-sans text-sm font-medium hover:bg-mango/90 transition-colors"
        >
          + Add item
        </button>
      </div>

      <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-soft font-sans text-sm">
            No schedule items yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-rattan/30">
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Day
                  </th>
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Time
                  </th>
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Title
                  </th>
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Description
                  </th>
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Location
                  </th>
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-rattan/20 hover:bg-white/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-sans text-sm text-ink">
                      {item.icon ? `${item.icon} ` : ""}Day {item.day}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-ink">
                      {item.startTime} – {item.endTime}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm font-medium text-ink">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-soft max-w-[200px] truncate">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-ink">
                      {item.location}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(item)}
                        className="font-sans text-xs text-mango hover:text-mango/80 transition-colors mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(item)}
                        className="font-sans text-xs text-hibiscus hover:text-hibiscus/80 transition-colors"
                      >
                        Delete
                      </button>
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

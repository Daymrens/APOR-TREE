"use client";

import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/ui/BackButton";
import { searchMembers } from "@/lib/firestore/members";
import { useDebounce } from "@/lib/utils";

interface FamilyMember {
  id: string;
  fullName: string;
  nickname: string;
  generation: number;
  branch: string;
  parentIds: string[];
  spouseId: string | null;
  birthOrder: number;
  photoUrl: string | null;
  livingStatus: "living" | "deceased";
  notes: string;
  dateOfBirth?: string;
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

function MemberForm({
  initial,
  branches,
  onSave,
  onCancel,
  saving,
}: {
  initial: FamilyMember | null;
  branches: string[];
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    fullName: initial?.fullName ?? "",
    nickname: initial?.nickname ?? "",
    generation: initial?.generation ?? 0,
    branch: initial?.branch ?? "",
    parentIds: initial?.parentIds?.join(", ") ?? "",
    spouseId: initial?.spouseId ?? "",
    birthOrder: initial?.birthOrder ?? 0,
    livingStatus: (initial?.livingStatus ?? "living") as "living" | "deceased",
    notes: initial?.notes ?? "",
    dateOfBirth: initial?.dateOfBirth ?? "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initial?.photoUrl ?? null
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let photoUrl = initial?.photoUrl ?? null;
    if (photoFile) {
      setUploadingPhoto(true);
      try {
        const fd = new FormData();
        fd.append("file", photoFile);
        fd.append("memberId", initial?.id ?? "new");
        const res = await fetch("/api/admin/upload-photo", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        photoUrl = data.url;
      } catch {
        setUploadingPhoto(false);
        return;
      }
      setUploadingPhoto(false);
    }
    onSave({
      fullName: form.fullName,
      nickname: form.nickname,
      generation: form.generation,
      branch: form.branch,
      parentIds: form.parentIds
        ? form.parentIds.split(",").map((s) => s.trim())
        : [],
      spouseId: form.spouseId || null,
      photoUrl,
      livingStatus: form.livingStatus,
      notes: form.notes,
      birthOrder: form.birthOrder,
      dateOfBirth: form.dateOfBirth || null,
    });
  }

  const inputClass =
    "w-full px-4 py-3 bg-parchment border border-rattan/60 rounded-xl font-sans text-sm text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-hibiscus/60 transition-colors placeholder:text-soft/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-rattan/20 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            {/* Photo preview in header */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-mango/10 border border-rattan/30 flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-5 h-5 text-mango/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
            <div>
              <h2 className="font-heading text-lg text-balete">
                {initial ? "Edit member" : "Add member"}
              </h2>
              {uploadingPhoto && (
                <p className="text-xs text-soft font-sans">Uploading photo...</p>
              )}
            </div>
          </div>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic info */}
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-soft/50 mb-3">Basic info</p>
            <div className="space-y-3">
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className={inputClass}
                placeholder="Full name"
                aria-label="Full name"
              />
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className={inputClass}
                placeholder="Nickname (optional)"
                aria-label="Nickname"
              />
            </div>
          </div>

          {/* Family */}
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-soft/50 mb-3">Family</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  min={0}
                  value={form.generation}
                  onChange={(e) => setForm({ ...form, generation: Number(e.target.value) })}
                  className={inputClass}
                  placeholder="Generation"
                  aria-label="Generation"
                />
              </div>
              <div>
                <input
                  type="number"
                  min={0}
                  value={form.birthOrder}
                  onChange={(e) => setForm({ ...form, birthOrder: Number(e.target.value) })}
                  className={inputClass}
                  placeholder="Birth order"
                  aria-label="Birth order"
                />
              </div>
            </div>
            <div className="mt-3">
              <input
                type="text"
                required
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                list="branch-suggestions"
                className={inputClass}
                placeholder="Branch (e.g. Lolo Pedro's line)"
                aria-label="Branch"
              />
              <datalist id="branch-suggestions">
                {branches.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <input
                type="text"
                value={form.parentIds}
                onChange={(e) => setForm({ ...form, parentIds: e.target.value })}
                className={inputClass}
                placeholder="Parent IDs"
                aria-label="Parent IDs"
              />
              <input
                type="text"
                value={form.spouseId}
                onChange={(e) => setForm({ ...form, spouseId: e.target.value })}
                className={inputClass}
                placeholder="Spouse ID"
                aria-label="Spouse ID"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-soft/50 mb-3">Details</p>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.livingStatus}
                onChange={(e) =>
                  setForm({ ...form, livingStatus: e.target.value as "living" | "deceased" })
                }
                className={inputClass}
                aria-label="Living status"
              >
                <option value="living">Living</option>
                <option value="deceased">Deceased</option>
              </select>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className={inputClass}
                aria-label="Date of birth"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className={`${inputClass} mt-3 resize-none`}
              placeholder="Notes (optional)"
              aria-label="Notes"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="flex-1 py-3 bg-hibiscus text-parchment rounded-xl font-sans font-medium text-sm hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
            >
              {uploadingPhoto
                ? "Uploading..."
                : saving
                  ? "Saving..."
                  : initial
                    ? "Save changes"
                    : "Add member"}
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
  memberName,
  onConfirm,
  onCancel,
  deleting,
}: {
  memberName: string;
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
          Delete <span className="font-semibold">{memberName}</span>?
        </p>
        <p className="font-sans text-soft text-sm mb-6">
          This action cannot be undone.
        </p>
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

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-hibiscus/20 text-ink rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const BRANCH_COLORS = [
  "bg-hibiscus/15 text-hibiscus",
  "bg-mango/15 text-mango",
  "bg-balete/15 text-balete",
  "bg-[#2E6B62]/15 text-[#2E6B62]",
];

function getBranchColor(branch: string) {
  let hash = 0;
  for (let i = 0; i < branch.length; i++) {
    hash = branch.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRANCH_COLORS[Math.abs(hash) % BRANCH_COLORS.length];
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [filterBranch, setFilterBranch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<FamilyMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingMember, setDeletingMember] = useState(false);

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

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/list-members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
        const b = new Set<string>(
          (data.members as FamilyMember[]).map((m) => m.branch)
        );
        setBranches(Array.from(b).sort());
      }
    } catch {
      showToast("Failed to load members", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = searchMembers(members, debouncedSearch);
  const displayed = filterBranch
    ? filteredMembers.filter((m) => m.branch === filterBranch)
    : filteredMembers;

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch("/api/admin/update-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...data }),
        });
        if (!res.ok) throw new Error("Update failed");
        showToast("Member updated", "success");
      } else {
        const res = await fetch("/api/admin/add-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Add failed");
        showToast("Member added", "success");
      }
      setEditing(null);
      setShowAdd(false);
      await loadMembers();
    } catch {
      showToast(editing ? "Failed to update member" : "Failed to add member", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingMember(true);
    try {
      const res = await fetch("/api/admin/delete-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleting.id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Member deleted", "success");
      setDeleting(null);
      await loadMembers();
    } catch {
      showToast("Failed to delete member", "error");
    } finally {
      setDeletingMember(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <BackButton />
        <div className="mt-4 space-y-3">
          <div className="h-8 w-48 bg-rattan/10 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-rattan/10 rounded-lg animate-pulse" />
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

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl text-balete">Members</h1>
          <p className="text-soft font-sans text-sm mt-0.5">
            {displayed.length} of {members.length} members
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-mango text-parchment rounded-xl font-sans text-sm font-medium hover:bg-mango/90 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add member
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-soft/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, nickname, or branch..."
            aria-label="Search members"
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-rattan/40 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-hibiscus/30 focus:border-hibiscus/50 transition-colors placeholder:text-soft/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-soft/40 hover:text-soft transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          className="px-4 py-2.5 bg-white border border-rattan/40 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-hibiscus/30 focus:border-hibiscus/50 transition-colors text-ink"
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-rattan/20 rounded-2xl overflow-hidden shadow-sm">
        {displayed.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-rattan/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-soft/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <p className="text-soft font-sans text-sm">No members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-rattan/20 bg-rattan/5">
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">
                    Name
                  </th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">
                    Branch
                  </th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">
                    Gen
                  </th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">
                    DOB
                  </th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em]">
                    Status
                  </th>
                  <th className="px-5 py-3 font-sans text-[10px] font-semibold text-soft uppercase tracking-[0.1em] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-rattan/10 last:border-0 hover:bg-rattan/5 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-mango/10 border border-rattan/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-sans font-semibold text-mango/60">
                              {getInitials(m.fullName)}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-sans font-medium text-ink text-sm block">
                            {highlightMatch(m.fullName, debouncedSearch)}
                          </span>
                          {m.nickname && (
                            <span className="font-sans text-soft text-xs">
                              {highlightMatch(m.nickname, debouncedSearch)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-sans font-medium ${getBranchColor(m.branch)}`}>
                        {highlightMatch(m.branch, debouncedSearch)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-ink tabular-nums">
                      {m.generation}
                    </td>
                    <td className="px-5 py-3 font-sans text-sm text-soft tabular-nums">
                      {m.dateOfBirth || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-sans font-medium ${
                          m.livingStatus === "living"
                            ? "bg-balete/10 text-balete"
                            : "bg-soft/10 text-soft"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${m.livingStatus === "living" ? "bg-balete" : "bg-soft/40"}`} />
                        {m.livingStatus === "living" ? "Living" : "Deceased"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditing(m)}
                          className="px-3 py-1.5 text-mango hover:bg-mango/10 rounded-lg font-sans text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleting(m)}
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
        <MemberForm
          initial={editing}
          branches={branches}
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
          memberName={deleting.fullName}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          deleting={deletingMember}
        />
      )}
    </div>
  );
}

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
}

const EMPTY_FORM = {
  fullName: "",
  nickname: "",
  generation: 0,
  branch: "",
  parentIds: "",
  spouseId: "",
  birthOrder: 0,
  livingStatus: "living" as "living" | "deceased",
  notes: "",
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
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 className="font-heading text-xl text-balete mb-4">
          {initial ? "Edit member" : "Add member"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-sans text-ink mb-1">
              Full name
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">
              Photo
            </label>
            <div className="flex items-center gap-4">
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border border-rattan"
                />
              )}
              <label className="flex-1 py-3 bg-white border border-rattan rounded-xl font-sans text-sm text-soft cursor-pointer hover:bg-white/80 transition-colors text-center">
                {photoFile ? photoFile.name : "Choose image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-soft mt-1">Max 5MB. JPG, PNG, GIF.</p>
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">
              Nickname
            </label>
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-sans text-ink mb-1">
                Generation
              </label>
              <input
                type="number"
                min={0}
                value={form.generation}
                onChange={(e) =>
                  setForm({ ...form, generation: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-sans text-ink mb-1">
                Birth order
              </label>
              <input
                type="number"
                min={0}
                value={form.birthOrder}
                onChange={(e) =>
                  setForm({ ...form, birthOrder: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">
              Branch
            </label>
            <input
              type="text"
              required
              value={form.branch}
              onChange={(e) => setForm({ ...form, branch: e.target.value })}
              list="branch-suggestions"
              placeholder="e.g. Lolo Pedro's line"
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
            />
            <datalist id="branch-suggestions">
              {branches.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">
              Parent IDs (comma-separated)
            </label>
            <input
              type="text"
              value={form.parentIds}
              onChange={(e) => setForm({ ...form, parentIds: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">
              Spouse ID
            </label>
            <input
              type="text"
              value={form.spouseId}
              onChange={(e) => setForm({ ...form, spouseId: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">
              Status
            </label>
            <select
              value={form.livingStatus}
              onChange={(e) =>
                setForm({
                  ...form,
                  livingStatus: e.target.value as "living" | "deceased",
                })
              }
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
            >
              <option value="living">Living</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-sans text-ink mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-rattan rounded-xl font-sans focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="flex-1 py-3 bg-hibiscus text-parchment rounded-full font-sans font-medium hover:bg-hibiscus/90 transition-colors disabled:opacity-50"
            >
              {uploadingPhoto
                ? "Uploading photo..."
                : saving
                  ? "Saving..."
                  : initial
                    ? "Save changes"
                    : "Add member"}
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <p className="font-sans text-ink mb-1">
          Delete <span className="font-semibold">{memberName}</span>?
        </p>
        <p className="font-sans text-soft text-sm mb-6">
          This action cannot be undone.
        </p>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton />
        <p className="text-soft font-sans text-sm">Loading members...</p>
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
      <h1 className="font-heading text-2xl text-balete mb-2">
        Manage members
      </h1>
<p className="text-soft font-sans mb-6 text-sm">
         View, edit, and remove family members.
       </p>

       <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
         <div className="relative flex-1 w-full sm:w-auto">
           <input
             type="text"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search by name, nickname, or branch..."
             className="w-full px-4 py-2 pl-10 bg-white/50 backdrop-blur border border-rattan rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
           />
           <svg
             className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soft"
             fill="none"
             stroke="currentColor"
             viewBox="0 0 24 24"
           >
             <path
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth={2}
               d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
             />
           </svg>
           {searchQuery && (
             <button
               onClick={() => setSearchQuery("")}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-soft hover:text-ink transition-colors"
             >
               <svg
                 className="w-4 h-4"
                 fill="none"
                 stroke="currentColor"
                 viewBox="0 0 24 24"
               >
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={2}
                   d="M6 18L18 6M6 6l12 12"
                 />
               </svg>
             </button>
           )}
         </div>

         {searchQuery && (
           <span className="font-sans text-xs text-soft">
             {displayed.length} result{displayed.length !== 1 ? "s" : ""} found
           </span>
         )}

         <select
           value={filterBranch}
           onChange={(e) => setFilterBranch(e.target.value)}
           className="px-4 py-2 bg-white/50 backdrop-blur border border-rattan rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-hibiscus focus:border-transparent"
         >
           <option value="">All branches</option>
           {branches.map((b) => (
             <option key={b} value={b}>
               {b}
             </option>
           ))}
         </select>

         <button
           onClick={() => setShowAdd(true)}
           className="px-5 py-2 bg-mango text-parchment rounded-full font-sans text-sm font-medium hover:bg-mango/90 transition-colors"
         >
           + Add member
         </button>
       </div>

      <div className="glass-card bg-white/50 backdrop-blur-xl rounded-2xl overflow-hidden">
        {displayed.length === 0 ? (
          <div className="p-8 text-center text-soft font-sans text-sm">
            No members found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-rattan/30">
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Branch
                  </th>
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Gen
                  </th>
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 font-sans text-xs text-soft font-medium uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-rattan/20 hover:bg-white/30 transition-colors"
                  >
<td className="px-4 py-3">
                       <span className="font-sans font-medium text-ink text-sm">
                         {highlightMatch(m.fullName, debouncedSearch)}
                       </span>
                       {m.nickname && (
                         <span className="font-sans text-soft text-xs ml-1">
                           ({highlightMatch(m.nickname, debouncedSearch)})
                         </span>
                       )}
                     </td>
                     <td className="px-4 py-3 font-sans text-sm text-ink">
                       {highlightMatch(m.branch, debouncedSearch)}
                    </td>
                    <td className="px-4 py-3 font-sans text-sm text-ink">
                      {m.generation}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-sans font-medium ${
                          m.livingStatus === "living"
                            ? "bg-balete/10 text-balete"
                            : "bg-soft/10 text-soft"
                        }`}
                      >
                        {m.livingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(m)}
                        className="font-sans text-xs text-mango hover:text-mango/80 transition-colors mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(m)}
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

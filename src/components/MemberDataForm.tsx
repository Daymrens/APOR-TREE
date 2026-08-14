"use client";

import { useEffect, useState } from "react";
import type { FamilyMember, MemberContributionData } from "@/lib/types";
import { getMembers, searchMembers } from "@/lib/firestore/members";
import { withDerivedBranches } from "@/lib/branches";

export default function MemberDataForm({
  data,
  onChange,
  errors,
}: {
  data: MemberContributionData;
  onChange: (d: MemberContributionData) => void;
  errors: Record<string, string>;
}) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FamilyMember | null>(null);

  useEffect(() => {
    getMembers().then((m) => setMembers(withDerivedBranches(m)));
  }, []);

  const inputClass =
    "w-full input rounded-xl px-3 py-2 text-sm font-sans text-ink placeholder:text-soft/40 focus:outline-none [&>option]:bg-parchment";
  const labelClass = "block text-sm font-sans font-medium text-balete mb-1.5";
  const pillClass = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-sans font-medium transition-all duration-200 ${
      active ? "bg-gradient-to-r from-balete to-[#2E6B62] text-parchment shadow-md" : "card text-ink"
    }`;

  function pickTarget(t: FamilyMember) {
    const byId = new Map(members.map((m) => [m.id, m]));
    const spouseName = t.spouseId ? (byId.get(t.spouseId)?.fullName ?? "") : "";
    const parents = (t.parentIds ?? []).map((id) => byId.get(id)?.fullName).filter(Boolean);
    let parentName = "";
    if (data.relation === "child") parentName = t.fullName + (spouseName ? " & " + spouseName : "");
    else if (data.relation === "sibling") parentName = parents.join(" & ");
    else if (data.relation === "spouse") parentName = t.fullName;
    onChange({ ...data, targetId: t.id, targetName: t.fullName, branch: t.branch, parentName });
    setQ("");
    setSelected(t);
  }

  function clearTarget() {
    onChange({ ...data, targetId: "", targetName: "", branch: "" });
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Relation to existing member</label>
        <div className="flex flex-wrap gap-2">
          {(["child", "sibling", "spouse"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange({ ...data, relation: r })}
              className={pillClass(data.relation === r)}
            >
              {r === "child" ? "Child" : r === "sibling" ? "Sibling" : "Spouse"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <label className={labelClass}>Connect to a family member (optional)</label>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name..."
          className={inputClass}
        />
        {q.trim() && (
          <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto card rounded-xl shadow-lg">
            {searchMembers(members, q)
              .slice(0, 8)
              .map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pickTarget(m)}
                  className="w-full text-left px-3 py-2 text-sm font-sans text-ink hover:bg-parchment/60 flex items-center justify-between gap-2"
                >
                  <span>
                    {m.fullName}
                    {m.nickname ? ` (${m.nickname})` : ""}
                  </span>
                  <span className="text-[10px] font-sans text-soft bg-parchment rounded-full px-2 py-0.5">
                    {m.branch}
                  </span>
                </button>
              ))}
          </div>
        )}
        {selected && (
          <p className="text-xs font-sans text-ink mt-1.5 flex items-center gap-2">
            <span>
              Target: {selected.fullName} (branch {selected.branch})
            </span>
            <button
              type="button"
              onClick={clearTarget}
              className="text-hibiscus hover:text-hibiscus/70"
              aria-label="Clear target"
            >
              ✕
            </button>
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Parents / Root connection</label>
        <input
          type="text"
          value={data.parentName}
          onChange={(e) => onChange({ ...data, parentName: e.target.value })}
          placeholder="e.g. Juan & Maria Apor"
          className={inputClass}
        />
        {errors.parentName && (
          <p className="text-hibiscus text-xs font-sans mt-1">{errors.parentName}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Full name</label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
          placeholder="Full name of the person to add"
          className={inputClass}
        />
        {errors.fullName && (
          <p className="text-hibiscus text-xs font-sans mt-1">{errors.fullName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Sex</label>
          <select
            value={data.sex}
            onChange={(e) => onChange({ ...data, sex: e.target.value as "male" | "female" })}
            className={inputClass}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Date of birth</label>
          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange({ ...data, dateOfBirth: e.target.value })}
            className={inputClass}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Marital status</label>
          <select
            value={data.maritalStatus}
            onChange={(e) =>
              onChange({ ...data, maritalStatus: e.target.value as "married" | "single" })
            }
            className={inputClass}
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={data.livingStatus}
            onChange={(e) =>
              onChange({ ...data, livingStatus: e.target.value as "living" | "deceased" })
            }
            className={inputClass}
          >
            <option value="living">Living</option>
            <option value="deceased">Deceased</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Siblings (optional)</label>
        <input
          type="text"
          value={data.siblings}
          onChange={(e) => onChange({ ...data, siblings: e.target.value })}
          placeholder="e.g. Maria, Jose, Ana"
          className={inputClass}
        />
        <p className="text-soft/40 text-[10px] font-sans mt-1">Comma-separated names</p>
      </div>
    </div>
  );
}

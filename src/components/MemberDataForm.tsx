"use client";

import type { MemberContributionData } from "@/lib/types";

export default function MemberDataForm({
  data,
  onChange,
  errors,
}: {
  data: MemberContributionData;
  onChange: (d: MemberContributionData) => void;
  errors: Record<string, string>;
}) {
  const inputClass =
    "w-full input rounded-xl px-3 py-2 text-sm font-sans text-ink placeholder:text-soft/40 focus:outline-none [&>option]:bg-parchment";
  const labelClass = "block text-sm font-sans font-medium text-balete mb-1.5";

  return (
    <div className="space-y-4">
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

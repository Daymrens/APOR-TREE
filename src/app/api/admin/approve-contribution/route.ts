import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  FieldValue,
  type DocumentReference,
  type Firestore,
} from "firebase-admin/firestore";
import { BRANCH_ORDER, deriveBranch } from "@/lib/branches";
import type { FamilyMember, MemberContributionData } from "@/lib/types";

const COLLECTION = "contributions";
const MEMBERS = "family_members";

const UPDATABLE_FIELDS = [
  "nickname",
  "dateOfBirth",
  "maritalStatus",
  "livingStatus",
  "sex",
  "photoUrl",
  "notes",
  "branch",
  "generation",
  "birthOrder",
  "fullName",
] as const;

// Map field values sent by the static page (public/apor-family.html submitCorrect)
// to family_members document fields.
const FIELD_ALIASES: Record<string, string> = {
  living_status: "livingStatus",
  photo_url: "photoUrl",
  marital_status: "maritalStatus",
  birth_date: "dateOfBirth",
  gender: "sex",
  name: "fullName",
};

type ParentInfo = { id: string; branch: string; generation: number };

type AddMemberResult =
  | { kind: "ok"; memberId: string }
  | { kind: "already" }
  | { kind: "spouse-conflict" }
  | { kind: "unresolved" };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "Invalid request: id is required" }, { status: 400 });
    }
    const db = getAdminDb();
    const contributionRef = db.collection(COLLECTION).doc(body.id);
    const contribution = await contributionRef.get();

    if (!contribution.exists) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    const doc = contribution.data();

    if (doc?.type === "correction" && doc.data) {
      return applyCorrection(db, contributionRef, doc.data);
    }

    // Add-member contributions create a real family_members doc on approval.
    if (doc?.type === "add_member" && doc.data && !doc.approvedMemberId) {
      return applyAddMember(db, contributionRef, doc);
    }

    await contributionRef.update({ status: "approved" });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if ((err as { code?: unknown })?.code === 4 || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(msg)) {
      return NextResponse.json({ error: "Firestore quota exceeded. Try again after the daily reset." }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function applyCorrection(
  db: Firestore,
  contributionRef: DocumentReference,
  data: Record<string, unknown>
) {
  const rawField = typeof data.field === "string" ? data.field : "";
  const field = FIELD_ALIASES[rawField] ?? rawField;
  const correctedValue = data.correctedValue;
  const targetId =
    typeof data.targetId === "string"
      ? data.targetId
      : typeof data.personId === "string"
        ? data.personId
        : "";
  const targetName =
    typeof data.targetName === "string"
      ? data.targetName
      : typeof data.personName === "string"
        ? data.personName
        : "";

  const acknowledge = async () => {
    await contributionRef.update({ status: "approved" });
    return NextResponse.json({ success: true, applied: false, reason: "no-field" });
  };

  if (!field || (!targetId && !targetName)) {
    return acknowledge();
  }
  if (!(UPDATABLE_FIELDS as readonly string[]).includes(field)) {
    return NextResponse.json({ error: `Field "${field}" is not updatable` }, { status: 400 });
  }

  let memberRef = db.collection(MEMBERS).doc(targetId);
  if (!targetId) {
    const members = await fetchMembers(db);
    const byName = findMemberByFullName(members, targetName);
    if (!byName) return acknowledge();
    memberRef = db.collection(MEMBERS).doc(byName.id);
  }

  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) {
    return acknowledge();
  }

  const validated = validateCorrectionValue(field, correctedValue);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  let newFullName = validated.value as string;
  if (rawField === "name" && typeof validated.value === "string") {
    const trimmed = validated.value.trim();
    const existing = String(memberSnap.data()?.fullName ?? "").trim();
    if (!trimmed.includes(" ") && existing.includes(" ")) {
      newFullName = trimmed + existing.slice(existing.indexOf(" "));
    } else {
      newFullName = trimmed;
    }
  }

  await memberRef.update({ [field]: newFullName });
  await contributionRef.update({ status: "approved" });
  return NextResponse.json({ success: true, applied: true, memberId: memberRef.id });
}

function validateCorrectionValue(
  field: string,
  value: unknown
): { error: string } | { value: unknown } {
  switch (field) {
    case "generation":
    case "birthOrder": {
      const n = Number(value);
      if (!isFinite(n)) return { error: `${field} must be a number` };
      return { value: n };
    }
    case "branch":
      if (
        typeof value !== "string" ||
        (!BRANCH_ORDER.includes(value) && value !== "Unassigned")
      ) {
        return { error: "branch must be a known family branch or Unassigned" };
      }
      return { value };
    case "livingStatus":
      if (value !== "living" && value !== "deceased") {
        return { error: "livingStatus must be 'living' or 'deceased'" };
      }
      return { value };
    case "maritalStatus":
      if (value !== "married" && value !== "single") {
        return { error: "maritalStatus must be 'married' or 'single'" };
      }
      return { value };
    case "sex":
      if (value !== "male" && value !== "female" && value !== "") {
        return { error: "sex must be 'male' or 'female'" };
      }
      return { value };
    case "fullName":
      if (typeof value !== "string" || !value.trim()) {
        return { error: "fullName must be a non-empty string" };
      }
      return { value };
    default:
      if (typeof value !== "string") {
        return { error: `${field} must be a string` };
      }
      return { value };
  }
}

async function applyAddMember(
  db: Firestore,
  contributionRef: DocumentReference,
  doc: Record<string, unknown>
) {
  const memberData = doc.data as MemberContributionData;

  if (
    typeof memberData.fullName !== "string" ||
    !memberData.fullName.trim()
  ) {
    return NextResponse.json(
      { error: "Invalid contribution data: fullName is required" },
      { status: 400 }
    );
  }

  const parentName =
    typeof memberData.parentName === "string" ? memberData.parentName : "";
  const extra = memberData as MemberContributionData & {
    branch?: unknown;
    targetId?: unknown;
    targetName?: unknown;
    relation?: unknown;
  };
  const relation = typeof extra.relation === "string" ? extra.relation : "";

  const result = await db.runTransaction(async (transaction) => {
    const current = await transaction.get(contributionRef);
    if (!current.exists || current.data()?.approvedMemberId) {
      return { kind: "already" } as const;
    }

    const membersSnap = await transaction.get(db.collection(MEMBERS));
    const members = membersSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as FamilyMember[];
    const byId = new Map(members.map((m) => [m.id, m]));

    let target: FamilyMember | null = null;
    if (typeof extra.targetId === "string" && byId.has(extra.targetId)) {
      target = byId.get(extra.targetId) ?? null;
    } else if (typeof extra.targetName === "string") {
      const byName = findMemberByFullName(members, extra.targetName);
      if (byName) target = byId.get(byName.id) ?? null;
    }

    const parent = findParent(members, parentName);

    // Do not overwrite an existing spouse link.
    if (target && relation === "spouse" && target.spouseId) {
      return { kind: "spouse-conflict" } as const;
    }

    // Relation-based submissions need a resolvable target; a silent
    // Gen-0/Unassigned orphan is a data-integrity bug.
    if (
      (relation === "child" || relation === "sibling" || relation === "spouse") &&
      !target &&
      !parent
    ) {
      return { kind: "unresolved" } as const;
    }

    let parentIds: string[] = [];
    let spouseId: string | null = null;
    let generation: number;

    if (target && relation === "child") {
      parentIds = [target.id];
      if (target.spouseId) parentIds.push(target.spouseId);
      generation = (target.generation ?? 0) + 1;
    } else if (target && relation === "sibling") {
      parentIds = target.parentIds ?? [];
      generation = target.generation ?? 0;
    } else if (target && relation === "spouse") {
      spouseId = target.id;
      generation = target.generation ?? 0;
    } else if (parent) {
      parentIds = [parent.id];
      generation = parent.generation + 1;
    } else {
      generation = 0;
    }

    const submittedBranch =
      typeof extra.branch === "string" && BRANCH_ORDER.includes(extra.branch)
        ? extra.branch
        : null;
    const derivedBranch = target ? deriveBranch(target, byId) : null;
    const parentMember = parent ? byId.get(parent.id) ?? null : null;
    const branch =
      submittedBranch ??
      derivedBranch ??
      (parentMember ? deriveBranch(parentMember, byId) : "Unassigned");

    // Idempotent: if a member with this exact name already exists, link it
    // instead of creating a duplicate.
    const existing = findMemberByFullName(members, memberData.fullName);
    let memberId = existing?.id ?? null;

    if (!memberId) {
      const newRef = db.collection(MEMBERS).doc();
      transaction.set(
        newRef,
        buildMember(memberData, parentIds, spouseId, branch, generation)
      );
      memberId = newRef.id;
    }

    if (spouseId) {
      transaction.update(db.collection(MEMBERS).doc(memberId), { spouseId });
      transaction.update(db.collection(MEMBERS).doc(spouseId), { spouseId: memberId });
    }

    transaction.update(contributionRef, {
      status: "approved",
      approvedMemberId: memberId,
      approvedAt: FieldValue.serverTimestamp(),
    });

    return { kind: "ok", memberId } as const;
  });

  if (result.kind === "already") {
    return NextResponse.json({ error: "Contribution already approved" }, { status: 400 });
  }
  if (result.kind === "spouse-conflict") {
    return NextResponse.json({ error: "Target already has a spouse" }, { status: 409 });
  }
  if (result.kind === "unresolved") {
    return NextResponse.json(
      { error: "Could not resolve the target member for this relation" },
      { status: 400 }
    );
  }
  return NextResponse.json({ success: true, memberId: result.memberId });
}

async function fetchMembers(db: Firestore) {
  const snapshot = await db.collection(MEMBERS).get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function findMemberByFullName(
  members: ReadonlyArray<{ id: string; fullName?: unknown }>,
  fullName: string
): { id: string } | null {
  const q = fullName.trim().toLowerCase();
  if (!q) return null;
  const match = members.find((m) => String(m.fullName ?? "").toLowerCase() === q);
  return match ? { id: String(match.id) } : null;
}

function findParent(
  members: ReadonlyArray<{
    id: string;
    fullName?: unknown;
    nickname?: unknown;
    branch?: unknown;
    generation?: unknown;
  }>,
  parentName: string
): ParentInfo | null {
  const q = parentName.trim().toLowerCase();
  if (!q) return null;
  const match = members.find(
    (m) =>
      String(m.fullName ?? "").toLowerCase() === q ||
      String(m.nickname ?? "").toLowerCase() === q
  );
  if (!match) return null;
  return {
    id: String(match.id),
    branch: String(match.branch ?? "Unassigned"),
    generation: typeof match.generation === "number" ? match.generation : 0,
  };
}

function buildMember(
  d: MemberContributionData,
  parentIds: string[],
  spouseId: string | null,
  branch: string,
  generation: number
) {
  const firstName = d.fullName.trim().split(/\s+/)[0] || d.fullName.trim();

  const member: Record<string, unknown> = {
    fullName: d.fullName.trim(),
    nickname: firstName,
    dateOfBirth: d.dateOfBirth || "",
    livingStatus: d.livingStatus,
    sex: d.sex,
    maritalStatus: d.maritalStatus,
    birthOrder: 0,
    photoUrl: null,
    spouseId,
    notes: d.siblings ? `Siblings: ${d.siblings}` : "",
    parentIds,
    branch,
    generation,
  };

  return member;
}
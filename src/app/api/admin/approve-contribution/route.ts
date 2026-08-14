import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { BRANCH_ORDER, deriveBranch } from "@/lib/branches";
import type { FamilyMember, MemberContributionData } from "@/lib/types";

const COLLECTION = "contributions";
const MEMBERS = "family_members";

type ParentInfo = { id: string; branch: string; generation: number };

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

    // Add-member contributions create a real family_members doc on approval.
    if (doc?.type === "add_member" && doc.data && !doc.approvedMemberId) {
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
      const members = await fetchMembers(db);

      const byId = new Map(
        (members as FamilyMember[]).map((m) => [m.id, m])
      );

      const extra = memberData as MemberContributionData & {
        branch?: unknown;
        targetId?: unknown;
        targetName?: unknown;
        relation?: unknown;
      };

      let target: FamilyMember | null = null;
      if (typeof extra.targetId === "string" && byId.has(extra.targetId)) {
        target = byId.get(extra.targetId) ?? null;
      } else if (typeof extra.targetName === "string") {
        const byName = findMemberByFullName(members, extra.targetName);
        if (byName) target = byId.get(byName.id) ?? null;
      }

      const parent = findParent(members, parentName);

      const submittedBranch =
        typeof extra.branch === "string" && BRANCH_ORDER.includes(extra.branch)
          ? extra.branch
          : null;
      const derivedBranch = target ? deriveBranch(target, byId) : null;
      const branch =
        submittedBranch ?? derivedBranch ?? (parent ? parent.branch : "Unassigned");

      const relation = typeof extra.relation === "string" ? extra.relation : "";
      let generation: number;
      if (target && relation === "child") generation = (target.generation ?? 0) + 1;
      else if (target && (relation === "sibling" || relation === "spouse"))
        generation = target.generation ?? 0;
      else if (parent) generation = parent.generation + 1;
      else generation = 0;

      // Idempotent: if a member with this exact name already exists, link it
      // instead of creating a duplicate.
      const existing = findMemberByFullName(members, memberData.fullName);
      let memberId: string | null = existing?.id ?? null;

      if (!memberId) {
        const created = await db
          .collection(MEMBERS)
          .add(buildMember(memberData, parent, branch, generation));
        memberId = created.id;
      }

      await contributionRef.update({
        status: "approved",
        approvedMemberId: memberId,
        approvedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, memberId });
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

async function fetchMembers(db: Firestore) {
  const snapshot = await db.collection(MEMBERS).get();
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

function findMemberByFullName(
  members: Array<Record<string, unknown>>,
  fullName: string
): { id: string } | null {
  const q = fullName.trim().toLowerCase();
  if (!q) return null;
  const match = members.find((m) => String(m.fullName ?? "").toLowerCase() === q);
  return match ? { id: String(match.id) } : null;
}

function findParent(
  members: Array<Record<string, unknown>>,
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
  parent: ParentInfo | null,
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
    spouseId: null,
    notes: d.siblings ? `Siblings: ${d.siblings}` : "",
    parentIds: parent ? [parent.id] : [],
    branch,
    generation,
  };

  return member;
}

import type { FamilyMember } from "@/lib/types";

export const SIBLING_BRANCHES: Record<string, string> = {
  "panfilo-apor": "Panfilo",
  "feliciano": "Feliciano",
  "pedro-lumbab": "Pedro",
  "pablo-apor": "Pablo",
  "purificasion-apor": "Purificasion",
  "consorcia-apor": "Consorcia",
};

export const BRANCH_ORDER = ["Panfilo", "Feliciano", "Pedro", "Pablo", "Purificasion", "Consorcia"];

export function deriveBranch(m: FamilyMember, byId: Map<string, FamilyMember>): string {
  return deriveBranchInner(m, byId, new Set());
}

function deriveBranchInner(m: FamilyMember, byId: Map<string, FamilyMember>, seen: Set<string>): string {
  if (SIBLING_BRANCHES[m.id]) return SIBLING_BRANCHES[m.id];
  if (seen.has(m.id)) return "Unassigned";
  seen.add(m.id);
  let cur = m;
  while (cur && cur.parentIds && cur.parentIds.length) {
    const pid = cur.parentIds[0];
    if (SIBLING_BRANCHES[pid]) return SIBLING_BRANCHES[pid];
    if (pid === "jose-apor" || pid === "antonio-apor" || pid === "rosa-apor") return "Pedro";
    const parent = byId.get(pid);
    if (!parent) return pid.toLowerCase().startsWith("pedro") ? "Pedro" : "Unassigned";
    cur = parent;
    if (seen.has(cur.id)) return "Unassigned";
    seen.add(cur.id);
  }
  if (m.spouseId) {
    const sp = byId.get(m.spouseId);
    if (sp) return deriveBranchInner(sp, byId, seen);
  }
  return "Unassigned";
}

export function withDerivedBranches(members: FamilyMember[]): FamilyMember[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  return members.map((m) => ({ ...m, branch: deriveBranch(m, byId) }));
}

export const BRANCH_COLORS: Record<string, string> = {
  Panfilo: "#2f6df6",
  Feliciano: "#16b364",
  Pedro: "#e8a63d",
  Pablo: "#6366f1",
  Purificasion: "#8b5cf6",
  Consorcia: "#ef4565",
  Unassigned: "#94a3b8",
};

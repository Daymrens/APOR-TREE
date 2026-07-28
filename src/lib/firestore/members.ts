import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import type { FamilyMember } from "@/lib/types";

const COLLECTION = "family_members";

export async function getMembers(): Promise<FamilyMember[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FamilyMember[];
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("Firestore not available:", error);
    return [];
  }
}

export async function getBranches(): Promise<string[]> {
  const members = await getMembers();
  const branches = new Set(members.map((m) => m.branch));
  return Array.from(branches).sort();
}

export async function getMembersByBranch(
  branch: string
): Promise<FamilyMember[]> {
  const q = query(collection(db, COLLECTION), where("branch", "==", branch));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as FamilyMember[];
}

export async function addMember(
  data: Omit<FamilyMember, "id">
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), data);
  return docRef.id;
}

export async function updateMember(
  id: string,
  data: Partial<Omit<FamilyMember, "id">>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteMember(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export function searchMembers(
  members: FamilyMember[],
  query: string
): FamilyMember[] {
  if (!query.trim()) return members;
  const q = query.toLowerCase();
  return members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(q) ||
      m.nickname.toLowerCase().includes(q) ||
      m.branch.toLowerCase().includes(q)
  );
}

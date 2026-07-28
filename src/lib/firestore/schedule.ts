import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import type { ScheduleItem } from "@/lib/types";

const COLLECTION = "schedule_items";

export async function getSchedule(): Promise<ScheduleItem[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy("day"), orderBy("startTime"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ScheduleItem[];
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("Firestore not available:", error);
    return [];
  }
}

export async function addScheduleItem(data: Omit<ScheduleItem, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), data);
  return docRef.id;
}

export async function updateScheduleItem(id: string, data: Partial<Omit<ScheduleItem, "id">>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteScheduleItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
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
    console.warn("Firestore not available:", error);
    return [];
  }
}

import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type { Rsvp } from "@/lib/types";

const COLLECTION = "rsvps";

export function subscribeToRsvps(
  callback: (rsvps: Rsvp[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(collection(db, COLLECTION), orderBy("submittedAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const rsvps = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Rsvp[];
        callback(rsvps);
      },
      (error) => {
        console.warn("Firestore rsvps subscription error:", error.message);
        onError?.(error);
      }
    );
  } catch (error) {
    console.warn("Firestore not available:", error);
    return () => {};
  }
}

export async function addRsvp(
  data: Omit<Rsvp, "id" | "submittedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    submittedAt: Timestamp.now(),
  });
  return docRef.id;
}

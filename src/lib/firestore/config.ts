import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { ReunionConfig } from "@/lib/types";

const DOC_ID = "main";

export async function getConfig(): Promise<ReunionConfig | null> {
  try {
    const snap = await getDoc(doc(db, "reunion_config", DOC_ID));
    if (!snap.exists()) return null;
    return snap.data() as ReunionConfig;
  } catch (error) {
    console.warn("Firestore not available:", error);
    return null;
  }
}

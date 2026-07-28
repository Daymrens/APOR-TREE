import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import type { GalleryPhoto } from "@/lib/types";

const COLLECTION = "gallery_photos";

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as GalleryPhoto[];
  } catch (error) {
    console.warn("Firestore not available:", error);
    return [];
  }
}

export async function approvePhoto(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { approved: true });
}

export async function deletePhoto(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

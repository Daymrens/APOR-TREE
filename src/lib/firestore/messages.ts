import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  limit,
} from "firebase/firestore";
import type { ChatMessage } from "@/lib/types";

const COLLECTION = "chat_messages";

export function subscribeToMessages(
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as ChatMessage)
      .reverse();
    callback(messages);
  });
}

export async function sendMessage(
  data: Omit<ChatMessage, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

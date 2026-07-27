import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import type { TriviaQuestion, TriviaScore } from "@/lib/types";

const QUESTIONS_COLLECTION = "trivia_questions";
const SCORES_COLLECTION = "trivia_scores";

export async function getTriviaQuestions(): Promise<TriviaQuestion[]> {
  try {
    const snapshot = await getDocs(collection(db, QUESTIONS_COLLECTION));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TriviaQuestion[];
  } catch (error) {
    console.warn("Firestore not available:", error);
    return [];
  }
}

export async function submitTriviaScore(
  data: Omit<TriviaScore, "id" | "completedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, SCORES_COLLECTION), {
    ...data,
    completedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getTopScores(count: number = 10): Promise<TriviaScore[]> {
  try {
    const q = query(
      collection(db, SCORES_COLLECTION),
      orderBy("score", "desc"),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TriviaScore[];
  } catch (error) {
    console.warn("Firestore not available:", error);
    return [];
  }
}

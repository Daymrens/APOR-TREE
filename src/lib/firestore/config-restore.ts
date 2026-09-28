import { Timestamp } from "firebase/firestore";
import type { ReunionConfig } from "@/lib/types";

function restoreTimestamp(value: unknown): Timestamp | null {
  if (!value || typeof value !== "object") return null;
  const { seconds, nanoseconds } = value as { seconds?: number; nanoseconds?: number };
  if (typeof seconds !== "number") return null;
  return new Timestamp(seconds, nanoseconds ?? 0);
}

export function restoreConfig(raw: ReunionConfig | null): ReunionConfig | null {
  if (!raw) return null;
  const dates = raw.eventDates;
  return {
    ...raw,
    eventDates: {
      start: restoreTimestamp(dates?.start),
      end: restoreTimestamp(dates?.end),
    },
  };
}
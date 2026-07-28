import { Timestamp } from "firebase/firestore";

export interface ReunionConfig {
  familyName: string;
  eventTitle: string;
  eventDates: { start: Timestamp; end: Timestamp };
  venueName: string;
  venueAddress: string;
  mapEmbedUrl: string;
  contactPerson: string;
  contactNumber: string;
  parkingNotes: string;
  coverImageUrl: string;
  passcodeHash: string;
  adminPasscodeHash: string;
}

export interface Rsvp {
  id: string;
  familyBranch: string;
  respondentName: string;
  attending: "yes" | "no" | "maybe";
  guestCount: number;
  guestNames: string[];
  dietaryNotes: string;
  contactNumber: string;
  submittedAt: Timestamp;
}

export interface FamilyMember {
  id: string;
  fullName: string;
  nickname: string;
  generation: number;
  branch: string;
  parentIds: string[];
  spouseId: string | null;
  birthOrder: number;
  photoUrl: string | null;
  livingStatus: "living" | "deceased";
  notes: string;
}

export interface ScheduleItem {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  icon: string;
}

export interface GalleryPhoto {
  id: string;
  storageUrl: string;
  thumbnailUrl: string;
  uploaderName: string;
  caption: string;
  uploadedAt: Timestamp;
  approved: boolean;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  points: number;
  explanation: string;
}

export interface TriviaScore {
  id: string;
  playerName: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  completedAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  authorName: string;
  authorBranch: string | null;
  content: string;
  createdAt: Timestamp;
}

export interface Contribution {
  id: string;
  authorName: string;
  authorBranch: string | null;
  type: "correction" | "suggestion" | "addition";
  category: "schedule" | "venue" | "food" | "activities" | "general";
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
}

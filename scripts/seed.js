const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyA22I2BYO7VKjUnYUxV9QyOtWAsPWzw2vc",
  authDomain: "apor-tree.firebaseapp.com",
  projectId: "apor-tree",
  storageBucket: "apor-tree.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const members = [
  {
    fullName: "Pedro Apor",
    nickname: "Lolo Pedro",
    generation: 0,
    branch: "Apor",
    parentIds: [],
    spouseId: null,
    birthOrder: 0,
    photoUrl: null,
    livingStatus: "deceased",
    notes: "Patriarch of the Apor family.",
  },
  {
    fullName: "Maria Apor",
    nickname: "Lola Maria",
    generation: 0,
    branch: "Apor",
    parentIds: [],
    spouseId: null,
    birthOrder: 1,
    photoUrl: null,
    livingStatus: "deceased",
    notes: "Matriarch of the Apor family.",
  },
  {
    fullName: "Jose Apor",
    nickname: "Tito Jose",
    generation: 1,
    branch: "Jose",
    parentIds: [],
    spouseId: null,
    birthOrder: 0,
    photoUrl: null,
    livingStatus: "living",
    notes: "Eldest child.",
  },
  {
    fullName: "Rosa Apor",
    nickname: "Tita Rosa",
    generation: 1,
    branch: "Rosa",
    parentIds: [],
    spouseId: null,
    birthOrder: 1,
    photoUrl: null,
    livingStatus: "living",
    notes: "Second child.",
  },
  {
    fullName: "Antonio Apor",
    nickname: "Tito Tony",
    generation: 1,
    branch: "Antonio",
    parentIds: [],
    spouseId: null,
    birthOrder: 2,
    photoUrl: null,
    livingStatus: "living",
    notes: "Third child.",
  },
  {
    fullName: "Carlos Apor",
    nickname: "Kuya Carlos",
    generation: 2,
    branch: "Jose",
    parentIds: [],
    spouseId: null,
    birthOrder: 0,
    photoUrl: null,
    livingStatus: "living",
    notes: "Son of Tito Jose.",
  },
  {
    fullName: "Ana Apor",
    nickname: "Ana",
    generation: 2,
    branch: "Jose",
    parentIds: [],
    spouseId: null,
    birthOrder: 1,
    photoUrl: null,
    livingStatus: "living",
    notes: "Daughter of Tito Jose.",
  },
  {
    fullName: "Miguel Apor",
    nickname: "Miguel",
    generation: 2,
    branch: "Rosa",
    parentIds: [],
    spouseId: null,
    birthOrder: 0,
    photoUrl: null,
    livingStatus: "living",
    notes: "Son of Tita Rosa.",
  },
  {
    fullName: "Sofia Apor",
    nickname: "Sofia",
    generation: 2,
    branch: "Antonio",
    parentIds: [],
    spouseId: null,
    birthOrder: 0,
    photoUrl: null,
    livingStatus: "living",
    notes: "Daughter of Tito Tony.",
  },
  {
    fullName: "Diego Apor",
    nickname: "Diego",
    generation: 2,
    branch: "Antonio",
    parentIds: [],
    spouseId: null,
    birthOrder: 1,
    photoUrl: null,
    livingStatus: "living",
    notes: "Son of Tito Tony.",
  },
  {
    fullName: "Isabella Apor",
    nickname: "Bella",
    generation: 3,
    branch: "Jose",
    parentIds: [],
    spouseId: null,
    birthOrder: 0,
    photoUrl: null,
    livingStatus: "living",
    notes: "Granddaughter of Tito Jose.",
  },
  {
    fullName: "Lucas Apor",
    nickname: "Lucas",
    generation: 3,
    branch: "Antonio",
    parentIds: [],
    spouseId: null,
    birthOrder: 0,
    photoUrl: null,
    livingStatus: "living",
    notes: "Grandson of Tito Tony.",
  },
];

const scheduleItems = [
  {
    day: 1,
    startTime: "08:00",
    endTime: "09:00",
    title: "Registration & Breakfast",
    description: "Sign in and grab some merienda.",
    location: "Main hall",
    icon: "food",
  },
  {
    day: 1,
    startTime: "09:00",
    endTime: "10:30",
    title: "Family trivia",
    description: "Test how well you know the Apor family!",
    location: "Main hall",
    icon: "game",
  },
  {
    day: 1,
    startTime: "11:00",
    endTime: "12:00",
    title: "Family photo session",
    description: "Group photos by branch.",
    location: "Garden",
    icon: "photo",
  },
  {
    day: 1,
    startTime: "12:00",
    endTime: "14:00",
    title: "Lunch & fellowship",
    description: "Eat, share stories, reconnect.",
    location: "Main hall",
    icon: "food",
  },
  {
    day: 1,
    startTime: "14:00",
    endTime: "16:00",
    title: "Games & activities",
    description: "Parlor games for all ages.",
    location: "Courtyard",
    icon: "game",
  },
];

async function seed() {
  console.log("Seeding family members...");
  for (const member of members) {
    try {
      const docRef = await addDoc(collection(db, "family_members"), member);
      console.log(`  Added: ${member.fullName} (${docRef.id})`);
    } catch (err) {
      console.error(`  Failed: ${member.fullName} - ${err.message}`);
    }
  }

  console.log("\nSeeding schedule...");
  for (const item of scheduleItems) {
    try {
      const docRef = await addDoc(collection(db, "schedule_items"), item);
      console.log(`  Added: ${item.title} (${docRef.id})`);
    } catch (err) {
      console.error(`  Failed: ${item.title} - ${err.message}`);
    }
  }

  console.log("\nDone!");
}

seed().catch(console.error);

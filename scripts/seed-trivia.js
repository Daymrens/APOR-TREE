const admin = require("firebase-admin");

// Initialize with same credentials as seed.js
const serviceAccount = require("../apor-tree-firebase-adminsdk-fbsvc-4637260027.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const questions = [
  {
    question: "What is the family surname?",
    choices: ["Apor", "Santos", "Cruz", "Reyes"],
    correctIndex: 0,
    points: 10,
  },
  {
    question: "How many main branches does the Apor family tree have?",
    choices: ["2", "3", "4", "5"],
    correctIndex: 2,
    points: 10,
  },
  {
    question: "What is the family reunion passcode?",
    choices: ["APOR", "FAMILY", "REUNION", "2024"],
    correctIndex: 0,
    points: 10,
  },
  {
    question: "What does 'Apor' mean in the context of this family?",
    choices: ["A nickname", "A place", "A family name", "A tradition"],
    correctIndex: 2,
    points: 10,
  },
  {
    question: "What generation does the root ancestor belong to?",
    choices: ["Generation 0", "Generation 1", "Generation 2", "Generation 3"],
    correctIndex: 0,
    points: 10,
  },
  {
    question: "What color represents the Apor branch in the family tree?",
    choices: ["Hibiscus (pink)", "Mango (gold)", "Balete (dark green)", "Rattan (tan)"],
    correctIndex: 2,
    points: 10,
  },
  {
    question: "What feature allows family members to identify themselves?",
    choices: ["Fingerprint scan", "Passcode gate", "Voice recognition", "Face ID"],
    correctIndex: 1,
    points: 10,
  },
  {
    question: "What can family members do on the RSVP page?",
    choices: ["Upload photos", "Confirm attendance", "Play games", "Edit the family tree"],
    correctIndex: 1,
    points: 10,
  },
  {
    question: "What is the name of the reunion web app?",
    choices: ["Apor Connect", "Family Reunion", "Ugnayan", "Pamilya"],
    correctIndex: 2,
    points: 10,
  },
  {
    question: "What feature lets family members chat in real-time?",
    choices: ["Email", "SMS", "Message Board", "Phone call"],
    correctIndex: 2,
    points: 10,
  },
];

async function seedTrivia() {
  const batch = db.batch();

  for (const q of questions) {
    const ref = db.collection("trivia_questions").doc();
    batch.set(ref, q);
  }

  await batch.commit();
  console.log(`Seeded ${questions.length} trivia questions`);
  process.exit(0);
}

seedTrivia().catch((err) => {
  console.error("Error seeding trivia:", err);
  process.exit(1);
});

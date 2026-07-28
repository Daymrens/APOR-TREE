const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.resolve(
  __dirname,
  "../apor-tree-firebase-adminsdk-fbsvc-e4eb2dd34f.json"
);

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch {
  console.error(
    "Service account JSON not found. Place the Firebase admin SDK JSON in the project root."
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const DEFAULT_CONFIG = {
  eventName: "APOR Family Reunion",
  eventDates: {
    start: null,
    end: null,
  },
  venueName: "",
  venueAddress: "",
  mapEmbedUrl: "",
  contactPerson: "",
  contactNumber: "",
  parkingNotes: "",
  coverImageUrl: "",
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function seed() {
  const docRef = db.collection("reunion_config").doc("main");
  const snap = await docRef.get();

  if (snap.exists) {
    console.log("reunion_config/main already exists:");
    console.log(JSON.stringify(snap.data(), null, 2));
    console.log("\nUpdating with any missing fields...");
    await docRef.set(DEFAULT_CONFIG, { merge: true });
    console.log("Updated.");
  } else {
    console.log("Creating reunion_config/main...");
    await docRef.set(DEFAULT_CONFIG);
    console.log("Created.");
  }

  console.log("\nDone!");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});

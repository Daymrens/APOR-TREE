// Admin-SDK seeder. Firestore rules block all client writes to family_members
// (allow write: if false) — writes must go through the Admin SDK, which
// bypasses security rules. Reuses the exact `members` literal from
// seed-roots.js (same extraction as validate-roots.js) so there is a single
// source of truth for the data.
const fs = require("fs");
const path = require("path");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require(path.join(
  __dirname,
  "..",
  "apor-tree-firebase-adminsdk-fbsvc-e4eb2dd34f.json"
));

// Extract the members array literal from seed-roots.js.
const src = fs.readFileSync(path.join(__dirname, "seed-roots.js"), "utf8");
const start = src.indexOf("const members = [");
const end = src.indexOf("\n];", start);
if (start === -1 || end === -1) {
  console.error("Could not locate members array in seed-roots.js.");
  process.exit(1);
}
const arrayText = src.slice(src.indexOf("[", start), end + 2);
// Pure literal (strings, numbers, null, arrays) — safe to eval.
const members = eval(arrayText);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seed() {
  console.log(`Seeding ${members.length} family members via Admin SDK...\n`);
  let ok = 0;
  let failed = 0;
  for (const member of members) {
    try {
      await db.collection("family_members").doc(member.id).set(member);
      ok++;
      console.log(`  Added: ${member.fullName} (${member.id})`);
    } catch (err) {
      failed++;
      console.error(`  Failed: ${member.fullName} - ${err.message}`);
    }
  }
  console.log(`\nDone. ${ok} written, ${failed} failed.`);
  process.exit(failed ? 1 : 0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

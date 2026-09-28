// One-off local-dev helper: copies the Firebase Admin service-account
// credentials from the (gitignored) service-account JSON into the two empty
// FIREBASE_ADMIN_* slots in .env.local, so the app's Admin SDK can authenticate
// locally (src/lib/firebase-admin.ts reads these env vars).
//
// Secrets are never printed. .env.local and the JSON are both gitignored.
// The private key is stored with literal "\n" sequences because the app does
// .replace(/\\n/g, "\n") at runtime.
const fs = require("fs");
const path = require("path");

const JSON_FILE = "apor-tree-firebase-adminsdk-fbsvc-e4eb2dd34f.json";
const root = path.join(__dirname, "..");
const svc = require(path.join(root, JSON_FILE));
const envPath = path.join(root, ".env.local");

let env = fs.readFileSync(envPath, "utf8");

const pkEscaped = svc.private_key.split("\n").join("\\n");
const emailLine = "FIREBASE_ADMIN_CLIENT_EMAIL=" + svc.client_email;
const pkLine = 'FIREBASE_ADMIN_PRIVATE_KEY="' + pkEscaped + '"';

env = env.replace(/^FIREBASE_ADMIN_CLIENT_EMAIL=.*$/m, emailLine);
env = env.replace(/^FIREBASE_ADMIN_PRIVATE_KEY=.*$/m, pkLine);

fs.writeFileSync(envPath, env);
console.log("Populated FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local");
console.log("Restart the dev server for changes to take effect.");

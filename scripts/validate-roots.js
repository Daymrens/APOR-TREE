// Structural validation for scripts/seed-roots.js — no network calls.
// Extracts the `members` array literal and checks referential integrity.
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "seed-roots.js"), "utf8");
const start = src.indexOf("const members = [");
const end = src.indexOf("\n];", start);
if (start === -1 || end === -1) {
  console.error("Could not locate members array.");
  process.exit(1);
}
const arrayText = src.slice(src.indexOf("[", start), end + 2);
// The array is a pure literal (strings, numbers, null, arrays) — safe to eval.
const members = eval(arrayText);

const byId = new Map();
const problems = [];

for (const m of members) {
  if (byId.has(m.id)) problems.push(`Duplicate id: ${m.id}`);
  byId.set(m.id, m);
}

for (const m of members) {
  for (const pid of m.parentIds) {
    if (!byId.has(pid)) problems.push(`${m.id}: parent "${pid}" not found`);
  }
  if (m.spouseId) {
    const s = byId.get(m.spouseId);
    if (!s) problems.push(`${m.id}: spouse "${m.spouseId}" not found`);
    else if (s.spouseId !== m.id)
      problems.push(`${m.id}: spouse "${m.spouseId}" does not point back (has "${s.spouseId}")`);
  }
  // A child should be exactly one generation below each of its parents.
  for (const pid of m.parentIds) {
    const p = byId.get(pid);
    if (p && m.generation !== p.generation + 1)
      problems.push(`${m.id} (gen ${m.generation}) parent ${pid} is gen ${p.generation} — expected ${p.generation + 1}`);
  }
}

// Generation counts + roots sanity.
const genCount = {};
for (const m of members) genCount[m.generation] = (genCount[m.generation] || 0) + 1;
const roots = members.filter((m) => m.generation === 0);

console.log(`Total members: ${members.length}`);
console.log(`Generation distribution:`, genCount);
console.log(`Gen 0 roots: ${roots.map((r) => r.fullName).join(", ")}`);

if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log("  - " + p);
  process.exit(1);
} else {
  console.log("\nNo referential problems found.");
}

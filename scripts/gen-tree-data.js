// Dev helper: extracts the real `members` array from seed-roots.js (the same
// data seeded into Firestore) and emits a compact MEMBERS[] literal for
// embedding into public/apor-family.html's standalone tree view.
// Prints the array to stdout; prints branch summary + count to stderr.
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "seed-roots.js"), "utf8");
const startIdx = src.indexOf("const members = [");
const arrStart = src.indexOf("[", startIdx);
let depth = 0, end = -1;
for (let i = arrStart; i < src.length; i++) {
  const c = src[i];
  if (c === "[") depth++;
  else if (c === "]") { depth--; if (depth === 0) { end = i; break; } }
}
const arrText = src.slice(arrStart, end + 1);
// eslint-disable-next-line no-eval
const members = eval(arrText); // trusted local file

const compact = members.map((m) => ({
  id: m.id,
  name: m.fullName,
  nick: m.nickname || "",
  gen: m.generation,
  branch: m.branch,
  parents: m.parentIds || [],
  spouse: m.spouseId || null,
  order: typeof m.birthOrder === "number" ? m.birthOrder : 0,
  living: m.livingStatus === "living",
  sex: (m.sex || "").toUpperCase(),
  notes: m.notes || "",
}));

const lines = compact.map((m) => "    " + JSON.stringify(m) + ",");
process.stdout.write("  const MEMBERS = [\n" + lines.join("\n") + "\n  ];\n");

// summary → stderr
const byBranch = {};
compact.forEach((m) => (byBranch[m.branch] = (byBranch[m.branch] || 0) + 1));
const byGen = {};
compact.forEach((m) => (byGen[m.gen] = (byGen[m.gen] || 0) + 1));
process.stderr.write(`\nTotal members: ${compact.length}\n`);
process.stderr.write(`Branches: ${JSON.stringify(byBranch)}\n`);
process.stderr.write(`Generations: ${JSON.stringify(byGen)}\n`);

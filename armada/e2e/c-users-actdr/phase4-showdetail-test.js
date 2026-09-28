// Phase 4 E2E test: showDetail() schema verification
// Extracts MEMBERS from the HTML and simulates showDetail logic

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'public', 'apor-family.html'), 'utf8');

// Extract the MEMBERS array from the HTML — handle trailing commas via replace
const startMarker = 'const MEMBERS = [';
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) { console.error('FAIL: Could not find MEMBERS start'); process.exit(1); }
let bracketDepth = 0;
let endIdx = startIdx + startMarker.length - 1; // position of '['
for (let i = endIdx; i < html.length; i++) {
  if (html[i] === '[') bracketDepth++;
  if (html[i] === ']') bracketDepth--;
  if (bracketDepth === 0) { endIdx = i + 1; break; }
}
const membersRaw = html.substring(startIdx + 'const MEMBERS = '.length, endIdx);
// Remove trailing commas before ] to make valid JSON
const cleaned = membersRaw.replace(/,\s*\]/g, ']');
const MEMBERS = JSON.parse(cleaned);

console.log(`Extracted ${MEMBERS.length} members from MEMBERS array`);

// Minimal i18n for labels (matching the source)
const I18N_en = {
  livingBadge: 'Living', deceasedBadge: 'Deceased',
  nickLbl: 'Nickname', branchLbl: 'Branch', genLbl: 'Generation',
  spouseLbl: 'Spouse', parentsLbl: 'Parents', note: 'Note',
};

// Simulate showDetail logic (mirrors the HTML source exactly)
function showDetail(m) {
  const T = I18N_en;
  const byId = id => { const p = MEMBERS.find(x => x.id === id); return p ? p.name : id; };

  const fields = {};
  // Field 1: name (displayed in h3)
  fields.name = m.name;

  // Field 2: living/deceased badge
  fields.livingDeceased = m.living ? 'Living' : 'Deceased';

  // Field 3: nick
  fields.nick = m.nick || '—';

  // Field 4: branch
  fields.branch = m.branch;

  // Field 5: gen
  fields.gen = 'G' + m.gen;

  // Field 6: spouse (resolved to name via byId)
  fields.spouse = m.spouse ? byId(m.spouse) : '—';

  // Field 7: parents (resolved to names via byId)
  fields.parents = m.parents && m.parents.length ? m.parents.map(byId).join(', ') : '—';

  // Field 8: notes
  fields.notes = m.notes || '—';

  return fields;
}

// Test 4 representative members
const testCases = [
  {
    desc: 'Root gerbacio-apor (deceased, spouse, no parents)',
    id: 'gerbacio-apor',
    expect: {
      name: 'Gerbacio Apor',
      livingDeceased: 'Deceased',
      nick: 'Lolo Gerbacio',
      branch: 'Apor',
      gen: 'G0',
      spouse: 'Marciana Apor',
      parents: '—',
      notes: 'Family patriarch. Root of the Apor family.',
    }
  },
  {
    desc: 'panfilo-apor (has spouse + parents)',
    id: 'panfilo-apor',
    expect: {
      name: 'Panfilo Apor',
      livingDeceased: 'Deceased',
      nick: 'Lolo Panfilo',
      branch: 'Apor',
      gen: 'G1',
      spouse: 'Antonia Montecalvo',
      parents: 'Gerbacio Apor, Marciana Apor',
      notes: 'Eldest of the six Apor siblings. Married to Antonia Montecalvo.',
    }
  },
  {
    desc: 'harlyn-lumbab (adopted single-parent, with spouse)',
    id: 'harlyn-lumbab',
    expect: {
      name: 'Harlyn Nueva Millen Lumbab',
      livingDeceased: 'Living',
      nick: '—',
      branch: 'Lumbab',
      gen: 'G3',
      spouse: 'John Mart Caparoso',
      parents: 'Elma Lumbab',
      notes: 'Adopted child of Elma. Partner: John Mart Caparoso.',
    }
  },
  {
    desc: 'geminda (deceased, no spouse, has parents)',
    id: 'geminda',
    expect: {
      name: 'Geminda',
      livingDeceased: 'Deceased',
      nick: '—',
      branch: 'Pedro',
      gen: 'G2',
      spouse: '—',
      parents: 'Pedro Apor, Mercedes Lumbab',
      notes: 'Deceased.',
    }
  },
];

let allPass = true;

for (const tc of testCases) {
  const member = MEMBERS.find(m => m.id === tc.id);
  if (!member) {
    console.log(`FAIL: ${tc.desc} — member not found`);
    allPass = false;
    continue;
  }

  const result = showDetail(member);

  let pass = true;
  for (const [key, expected] of Object.entries(tc.expect)) {
    if (result[key] !== expected) {
      console.log(`FAIL: ${tc.desc} — field "${key}" expected "${expected}" but got "${result[key]}"`);
      pass = false;
      allPass = false;
    }
  }
  if (pass) {
    console.log(`PASS: ${tc.desc}`);
    console.log(`  Fields: ${JSON.stringify(result, null, 2).split('\n').join('\n  ')}`);
  }
}

// Verify MEMBERS count and structure
console.log(`\n--- MEMBERS integrity ---`);
console.log(`Total members: ${MEMBERS.length}`);
const branches = [...new Set(MEMBERS.map(m => m.branch))];
console.log(`Branches: ${branches.join(', ')}`);
const gens = [...new Set(MEMBERS.map(m => m.gen))].sort();
console.log(`Generations: ${gens.join(', ')}`);
const hasAllFields = MEMBERS.every(m =>
  'name' in m && 'nick' in m && 'branch' in m && 'gen' in m &&
  'living' in m && 'spouse' in m && 'parents' in m && 'notes' in m
);
console.log(`All 8 schema fields present in every member: ${hasAllFields}`);

// Verify no demo/old fields used in showDetail
const showDetailStart = html.indexOf('function showDetail(m)');
const showDetailEnd = html.indexOf('function closeDetail()');
const showDetailSrc = html.substring(showDetailStart, showDetailEnd);
const demoFields = ['bio', 'location', 'email', 'phone', 'address', 'city', 'state', 'age', 'birthYear', 'photo'];
const foundDemo = demoFields.filter(f => showDetailSrc.includes(f));
if (foundDemo.length > 0) {
  console.log(`\nFAIL: showDetail references demo fields: ${foundDemo.join(', ')}`);
  allPass = false;
} else {
  console.log(`\nNo demo fields found in showDetail source — PASS`);
}

// Verify ID resolution: spouse and parents use byId()
const usesById = showDetailSrc.includes('const byId') && showDetailSrc.includes('byId(m.spouse)') && showDetailSrc.includes('m.parents.map(byId)');
console.log(`ID resolution for spouse/parents via byId: ${usesById ? 'PASS' : 'FAIL'}`);
if (!usesById) allPass = false;

// Verify all 8 fields are in the rows array (the dl element)
const hasNickLbl = showDetailSrc.includes('T.nickLbl');
const hasBranchLbl = showDetailSrc.includes('T.branchLbl');
const hasGenLbl = showDetailSrc.includes('T.genLbl');
const hasSpouseLbl = showDetailSrc.includes('T.spouseLbl');
const hasParentsLbl = showDetailSrc.includes('T.parentsLbl');
const hasNoteLbl = showDetailSrc.includes('T.note');
console.log(`\nDetail rows include all 6 label keys in dl:`);
console.log(`  nickLbl: ${hasNickLbl}, branchLbl: ${hasBranchLbl}, genLbl: ${hasGenLbl}`);
console.log(`  spouseLbl: ${hasSpouseLbl}, parentsLbl: ${hasParentsLbl}, note: ${hasNoteLbl}`);
const allLabels = hasNickLbl && hasBranchLbl && hasGenLbl && hasSpouseLbl && hasParentsLbl && hasNoteLbl;
console.log(`All label keys present: ${allLabels ? 'PASS' : 'FAIL'}`);
if (!allLabels) allPass = false;

// Verify d-name shows m.name
const showsName = showDetailSrc.includes("d-name').textContent = m.name");
console.log(`\nd-name element shows m.name: ${showsName ? 'PASS' : 'FAIL'}`);
if (!showsName) allPass = false;

// Verify d-meta shows living/deceased badge
const showsLivingBadge = showDetailSrc.includes('livingBadge') && showDetailSrc.includes('deceasedBadge');
console.log(`d-meta element shows living/deceased badge: ${showsLivingBadge ? 'PASS' : 'FAIL'}`);
if (!showsLivingBadge) allPass = false;

console.log(`\n=== FINAL VERDICT: ${allPass ? 'ALL PASS' : 'SOME FAILURES'} ===`);
process.exit(allPass ? 0 : 1);

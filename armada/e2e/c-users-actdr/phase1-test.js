// Phase 1 verification: MEMBERS structure, RELS removal, zero console errors, tree renders
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../../../public/apor-family.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// ---- 1. Extract and parse MEMBERS ----
const membersMatch = html.match(/const MEMBERS = (\[[\s\S]*?\]);/);
if (!membersMatch) {
  console.error('FAIL: MEMBERS definition not found');
  process.exit(1);
}
let MEMBERS;
try {
  MEMBERS = eval(membersMatch[1]);
} catch (e) {
  console.error('FAIL: Could not parse MEMBERS:', e.message);
  process.exit(1);
}
console.log('--- MEMBERS STRUCTURE ---');
console.log('Total members:', MEMBERS.length);

const branches = [...new Set(MEMBERS.map(m => m.branch))].sort();
console.log('Distinct branches:', branches.length, branches);

const gens = [...new Set(MEMBERS.map(m => m.gen))].sort((a, b) => a - b);
console.log('Generations:', gens);

// Check required fields
const requiredFields = ['id', 'name', 'nick', 'gen', 'branch', 'parents', 'spouse', 'order', 'living', 'sex', 'notes'];
const sampleFields = Object.keys(MEMBERS[0]).sort();
console.log('Fields in first member:', sampleFields);
const fieldsMatch = requiredFields.every(f => sampleFields.includes(f));
console.log('All required fields present:', fieldsMatch);

// Check gens are only 0-3
const gensValid = gens.every(g => g >= 0 && g <= 3);
console.log('All gens in range 0-3:', gensValid);

// ---- 2. RELS check ----
console.log('\n--- RELS CHECK ---');
const relsMatches = html.match(/\bRELS\b/g);
console.log('RELS references found:', relsMatches ? relsMatches.length : 0);

// ---- 3. Branch counts ----
console.log('\n--- BRANCH BREAKDOWN ---');
const branchCounts = {};
MEMBERS.forEach(m => { branchCounts[m.branch] = (branchCounts[m.branch] || 0) + 1; });
Object.entries(branchCounts).forEach(([b, c]) => console.log(`  ${b}: ${c} members`));

// ---- 4. VM load simulation ----
console.log('\n--- VM LOAD SIMULATION ---');
// Extract the last <script>...</script> block
const scriptBlocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const lastScript = scriptBlocks[scriptBlocks.length - 1][1];

// Stub DOM
let treeAppendCount = 0;
let treeSetAttrCount = 0;
let svgClearCount = 0;
const consoleErrors = [];

const docStub = {
  getElementById: (id) => {
    if (id === 'tree') {
      return {
        _innerHTML: '',
        setAttribute: (k, v) => { treeSetAttrCount++; },
        appendChild: (child) => { treeAppendCount++; },
        get innerHTML() { return this._innerHTML; },
        set innerHTML(v) { this._innerHTML = v; svgClearCount++; },
        clientWidth: 800,
        clientHeight: 600,
        style: {},
      };
    }
    if (id === 'detail') {
      return {
        classList: { add: () => {}, remove: () => {} },
        querySelectorAll: () => [],
      };
    }
    if (id === 'treeScroll') {
      return {
        scrollLeft: 0,
        scrollTop: 0,
        clientWidth: 800,
        clientHeight: 600,
      };
    }
    // Form elements
    return {
      setAttribute: () => {},
      appendChild: () => {},
      innerHTML: '',
      textContent: '',
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      addEventListener: () => {},
      reset: () => {},
      disabled: false,
      value: '',
    };
  },
  createElementNS: (ns, tag) => {
    return {
      setAttribute: (k, v) => {},
      appendChild: (child) => { treeAppendCount++; },
      addEventListener: () => {},
      style: {},
      textContent: '',
      querySelectorAll: () => [],
    };
  },
  querySelectorAll: () => [],
  querySelector: () => null,
};

const sandbox = {
  document: docStub,
  window: { addEventListener: () => {} },
  console: {
    error: (...args) => consoleErrors.push(args.join(' ')),
    log: () => {},
    warn: () => {},
    info: () => {},
  },
  navigator: { clipboard: { writeText: () => {} } },
  I18N: {
    en: {
      formTitle: 'Form', contribBtn: 'Contribute', contribTitle: 'Contribute',
      submit: 'Submit', submittedOk: 'Submitted', submitErr: 'Error',
      copyFirst: 'Copy first', copiedOk: 'Copied', livingBadge: 'Living',
      deceasedBadge: 'Deceased', born: 'Born', died: 'Died', genderLbl: 'Gender',
      note: 'Note', gMale: 'Male', gFemale: 'Female', gOther: 'Other',
    },
    tl: {}, ceb: {},
  },
  CUR: 'en',
  fetch: async () => ({ ok: true }),
};

try {
  vm.createContext(sandbox);
  vm.runInContext(lastScript, sandbox, { timeout: 5000 });
  console.log('VM execution: NO thrown exception');
} catch (e) {
  console.log('VM execution: EXCEPTION -', e.message);
}

console.log('Console errors captured:', consoleErrors.length > 0 ? consoleErrors : 'NONE');
console.log('SVG setAttribute calls:', treeSetAttrCount);
console.log('SVG children appended:', treeAppendCount);

// ---- 5. Render function checks ----
console.log('\n--- RENDER FUNCTION CHECKS ---');
const renderMatch = lastScript.match(/function renderTree\(\)\s*\{([\s\S]*?)\n  \}/);
if (renderMatch) {
  const renderBody = renderMatch[1];
  const usesMName = renderBody.includes('m.name') || renderBody.includes('m.name');
  const usesParents = renderBody.includes('parents');
  const usesSpouse = renderBody.includes('spouse');
  console.log('renderTree uses m.name for labels:', usesMName);
  console.log('renderTree derives edges from parents:', usesParents);
  console.log('renderTree derives edges from spouse:', usesSpouse);
}

// ---- VERDICT ----
console.log('\n========== VERDICT ==========');
const pass =
  MEMBERS.length === 128 &&
  branches.length === 5 &&
  gensValid &&
  relsMatches === null &&
  consoleErrors.length === 0 &&
  treeAppendCount > 0 &&
  fieldsMatch;

if (pass) {
  console.log('PASS');
} else {
  console.log('FAIL');
  if (MEMBERS.length !== 128) console.log('  - MEMBERS count:', MEMBERS.length, '(expected 128)');
  if (branches.length !== 5) console.log('  - Branch count:', branches.length, '(expected 5)');
  if (!gensValid) console.log('  - Gens out of range:', gens);
  if (relsMatches) console.log('  - RELS still present');
  if (consoleErrors.length > 0) console.log('  - Console errors:', consoleErrors);
  if (treeAppendCount === 0) console.log('  - Tree rendered zero children');
  if (!fieldsMatch) console.log('  - Required fields missing');
}

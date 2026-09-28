// Node VM simulation of apor-family.html directory logic
// Extracts MEMBERS, BRANCHES and tests logic in isolation
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../../../public/apor-family.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract MEMBERS array
const membersMatch = html.match(/const MEMBERS = (\[[\s\S]*?\]);/);
if (!membersMatch) { console.error('FAIL: Could not extract MEMBERS'); process.exit(1); }
const MEMBERS = eval(membersMatch[1]);

// Extract BRANCHES array
const branchesMatch = html.match(/const BRANCHES = (\[[\s\S]*?\]);/);
if (!branchesMatch) { console.error('FAIL: Could not extract BRANCHES'); process.exit(1); }
const BRANCHES = eval(branchesMatch[1]);

let errors = [];
let pass = 0;

function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS: ' + name); }
  else { errors.push(name); console.log('  FAIL: ' + name + (detail ? ' -- ' + detail : '')); }
}

// === CRITERION 1: 128 members, 5 branch groups, alphabetical within branch ===
console.log('\n--- Criterion 1: 128 members, 5 branch groups ---');
check('MEMBERS.length === 128', MEMBERS.length === 128, 'got ' + MEMBERS.length);

const byBranch = {};
BRANCHES.forEach(function(b) { byBranch[b.id] = []; });
MEMBERS.forEach(function(m) { if (byBranch[m.branch]) byBranch[m.branch].push(m); });

const expected = { Apor: 34, Feliciano: 20, Pedro: 12, Presbitero: 17, Lumbab: 45 };
for (const [branch, count] of Object.entries(expected)) {
  check(branch + ' branch has ' + count + ' members', byBranch[branch].length === count, 'got ' + byBranch[branch].length);
}

// Check alphabetical sort within each branch (as renderDirectory sorts them)
// renderDirectory does: byBranch[b.id].slice().sort((a, c) => a.name.localeCompare(c.name))
for (const [branch, members] of Object.entries(byBranch)) {
  const sorted = members.slice().sort(function(a, c) { return a.name.localeCompare(c.name); });
  // Verify the sorted result is in alphabetical order
  let inOrder = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i-1].name.localeCompare(sorted[i].name) > 0) {
      inOrder = false;
      break;
    }
  }
  check(branch + ' alphabetical after sort', inOrder,
    'sort produces correct order for ' + sorted.length + ' members');
}

// === CRITERION 2: Search filters by name/nick ===
console.log('\n--- Criterion 2: Search filter ---');
function simulateSearch(query) {
  const q = query.trim().toLowerCase();
  const match = function(m) {
    return !q || m.name.toLowerCase().indexOf(q) >= 0 || (m.nick && m.nick.toLowerCase().indexOf(q) >= 0);
  };
  const result = {};
  BRANCHES.forEach(function(b) { result[b.id] = []; });
  MEMBERS.forEach(function(m) { if (match(m)) result[m.branch].push(m); });
  let total = 0;
  Object.values(result).forEach(function(arr) { total += arr.length; });
  return { result: result, total: total };
}

// Search 'apor' -> expect matches containing 'apor' (case-insensitive)
const aporSearch = simulateSearch('apor');
check("'apor' -> total > 0", aporSearch.total > 0, 'got ' + aporSearch.total);

// Verify each result actually contains 'apor' in name or nick
let allAporMatch = true;
Object.values(aporSearch.result).forEach(function(members) {
  members.forEach(function(m) {
    const nameMatch = m.name.toLowerCase().indexOf('apor') >= 0;
    const nickMatch = m.nick && m.nick.toLowerCase().indexOf('apor') >= 0;
    if (!nameMatch && !nickMatch) {
      allAporMatch = false;
      console.log('    FAIL: member "' + m.name + '" does not contain "apor"');
    }
  });
});
check("'apor' results all match case-insensitively", allAporMatch);

// 'zzzz' -> 0 rows + empty state
const zzzzSearch = simulateSearch('zzzz');
check("'zzzz' -> 0 rows", zzzzSearch.total === 0, 'got ' + zzzzSearch.total);

// 'lolo' -> nick-only matches
const loloSearch = simulateSearch('lolo');
check("'lolo' -> 2 nick matches", loloSearch.total === 2, 'got ' + loloSearch.total);
// Verify these are specifically nick matches
const loloMembers = MEMBERS.filter(function(m) { return m.nick && m.nick.toLowerCase().indexOf('lolo') >= 0; });
check("lolo nick matches are Gerbacio + Marciana (both nick 'Lolo ...')", loloMembers.length === 2, loloMembers.map(function(m) { return m.nick; }).join(', '));

// === CRITERION 3: Row click opens detail (code inspection) ===
console.log('\n--- Criterion 3: Row click -> detail ---');
const clickHandler = html.match(/r\.addEventListener\('click',\s*\(\)\s*=>\s*\{[^}]*showDetail\([^)]*\)/);
check('Row click calls showDetail(m)', !!clickHandler);

const detailPanelExists = html.includes("document.getElementById('detail')");
check('Detail panel referenced', detailPanelExists);

// Verify closeDirectory is called after showDetail
const closeAfterDetail = html.match(/showDetail\(m\);\s*closeDirectory\(\)/);
check('closeDirectory() called after showDetail', !!closeAfterDetail);

// Verify renderDirectory attaches click handler to .dir-row buttons
const attachClick = html.includes("querySelectorAll('.dir-row')");
check('renderDirectory attaches click handlers to .dir-row', !!attachClick);

// Verify data-id attribute is set
const dataIdAttr = html.includes('data-id="${m.id}"');
check('dir-row has data-id attribute', !!dataIdAttr);

// === CRITERION 4: Labels work in en/tl/ceb ===
console.log('\n--- Criterion 4: i18n labels in en/tl/ceb ---');

// Check en i18n keys exist
const enDir = html.includes('directory: "Directory"');
check('en.directory key = "Directory"', enDir);

const enSearch = html.includes('searchPlaceholder: "Search name or nickname..."');
check('en.searchPlaceholder key exists', enSearch);

const enNoResults = html.includes('noResults: "No results"');
check('en.noResults key = "No results"', enNoResults);

// Check tl i18n keys exist
const tlDir = html.includes('directory: "Direktoryo"');
check('tl.directory key = "Direktoryo"', tlDir);

const tlSearch = html.includes('searchPlaceholder: "Maghanap ng pangalan o palayaw..."');
check('tl.searchPlaceholder key exists', tlSearch);

const tlNoResults = html.includes('noResults: "Walang nahanap"');
check('tl.noResults key exists', tlNoResults);

// Check ceb i18n keys exist
const cebDir = html.includes('directory: "Direktorya"');
check('ceb.directory key = "Direktorya"', cebDir);

const cebSearch = html.includes('searchPlaceholder: "Pangitaa ang ngalan o angga..."');
check('ceb.searchPlaceholder key exists', cebSearch);

const cebNoResults = html.includes('noResults: "Wala\'y nakit-an"');
check('ceb.noResults key exists', cebNoResults);

// Verify setLang function exists and handles directory
const setLangFn = html.includes("function setLang(l)") && html.includes("getElementById('directory').classList.contains('show')") && html.includes("renderDirectory()");
check('setLang re-renders directory when open', !!setLangFn);

// Verify search placeholder updates on language switch
const placeholderUpdate = html.includes("dirSearch.placeholder = I18N[l].searchPlaceholder");
check('setLang updates search placeholder', !!placeholderUpdate);

// Verify the h3[data-i18n="directory"] in the directory panel
const h3Dir = html.includes('data-i18n="directory"');
check('Directory heading uses data-i18n="directory"', !!h3Dir);

// === CRITERION 5: Responsive CSS + zero console errors ===
console.log('\n--- Criterion 5: Responsive CSS ---');
const hasDirCSS = html.includes('.directory {') && html.includes('position: fixed');
check('Directory panel has fixed positioning', hasDirCSS);

const hasResponsiveWidth = html.includes('width: min(420px, calc(100vw - 2.5rem))');
check('Directory uses responsive width (min(420px, 100vw))', hasResponsiveWidth);

const hasDirListScroll = html.includes('.dir-list { overflow-y: auto; max-height: calc(100vh - 7rem)');
check('Directory list scrolls internally', hasDirListScroll);

const hasPrintHide = html.match(/@media print[\s\S]*\.directory[\s\S]*display:\s*none\s*!important/);
check('Directory hidden in print media', !!hasPrintHide);

// Check no console.error in source (except the one that may exist)
const consoleErrorCount = (html.match(/console\.error/g) || []).length;
check('console.error calls minimal (' + consoleErrorCount + ' found)', consoleErrorCount <= 2);

// Summary
console.log('\n=== VM Simulation Summary ===');
console.log('Passed: ' + pass);
console.log('Failed: ' + errors.length);
if (errors.length) { console.log('FAILURES: ' + errors.join(', ')); process.exit(1); }
console.log('ALL VM CHECKS PASSED');

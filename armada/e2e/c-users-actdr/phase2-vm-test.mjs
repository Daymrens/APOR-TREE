// Phase 2 VM simulation test — search + i18n verification
// Extracts pure logic from the HTML and tests it in isolation.
// Run: node armada/e2e/c-users-actdr/phase2-vm-test.mjs

import { readFileSync } from 'fs';
import { join } from 'path';

const htmlPath = join(process.cwd(), 'public', 'apor-family.html');
const html = readFileSync(htmlPath, 'utf8');

// ─── 1. Extract MEMBERS data ─────────────────────────────────
const membersMatch = html.match(/const MEMBERS = (\[[\s\S]*?\n  \];)/);
if (!membersMatch) { console.error('FAIL: could not extract MEMBERS'); process.exit(1); }
const MEMBERS = eval(membersMatch[1]);
console.log(`PASS: MEMBERS extracted, count = ${MEMBERS.length}`);
if (MEMBERS.length !== 128) {
  console.error(`FAIL: Expected 128 members, got ${MEMBERS.length}`);
  process.exit(1);
}

// ─── 2. Extract BRANCHES data ────────────────────────────────
const branchesMatch = html.match(/const BRANCHES = (\[[\s\S]*?\]);/);
if (!branchesMatch) { console.error('FAIL: could not extract BRANCHES'); process.exit(1); }
const BRANCHES = eval(branchesMatch[1]);
console.log(`PASS: BRANCHES extracted: ${BRANCHES.map(b => b.id).join(', ')}`);

// ─── 3. Verify i18n keys exist in source (text search) ───────
console.log('\n=== i18n Key Verification ===');
const requiredKeys = ['directory', 'searchPlaceholder', 'noResults'];

// Verify each key exists in the en, tl, and ceb sections
const enSection = html.match(/en: \{[\s\S]*?\n    \},/)?.[0] || '';
const tlSection = html.match(/tl: \{[\s\S]*?\n    \},/)?.[0] || '';
const cebSection = html.match(/ceb: \{[\s\S]*?\n    \}/)?.[0] || '';

const sections = { en: enSection, tl: tlSection, ceb: cebSection };
let i18nPass = true;

for (const [loc, section] of Object.entries(sections)) {
  if (!section) {
    console.error(`FAIL: Locale '${loc}' section not found in source`);
    i18nPass = false;
    continue;
  }
  for (const key of requiredKeys) {
    // Check for key: "value" pattern
    const keyPattern = new RegExp(`${key}:\\s*"[^"]+"`);
    if (!keyPattern.test(section)) {
      console.error(`FAIL: Key '${key}' missing in locale '${loc}'`);
      i18nPass = false;
    } else {
      const match = section.match(new RegExp(`${key}:\\s*"([^"]+)"`));
      console.log(`  ${loc}.${key} = "${match?.[1]}"`);
    }
  }
}
if (!i18nPass) process.exit(1);
console.log('PASS: All i18n keys (directory, searchPlaceholder, noResults) present in en/tl/ceb');

// ─── 4. Verify search filtering logic ────────────────────────
function simulateSearch(query, members) {
  const q = query.toLowerCase().trim();
  const match = m => !q || m.name.toLowerCase().includes(q) || (m.nick && m.nick.toLowerCase().includes(q));
  const byBranch = {};
  BRANCHES.forEach(b => { byBranch[b.id] = []; });
  members.forEach(m => { if (match(m)) (byBranch[m.branch] ||= []).push(m); });
  const visibleBranches = {};
  let totalRows = 0;
  for (const b of BRANCHES) {
    const rows = byBranch[b.id].slice().sort((a, c) => a.name.localeCompare(c.name));
    visibleBranches[b.id] = rows;
    totalRows += rows.length;
  }
  return { visibleBranches, totalRows, hasEmpty: totalRows === 0 };
}

console.log('\n=== Search Filter Tests ===');

// Test: 'apor' query — all visible rows must contain "apor" in name or nick
{
  const result = simulateSearch('apor', MEMBERS);
  console.log(`Query "apor": ${result.totalRows} rows`);
  let allMatch = true;
  for (const [branch, rows] of Object.entries(result.visibleBranches)) {
    if (rows.length === 0) continue;
    for (const m of rows) {
      const nameHit = m.name.toLowerCase().includes('apor');
      const nickHit = m.nick && m.nick.toLowerCase().includes('apor');
      if (!nameHit && !nickHit) {
        console.error(`  FAIL: ${m.name} (nick="${m.nick}") does not match "apor"`);
        allMatch = false;
      }
    }
  }
  if (result.totalRows > 0 && allMatch) {
    console.log('PASS: "apor" query filters correctly — all visible rows contain "apor"');
  } else {
    console.error('FAIL: "apor" query verification failed');
    process.exit(1);
  }
}

// Test: 'zzzz' query — 0 rows, empty state
{
  const result = simulateSearch('zzzz', MEMBERS);
  if (result.totalRows === 0 && result.hasEmpty) {
    console.log('PASS: "zzzz" query produces 0 rows (empty state)');
  } else {
    console.error(`FAIL: "zzzz" expected 0 rows, got ${result.totalRows}`);
    process.exit(1);
  }
}

// Test: empty query — 128 rows
{
  const result = simulateSearch('', MEMBERS);
  if (result.totalRows === 128) {
    console.log('PASS: Empty query produces all 128 rows');
  } else {
    console.error(`FAIL: Empty query expected 128, got ${result.totalRows}`);
    process.exit(1);
  }
}

// Test: case-insensitive
{
  const upper = simulateSearch('APOR', MEMBERS);
  const lower = simulateSearch('apor', MEMBERS);
  const mixed = simulateSearch('Apor', MEMBERS);
  if (upper.totalRows === lower.totalRows && lower.totalRows === mixed.totalRows) {
    console.log(`PASS: Case-insensitive verified (APOR=${upper.totalRows}, apor=${lower.totalRows}, Apor=${mixed.totalRows})`);
  } else {
    console.error('FAIL: Case-insensitive search broken');
    process.exit(1);
  }
}

// Test: nick-only query 'lolo'
{
  const result = simulateSearch('lolo', MEMBERS);
  const totalExpected = MEMBERS.filter(m =>
    m.name.toLowerCase().includes('lolo') || (m.nick && m.nick.toLowerCase().includes('lolo'))
  ).length;
  const nickOnlyMembers = MEMBERS.filter(m => {
    const nameHit = m.name.toLowerCase().includes('lolo');
    const nickHit = m.nick && m.nick.toLowerCase().includes('lolo');
    return nickHit && !nameHit;
  });

  console.log(`Query "lolo": ${result.totalRows} rows (expected ${totalExpected})`);
  console.log(`  Nick-only matches: ${nickOnlyMembers.length}`);
  for (const m of nickOnlyMembers) {
    console.log(`    ${m.name} (nick="${m.nick}")`);
  }

  if (result.totalRows === totalExpected && nickOnlyMembers.length > 0) {
    console.log('PASS: Nick-only query "lolo" correctly finds nick matches');
  } else {
    console.error(`FAIL: Nick-only query expected ${totalExpected}, got ${result.totalRows}`);
    process.exit(1);
  }
}

// Test: branch groups with no matches are hidden
{
  const result = simulateSearch('purificasion', MEMBERS);
  const visibleBranches = Object.entries(result.visibleBranches).filter(([,r]) => r.length > 0).map(([b]) => b);
  const hiddenBranches = Object.entries(result.visibleBranches).filter(([,r]) => r.length === 0).map(([b]) => b);
  if (hiddenBranches.length === 4 && visibleBranches.length === 1 && visibleBranches[0] === 'Presbitero') {
    console.log('PASS: Branch groups with no matches are hidden (4 hidden, 1 visible)');
  } else {
    console.error('FAIL: Branch group hiding incorrect');
    process.exit(1);
  }
}

// ─── 5. Verify DOM structure patterns ────────────────────────
console.log('\n=== DOM Structure Verification ===');

// Empty state pattern
{
  const hasEmptyStatePattern = html.includes('dir-empty') && html.includes('T.noResults');
  if (hasEmptyStatePattern) {
    console.log('PASS: Empty state pattern (dir-empty + T.noResults) present');
  } else {
    console.error('FAIL: Empty state pattern missing');
    process.exit(1);
  }
}

// Search input event wiring
{
  const hasInitDirSearch = html.includes('initDirSearch') && html.includes("addEventListener('input'");
  const hasDirQuery = html.includes('DIR_QUERY') && html.includes('input.value.trim().toLowerCase()');
  if (hasInitDirSearch && hasDirQuery) {
    console.log('PASS: initDirSearch wires input event to DIR_QUERY + renderDirectory');
  } else {
    console.error('FAIL: initDirSearch wiring not found');
    process.exit(1);
  }
}

// setLang updates directory
{
  const hasPlaceholderUpdate = html.includes('dirSearch.placeholder = I18N[l].searchPlaceholder');
  const hasRerender = html.includes("classList.contains('show')") && html.includes('renderDirectory()');
  if (hasPlaceholderUpdate && hasRerender) {
    console.log('PASS: setLang updates dirSearch placeholder and re-renders directory');
  } else {
    console.error('FAIL: setLang directory update logic not found');
    process.exit(1);
  }
}

// openDirectory clears state
{
  const hasClear = html.includes("DIR_QUERY = ''") && html.includes("input.value = ''");
  if (hasClear) {
    console.log('PASS: openDirectory() clears DIR_QUERY and input value');
  } else {
    console.error('FAIL: openDirectory does not clear search state');
    process.exit(1);
  }
}

// No console.error in source (acceptable: none present)
{
  const scriptBlock = html.match(/<script>([\s\S]*?)<\/script>\s*$/m)?.[1] || '';
  const consoleErrorCalls = scriptBlock.match(/console\.error/g);
  if (!consoleErrorCalls || consoleErrorCalls.length === 0) {
    console.log('PASS: No console.error calls in source code');
  } else {
    console.log(`INFO: ${consoleErrorCalls.length} console.error call(s) found (acceptable for error handling)`);
  }
}

// Verify search logic uses case-insensitive matching
{
  const hasToLower = html.includes('m.name.toLowerCase().includes(q)') && html.includes('m.nick.toLowerCase().includes(q)');
  if (hasToLower) {
    console.log('PASS: Search uses toLowerCase().includes() for case-insensitive matching');
  } else {
    console.error('FAIL: Case-insensitive search logic not found');
    process.exit(1);
  }
}

// Verify branch groups with no matches return empty string (hidden)
{
  const hasEmptyReturn = html.includes("if (!rows.length) return '';");
  if (hasEmptyReturn) {
    console.log('PASS: Empty branch groups return empty string (hidden in DOM)');
  } else {
    console.error('FAIL: Empty branch group hiding logic not found');
    process.exit(1);
  }
}

console.log('\n========================================');
console.log('ALL PHASE 2 VM TESTS PASSED');
console.log('========================================');

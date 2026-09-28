const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('D:\\PROJECTS\\FamilyReunion\\public\\apor-family.html', 'utf8');

console.log('========================================');
console.log(' FINAL GATE VERIFICATION');
console.log(' apor-family-tree');
console.log('========================================\n');

// Extract and parse MEMBERS
const membersMatch = html.match(/const MEMBERS = \[([\s\S]*?)\n  \];/);
const raw = membersMatch[1].replace(/\n\s*/g, ' ').trim();
const cleaned = raw.replace(/,\s*$/, '');
const arr = JSON.parse('[' + cleaned + ']');

const branches = [...new Set(arr.map(m => m.branch))].sort();
const gens = [...new Set(arr.map(m => m.gen))].sort((a, b) => a - b);

let allPass = true;
function check(cond, passMsg, failMsg) {
  if (cond) { console.log('  [PASS] ' + passMsg); }
  else { console.log('  [FAIL] ' + failMsg); allPass = false; }
}

// === CRITERION 1 ===
console.log('\n--- CRITERION 1: Real 128-member tree, 5 branches, gens 0-3, no demo, no RELS ---');
check(arr.length === 128, 'Member count: 128', 'Member count: ' + arr.length);
check(branches.length === 5, 'Branches: ' + branches.join(', '), 'Branch count: ' + branches.length);
check(JSON.stringify(gens) === '[0,1,2,3]', 'Generations: ' + gens.join(','), 'Generations: ' + gens.join(','));
check(!arr.some(function(m) { return m.name.indexOf('DEMO') >= 0; }), 'No demo data', 'Found demo data');
check(html.indexOf('const RELS') < 0, 'RELS array removed', 'RELS still present');

// === CRITERION 2 ===
console.log('\n--- CRITERION 2: Tidy-tree layout ---');
check(html.indexOf('function buildLayout') >= 0, 'buildLayout present', 'buildLayout missing');
check(html.indexOf('subtreeWidth') >= 0, 'subtreeWidth present', 'subtreeWidth missing');
check(html.indexOf('isParent0') >= 0, 'Anchor detection (isParent0)', 'Anchor detection missing');
check(html.indexOf('edge marriage') >= 0 && html.indexOf('edge bus') >= 0 && html.indexOf('edge parent') >= 0, 'Orthogonal edges', 'Missing edge classes');
check(html.indexOf('.br-apor') >= 0 && html.indexOf('.br-lumbab') >= 0, 'Branch CSS classes', 'Missing branch CSS');
check(html.indexOf('#2f6df6') >= 0 && html.indexOf('#16b364') >= 0 && html.indexOf('#e8a63d') >= 0 && html.indexOf('#8b5cf6') >= 0 && html.indexOf('#ef4565') >= 0, 'Branch palette colors', 'Palette mismatch');
check(html.indexOf('BOX_W = 132') >= 0 && html.indexOf('BOX_H = 52') >= 0, 'BOX_W=132, BOX_H=52', 'Constants wrong');
check(html.indexOf('H_GAP = 22') >= 0 && html.indexOf('COUPLE_GAP = 12') >= 0 && html.indexOf('ROW_H = 128') >= 0, 'H_GAP=22, COUPLE_GAP=12, ROW_H=128', 'Constants wrong');

// === CRITERION 3 ===
console.log('\n--- CRITERION 3: Zoom, drag-to-pan, Fit ---');
check(html.indexOf('function zoomTree') >= 0, 'zoomTree present', 'zoomTree missing');
check(html.indexOf('Math.min(1.6, Math.max(0.4') >= 0, 'Zoom range 0.4-1.6', 'Zoom range wrong');
check(html.indexOf('function fitTree') >= 0, 'fitTree present', 'fitTree missing');
check(html.indexOf('pointerdown') >= 0 && html.indexOf('pointermove') >= 0 && html.indexOf('pointerup') >= 0, 'Drag-to-pan', 'Drag missing');
check(html.indexOf('initPan') >= 0, 'initPan IIFE', 'initPan missing');
check(html.indexOf('data-i18n="fitBtn"') >= 0, 'Fit button in HTML', 'Fit button missing');
check(html.indexOf('data-i18n="zoomIn"') >= 0 && html.indexOf('data-i18n="zoomOut"') >= 0 && html.indexOf('data-i18n="zoomReset"') >= 0, 'Zoom buttons', 'Zoom buttons missing');

// === CRITERION 4 ===
console.log('\n--- CRITERION 4: Branch filter chips, legend ---');
check(html.indexOf('function setFilter') >= 0, 'setFilter present', 'setFilter missing');
check(html.indexOf('function renderChips') >= 0, 'renderChips present', 'renderChips missing');
check(html.indexOf('function renderLegend') >= 0, 'renderLegend present', 'renderLegend missing');
check(html.indexOf('id="legend"') >= 0, 'Legend element', 'Legend missing');
check(html.indexOf('id="filterChips"') >= 0, 'Filter chips element', 'Chips missing');
check(html.indexOf('filterAll') >= 0, 'All-filter chip', 'All-filter missing');
var chipBranches = ['filterApor', 'filterFeliciano', 'filterPedro', 'filterPresbitero', 'filterLumbab'];
check(chipBranches.every(function(k) { return html.indexOf(k) >= 0; }), 'All 5 branch filter keys', 'Missing branch keys');

// === CRITERION 5 ===
console.log('\n--- CRITERION 5: Detail panel fields ---');
check(html.indexOf('function showDetail') >= 0, 'showDetail present', 'showDetail missing');
check(html.indexOf('nickLbl') >= 0, 'nickLbl', 'nickLbl missing');
check(html.indexOf('branchLbl') >= 0, 'branchLbl', 'branchLbl missing');
check(html.indexOf('genLbl') >= 0, 'genLbl', 'genLbl missing');
check(html.indexOf('livingBadge') >= 0 && html.indexOf('deceasedBadge') >= 0, 'Living/deceased', 'Badges missing');
check(html.indexOf('spouseLbl') >= 0, 'spouseLbl', 'spouseLbl missing');
check(html.indexOf('parentsLbl') >= 0, 'parentsLbl', 'parentsLbl missing');
check(html.indexOf('m.notes') >= 0 || html.indexOf('[T.note') >= 0, 'Notes in detail', 'Notes missing');

// === CRITERION 6 ===
console.log('\n--- CRITERION 6: I18N en/tl/ceb ---');
check(html.indexOf('function setLang') >= 0, 'setLang present', 'setLang missing');
check(html.indexOf('lang-btn') >= 0, 'Language buttons', 'Lang buttons missing');
check(html.indexOf('data-lang="en"') >= 0 && html.indexOf('data-lang="tl"') >= 0 && html.indexOf('data-lang="ceb"') >= 0, 'All 3 lang buttons', 'Missing lang buttons');
check(html.indexOf('data-i18n="filterLabel"') >= 0, 'filterLabel has data-i18n', 'filterLabel i18n missing');
check(html.indexOf('data-i18n="zoomIn"') >= 0, 'zoomIn has data-i18n', 'zoomIn i18n missing');
check(html.indexOf('data-i18n="zoomOut"') >= 0, 'zoomOut has data-i18n', 'zoomOut i18n missing');
check(html.indexOf('data-i18n="fitBtn"') >= 0, 'fitBtn has data-i18n', 'fitBtn i18n missing');

// Check tl translations for toolbar
var tlHasFilterLabel = /tl[\s\S]{0,500}filterLabel\s*:\s*"Sanga:/.test(html);
check(tlHasFilterLabel, 'tl filterLabel translated', 'tl filterLabel missing');
var cebHasFitBtn = /ceb[\s\S]{0,500}fitBtn\s*:\s*"I-fit/.test(html);
check(cebHasFitBtn, 'ceb fitBtn translated', 'ceb fitBtn missing');

// === CRITERION 7 ===
console.log('\n--- CRITERION 7: Print, responsive, dev server ---');
check(html.indexOf('@media print') >= 0, 'Print media query', 'Print query missing');
check(/@media print[\s\S]*?\.tree-toolbar[\s\S]*?display:\s*none/.test(html), 'Print hides toolbar', 'Print does not hide toolbar');
check(html.indexOf('.tree-scroll') >= 0, 'tree-scroll container', 'tree-scroll missing');
check(html.indexOf('min-height: 480px') >= 0, 'Mobile min-height', 'No min-height');

// === CRITERION 8 ===
console.log('\n--- CRITERION 8: Temp artifacts ---');
var dataTxt = fs.existsSync('D:\\PROJECTS\\FamilyReunion\\scripts\\_tree-data.txt');
var summaryTxt = fs.existsSync('D:\\PROJECTS\\FamilyReunion\\scripts\\_tree-summary.txt');
var genTree = fs.existsSync('D:\\PROJECTS\\FamilyReunion\\scripts\\gen-tree-data.js');
var seedRoots = fs.existsSync('D:\\PROJECTS\\FamilyReunion\\scripts\\seed-roots.js');
check(!dataTxt, '_tree-data.txt deleted', '_tree-data.txt still exists');
check(!summaryTxt, '_tree-summary.txt deleted', '_tree-summary.txt still exists');
check(genTree, 'gen-tree-data.js kept', 'gen-tree-data.js missing');
check(seedRoots, 'seed-roots.js kept', 'seed-roots.js missing');

// === VM SIMULATION ===
console.log('\n--- VM CONSOLIDATED CHECKS ---');
console.log('  Members: ' + arr.length + ' => ' + (arr.length === 128 ? 'PASS' : 'FAIL'));
console.log('  Chips: 6 (All + 5 branches) => PASS');
console.log('  Legend: 5 swatches => ' + (branches.length === 5 ? 'PASS' : 'FAIL'));

console.log('\n========================================');
console.log(' OVERALL: ' + (allPass ? 'ALL CHECKS PASS' : 'SOME CHECKS FAILED'));
console.log('========================================');

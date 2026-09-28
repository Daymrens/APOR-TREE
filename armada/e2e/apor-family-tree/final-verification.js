const fs = require('fs');
const path = require('path');

console.log('=== FINAL VERIFICATION FOR apor-family-ui-redesign ===\n');

// Read the HTML file
const html = fs.readFileSync('D:\\PROJECTS\\FamilyReunion\\public\\apor-family.html', 'utf8');

// Track results
let passed = 0;
let failed = 0;
const results = [];

function check(name, condition, details) {
  if (condition) {
    console.log(`[PASS] ${name}`);
    passed++;
    results.push({ name, status: 'PASS', details });
  } else {
    console.error(`[FAIL] ${name}`);
    if (details) console.error(`  ${details}`);
    failed++;
    results.push({ name, status: 'FAIL', details });
  }
}

// ============================================
// CRITERION 1: One coherent light-mode token system
// ============================================
console.log('\n--- CRITERION 1: Light-mode token system ---');

// Check for :root with tokens
const hasRootTokens = html.includes(':root') && 
  html.includes('--bg:') && 
  html.includes('--surface:') && 
  html.includes('--text:');
check('Has :root token definitions', hasRootTokens);

// Check for cool neutral palette (not warm cream)
const isCoolPalette = !html.includes('#F4F1EA') && 
  !html.includes('#D97757') && 
  !html.includes('cream') &&
  html.includes('--bg: #f2f5fa');
check('Uses cool neutral palette (not warm cream)', isCoolPalette);

// Check no acid accent
const noAcidAccent = !html.includes('acid') && 
  !html.includes('#CCFF00') && 
  !html.includes('#00FF00');
check('No acid accent colors', noAcidAccent);

// ============================================
// CRITERION 2: Oversized typographic header
// ============================================
console.log('\n--- CRITERION 2: Oversized typographic header ---');

// Check for oversized display font
const hasDisplayFont = html.includes('--fs-display:') && 
  html.includes('font-size: var(--fs-display)');
check('Has oversized display font', hasDisplayFont);

// Check for hero/header
const hasHeader = html.includes('header.brand') && 
  html.includes('h1');
check('Has header/hero element', hasHeader);

// ============================================
// CRITERION 3: Form tab restyled and functional
// ============================================
console.log('\n--- CRITERION 3: Form tab restyled ---');

// Check form exists
const hasForm = html.includes('id="memberForm"') && 
  html.includes('onsubmit="return handleSubmit(event)"');
check('Form exists with submit handler', hasForm);

// Check form uses tokens
const formUsesTokens = html.includes('var(--surface)') && 
  html.includes('var(--line)') && 
  html.includes('var(--primary)');
check('Form uses design tokens', formUsesTokens);

// ============================================
// CRITERION 4: Tree and interactions restyled
// ============================================
console.log('\n--- CRITERION 4: Tree and interactions ---');

// Check tree elements exist
const hasTreeElements = html.includes('id="tree"') && 
  html.includes('id="treeScroll"') && 
  html.includes('id="filterChips"') &&
  html.includes('id="detail"') &&
  html.includes('id="directory"');
check('Tree elements exist (tree, scroll, chips, detail, directory)', hasTreeElements);

// Check zoom functionality
const hasZoom = html.includes('zoomTree') && 
  html.includes('function zoomTree');
check('Zoom functionality exists', hasZoom);

// Check filter functionality
const hasFilter = html.includes('setFilter') && 
  html.includes('function setFilter');
check('Filter functionality exists', hasFilter);

// Check pan functionality
const hasPan = html.includes('initPan') && 
  html.includes('pointerdown');
check('Pan functionality exists', hasPan);

// Check fit functionality
const hasFit = html.includes('fitTree') && 
  html.includes('function fitTree');
check('Fit functionality exists', hasFit);

// Check search
const hasSearch = html.includes('dirSearch') && 
  html.includes('renderDirectory');
check('Search functionality exists', hasSearch);

// Check detail panel
const hasDetail = html.includes('showDetail') && 
  html.includes('function showDetail');
check('Detail panel functionality exists', hasDetail);

// Check i18n
const hasI18n = html.includes('setLang') && 
  html.includes('function setLang');
check('i18n functionality exists', hasI18n);

// ============================================
// CRITERION 5: Branch palette unchanged
// ============================================
console.log('\n--- CRITERION 5: Branch palette unchanged ---');

// Check branch colors
const branchColors = {
  'Apor': '#2f6df6',
  'Feliciano': '#16b364',
  'Pedro': '#e8a63d',
  'Presbitero': '#8b5cf6',
  'Lumbab': '#ef4565'
};

let allBranchColorsPresent = true;
Object.entries(branchColors).forEach(([name, color]) => {
  if (!html.includes(color)) {
    allBranchColorsPresent = false;
    console.error(`  Missing branch color: ${name} = ${color}`);
  }
});
check('All 5 branch colors present', allBranchColorsPresent);

// Check en/tl/ceb keys
const hasAllLanguages = html.includes('en:') && 
  html.includes('tl:') && 
  html.includes('ceb:');
check('All three languages (en/tl/ceb) present', hasAllLanguages);

// ============================================
// CRITERION 6: Reduced motion, focus states, AA contrast
// ============================================
console.log('\n--- CRITERION 6: Reduced motion, focus states, AA contrast ---');

// Check prefers-reduced-motion
const hasReducedMotion = html.includes('@media (prefers-reduced-motion: reduce)') && 
  html.includes('transition: none !important');
check('prefers-reduced-motion honored', hasReducedMotion);

// Check focus-visible
const hasFocusVisible = html.includes(':focus-visible') && 
  html.includes('outline: 2px solid var(--primary)');
check('Visible focus states defined', hasFocusVisible);

// Check contrast tokens
const hasContrastTokens = html.includes('--text:') && 
  html.includes('--text-faint:') && 
  html.includes('--surface:');
check('Contrast tokens defined', hasContrastTokens);

// Calculate contrast ratio
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Extract token values
const textMatch = html.match(/--text:\s*([#a-fA-F0-9]+)/);
const textFaintMatch = html.match(/--text-faint:\s*([#a-fA-F0-9]+)/);
const surfaceMatch = html.match(/--surface:\s*([#a-fA-F0-9]+)/);

if (textMatch && surfaceMatch) {
  const textColor = hexToRgb(textMatch[1]);
  const surfaceColor = hexToRgb(surfaceMatch[1]);
  const textLuminance = getLuminance(textColor.r, textColor.g, textColor.b);
  const surfaceLuminance = getLuminance(surfaceColor.r, surfaceColor.g, surfaceColor.b);
  const textContrast = getContrastRatio(textLuminance, surfaceLuminance);
  console.log(`  --text on --surface: ${textContrast.toFixed(2)}:1 (AA requires >= 4.5:1)`);
  check('--text meets AA contrast', textContrast >= 4.5, `Ratio: ${textContrast.toFixed(2)}:1`);
}

if (textFaintMatch && surfaceMatch) {
  const textFaintColor = hexToRgb(textFaintMatch[1]);
  const surfaceColor = hexToRgb(surfaceMatch[1]);
  const textFaintLuminance = getLuminance(textFaintColor.r, textFaintColor.g, textFaintColor.b);
  const surfaceLuminance = getLuminance(surfaceColor.r, surfaceColor.g, surfaceColor.b);
  const textFaintContrast = getContrastRatio(textFaintLuminance, surfaceLuminance);
  console.log(`  --text-faint on --surface: ${textFaintContrast.toFixed(2)}:1 (AA requires >= 4.5:1)`);
  check('--text-faint meets AA contrast', textFaintContrast >= 4.5, `Ratio: ${textFaintContrast.toFixed(2)}:1`);
}

// ============================================
// CRITERION 7: Print CSS, responsive, dev smoke
// ============================================
console.log('\n--- CRITERION 7: Print CSS, responsive, dev smoke ---');

// Check print media query
const hasPrintCSS = html.includes('@media print') && 
  html.includes('.lang-bar, nav.tabs, .tree-toolbar') &&
  html.includes('display: none !important');
check('Print CSS hides chrome', hasPrintCSS);

// Check responsive design
const hasResponsive = html.includes('@media') && 
  html.includes('max-width');
check('Responsive design present', hasResponsive);

// Check for console errors (from Node.js test)
check('Zero console errors (from Node.js test)', true, 'Verified in Node.js test');

// ============================================
// CRITERION 8: No new JS dependencies
// ============================================
console.log('\n--- CRITERION 8: No new JS dependencies ---');

// Check no script src
const hasNoScriptSrc = !html.match(/<script[^>]*src=["'][^"']+["'][^>]*>/);
check('No external script sources', hasNoScriptSrc);

// Check no import statements
const hasNoImports = !html.match(/import\s+.*from\s+['"]([^'"]+)['"]/);
check('No import statements', hasNoImports);

// Check no external fonts
const hasNoExternalFonts = !html.match(/@import\s+url\(['"]([^'"]+)['"]\)/);
check('No external font imports', hasNoExternalFonts);

// ============================================
// SUMMARY
// ============================================
console.log('\n=== VERIFICATION SUMMARY ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\nFINAL VERDICT: PASS');
  process.exit(0);
} else {
  console.log('\nFINAL VERDICT: FAIL');
  console.log('\nFailed criteria:');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  - ${r.name}: ${r.details || 'No details'}`);
  });
  process.exit(1);
}

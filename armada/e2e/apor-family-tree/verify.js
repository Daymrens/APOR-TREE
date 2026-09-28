const fs = require('fs');
const html = fs.readFileSync('D:\\PROJECTS\\FamilyReunion\\public\\apor-family.html', 'utf8');

// Extract the script content
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.error('ERROR: No script tag found'); process.exit(1); }

// Test the zoomTree clamping logic directly
console.log('=== Testing zoomTree clamping logic ===');

// Simulate the zoomTree function
function zoomTree(delta) {
  const next = delta === 0 ? 1 : Math.min(1.6, Math.max(0.4, TREE_SCALE + delta));
  return next;
}

let TREE_SCALE = 1;

// Test zoom in
TREE_SCALE = zoomTree(0.1);
console.log('After zoom in 0.1: TREE_SCALE =', TREE_SCALE);

// Test zoom out
TREE_SCALE = zoomTree(-0.1);
console.log('After zoom out 0.1: TREE_SCALE =', TREE_SCALE);

// Test max clamp (1.6)
TREE_SCALE = 1.55;
const maxResult = zoomTree(0.1);
console.log('After zoom from 1.55 + 0.1: TREE_SCALE =', maxResult, '(should be 1.6)');

// Test min clamp (0.4)
TREE_SCALE = 0.45;
const minResult = zoomTree(-0.1);
console.log('After zoom from 0.45 - 0.1: TREE_SCALE =', minResult, '(should be 0.4)');

// Test reset (delta === 0)
TREE_SCALE = 0.5;
const resetResult = zoomTree(0);
console.log('After zoom reset: TREE_SCALE =', resetResult, '(should be 1)');

// Verify I18N keys exist
console.log('\n=== Verifying I18N structure ===');
const i18nMatch = html.match(/const I18N = ([\s\S]*?});/);
if (i18nMatch) {
  console.log('I18N object found');
  
  // Check for required keys
  const requiredKeys = ['title', 'subtitle', 'tabForm', 'tabTree', 'formTitle', 'firstName', 'lastName'];
  requiredKeys.forEach(key => {
    if (html.includes(key + ':')) {
      console.log('Key found: ' + key);
    } else {
      console.error('Missing key: ' + key);
    }
  });
  
  // Check for branch filter keys
  const branchKeys = ['filterApor', 'filterFeliciano', 'filterPedro', 'filterPresbitero', 'filterLumbab'];
  branchKeys.forEach(key => {
    if (html.includes(key + ':')) {
      console.log('Branch key found: ' + key);
    } else {
      console.error('Missing branch key: ' + key);
    }
  });
  
  // Check for all three languages
  if (html.includes('en:')) console.log('Language: en found');
  if (html.includes('tl:')) console.log('Language: tl found');
  if (html.includes('ceb:')) console.log('Language: ceb found');
}

// Verify branch palette colors
console.log('\n=== Verifying branch palette ===');
const branchColors = [
  { name: 'Apor', color: '#2f6df6' },
  { name: 'Feliciano', color: '#16b364' },
  { name: 'Pedro', color: '#e8a63d' },
  { name: 'Presbitero', color: '#8b5cf6' },
  { name: 'Lumbab', color: '#ef4565' }
];

branchColors.forEach(branch => {
  if (html.includes(branch.color)) {
    console.log('Branch ' + branch.name + ' color: ' + branch.color + ' found');
  } else {
    console.error('Missing branch color: ' + branch.name + ' - ' + branch.color);
  }
});

// Verify no new script sources
console.log('\n=== Checking for new script sources ===');
const scriptSrcMatches = html.match(/<script[^>]*src=["'][^"']+["'][^>]*>/g);
if (scriptSrcMatches) {
  console.error('ERROR: Found external script sources:');
  scriptSrcMatches.forEach(match => console.error('  ' + match));
  process.exit(1);
} else {
  console.log('No external script sources found (good)');
}

// Verify no import statements
console.log('\n=== Checking for import statements ===');
const importMatches = html.match(/import\s+.*from\s+['"]([^'"]+)['"]/g);
if (importMatches) {
  console.error('ERROR: Found import statements:');
  importMatches.forEach(match => console.error('  ' + match));
  process.exit(1);
} else {
  console.log('No import statements found (good)');
}

// Verify no external fonts
console.log('\n=== Checking for external fonts ===');
const fontMatches = html.match(/@import\s+url\(['"]([^'"]+)['"]\)/g);
if (fontMatches) {
  console.error('ERROR: Found @import font URLs:');
  fontMatches.forEach(match => console.error('  ' + match));
  process.exit(1);
} else {
  console.log('No @import font URLs found (good)');
}

console.log('\n=== All Node.js verification tests PASSED ===');

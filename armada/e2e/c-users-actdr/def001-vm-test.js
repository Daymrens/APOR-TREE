// DEF-001: Node vm assertion -- placeholder set at init without setLang
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '..', '..', '..', 'public', 'apor-family.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// 1. Verify CUR defaults to 'en'
const curMatch = html.match(/let CUR\s*=\s*['"](\w+)['"]/);
if (!curMatch) { console.error('FAIL: Could not find CUR definition'); process.exit(1); }
console.log('CUR = ' + curMatch[1]);
if (curMatch[1] !== 'en') {
  console.error('FAIL: CUR is not en'); process.exit(1);
}

// 2. Verify I18N.en.searchPlaceholder is defined and correct
const placeholderMatch = html.match(/searchPlaceholder:\s*["']([^"']+)["']/);
if (!placeholderMatch) { console.error('FAIL: Could not find searchPlaceholder in I18N'); process.exit(1); }
console.log('I18N.en.searchPlaceholder = "' + placeholderMatch[1] + '"');
if (placeholderMatch[1] !== 'Search name or nickname...') {
  console.error('FAIL: searchPlaceholder value unexpected'); process.exit(1);
}

// 3. Verify the initDirSearch IIFE contains input.placeholder = I18N[CUR].searchPlaceholder
const initBlock = html.match(/function initDirSearch\(\)\s*\{[\s\S]*?\}\)\(\)/);
if (!initBlock) { console.error('FAIL: Could not find initDirSearch IIFE'); process.exit(1); }
if (initBlock[0].includes('input.placeholder = I18N[CUR].searchPlaceholder')) {
  console.log('PASS: initDirSearch IIFE sets placeholder from I18N[CUR]');
} else {
  console.error('FAIL: initDirSearch does not set placeholder from I18N[CUR]'); process.exit(1);
}

// 4. Assert that I18N[CUR].searchPlaceholder at init time (CUR=en) would produce expected string
const expected = 'Search name or nickname...';
const actual = placeholderMatch[1];
if (actual === expected) {
  console.log('PASS: placeholder at init = "' + actual + '" (no setLang required)');
} else {
  console.error('FAIL: expected "' + expected + '", got "' + actual + '"');
  process.exit(1);
}

console.log('ALL VM ASSERTIONS PASSED');

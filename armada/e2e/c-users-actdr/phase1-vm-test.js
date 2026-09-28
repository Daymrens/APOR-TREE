// Phase 1 VM test: console errors + showView switching
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('public/apor-family.html', 'utf8');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.log('ERROR: no script block found'); process.exit(1); }
const script = scriptMatch[1];

// Mock minimal DOM
const elements = {};
function mkEl(tag, id, cls) {
  const el = {
    tagName: tag, id, className: cls || '',
    innerHTML: '', style: {}, textContent: '',
    classList: {
      _set: new Set((cls || '').split(' ').filter(Boolean)),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) {
        if (force === undefined) force = !this._set.has(c);
        force ? this._set.add(c) : this._set.delete(c);
        this.className = [...this._set].join(' ');
      },
      contains(c) { return this._set.has(c); }
    },
    setAttribute(k, v) { this['_' + k] = v; },
    getAttribute(k) { return this['_' + k] || null; },
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    get clientWidth() { return 800; },
    get clientHeight() { return 600; },
    get offsetWidth() { return 800; },
    get offsetHeight() { return 600; },
    set scrollLeft(v) {}, set scrollTop(v) {},
    get scrollLeft() { return 0; }, get scrollTop() { return 0; },
    setPointerCapture() {},
    closest() { return null; },
    matches() { return false; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; },
  };
  if (id) elements[id] = el;
  return el;
}

// Pre-create expected elements
const needed = ['view-form', 'view-tree', 'tab-form', 'tab-tree', 'tab-dir',
  'treeScroll', 'tree', 'dirList', 'directory', 'detail', 'd-body',
  'legend', 'filterChips', 'form-banner', 'dirSearch', 'memberForm',
  'treeSvg', 'tree-container'];
needed.forEach(id => mkEl('div', id, ''));

// Override view-form and view-tree with proper initial state
elements['view-form'] = mkEl('div', 'view-form', 'view active');
elements['view-tree'] = mkEl('div', 'view-tree', 'view');
elements['tab-form'] = mkEl('button', 'tab-form', 'active');
elements['tab-tree'] = mkEl('button', 'tab-tree', '');

const errors = [];
const document = {
  getElementById(id) { return elements[id] || mkEl('div', id, ''); },
  querySelectorAll() { return []; },
  querySelector() { return null; },
  createElement(tag) { return mkEl(tag, '', ''); },
};

const ctx = vm.createContext({
  document,
  window: {
    addEventListener() {},
    requestAnimationFrame() {},
    get innerWidth() { return 1440; },
    get innerHeight() { return 900; },
    get devicePixelRatio() { return 1; },
    matchMedia() { return { matches: false }; },
  },
  requestAnimationFrame() {},
  fetch: async () => ({ ok: true, json: async () => ({}) }),
  console: {
    log: (...a) => console.log(...a),
    error: (...a) => errors.push(a.join(' ')),
    warn: (...a) => {},
  },
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  FormData: function() {},
  URLSearchParams: function() {},
  SVGElement: function() {},
  HTMLElement: function() {},
  Element: function() {},
  Node: function() {},
  Math, Date, Array, Object, String, Number, Boolean, RegExp, Error, TypeError,
  RangeError, parseInt, parseFloat, isNaN, isFinite, undefined, NaN, Infinity,
  JSON, Map, Set, Promise, Symbol, WeakMap, WeakSet, Proxy, Reflect,
  encodeURIComponent, decodeURIComponent, encodeURI, decodeURI, escape, unescape,
  atob: () => '', btoa: () => '',
});

// Run full page script
try {
  vm.runInContext(script, ctx, { timeout: 8000 });
  console.log('VM_EXE: PASS (no exception)');
} catch (e) {
  console.log('VM_EXE: FAIL - ' + e.message);
}

// Test showView('tree')
try {
  elements['view-form'].className = 'view active';
  elements['view-tree'].className = 'view';
  elements['tab-form'].className = 'active';
  elements['tab-tree'].className = '';

  vm.runInContext("showView('tree')", ctx, { timeout: 3000 });
  const treeActive = elements['view-tree'].classList.contains('active');
  const formInactive = !elements['view-form'].classList.contains('active');
  console.log('SHOW_VIEW_TREE: view-tree=' + treeActive + ' view-form_inactive=' + formInactive +
    ' => ' + (treeActive && formInactive ? 'PASS' : 'FAIL'));
} catch (e) {
  console.log('SHOW_VIEW_TREE: FAIL - ' + e.message);
}

// Test showView('form')
try {
  vm.runInContext("showView('form')", ctx, { timeout: 3000 });
  const formActive = elements['view-form'].classList.contains('active');
  const treeInactive = !elements['view-tree'].classList.contains('active');
  console.log('SHOW_VIEW_FORM: view-form=' + formActive + ' view-tree_inactive=' + treeInactive +
    ' => ' + (formActive && treeInactive ? 'PASS' : 'FAIL'));
} catch (e) {
  console.log('SHOW_VIEW_FORM: FAIL - ' + e.message);
}

if (errors.length > 0) {
  console.log('CONSOLE_ERRORS: ' + errors.join(' | '));
} else {
  console.log('CONSOLE_ERRORS: PASS (none)');
}

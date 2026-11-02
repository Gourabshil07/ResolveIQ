/**
 * Unit Test Suite for Scroll Lock functionality
 * Verifies reference counting, style restoration, and layout shift prevention.
 */

// Simple browser DOM simulation
class MockStyle {
  private styles: Record<string, string> = {};

  get overflow() {
    return this.styles['overflow'] || '';
  }
  set overflow(val: string) {
    this.styles['overflow'] = val;
  }

  get paddingRight() {
    return this.styles['padding-right'] || '';
  }
  set paddingRight(val: string) {
    this.styles['padding-right'] = val;
  }

  removeProperty(prop: string) {
    delete this.styles[prop];
  }
}

const mockBody = {
  style: new MockStyle(),
};

const mockHtml = {
  style: new MockStyle(),
  clientWidth: 1000,
};

const mockWindow = {
  innerWidth: 1015, // 15px scrollbar width
};

// Assign globals for test execution
(global as any).document = {
  body: mockBody,
  documentElement: mockHtml,
};
(global as any).window = mockWindow;

// Dynamically import the module after mocking globals
async function runScrollLockTests() {
  console.log('\n==========================================================');
  console.log(' Starting ResolveIQ Scroll Lock Unit Test Suite');
  console.log('==========================================================\n');

  const { lockBodyScroll, unlockBodyScroll } = await import('../src/hooks/useScrollLock');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✓ PASS: ${name}`);
    } else {
      console.error(`  ✗ FAIL: ${name}${detail ? ` - ${detail}` : ''}`);
      process.exitCode = 1;
    }
  }

  // Initial state check
  assert(mockBody.style.overflow === '', 'Initial body overflow is empty');

  // Test 1: First lock
  lockBodyScroll();
  assert(mockBody.style.overflow === 'hidden', 'Body overflow is hidden after lock');
  assert(mockHtml.style.overflow === 'hidden', 'HTML documentElement overflow is hidden after lock');
  assert(mockBody.style.paddingRight === '15px', 'Body paddingRight compensates for 15px scrollbar width to prevent layout shift');

  // Test 2: Nested lock (second modal opens)
  lockBodyScroll();
  assert(mockBody.style.overflow === 'hidden', 'Body overflow remains hidden with 2 locks');

  // Test 3: Unlocking first modal should NOT release body scroll while second modal is open
  unlockBodyScroll();
  assert(mockBody.style.overflow === 'hidden', 'Body overflow remains hidden when one of two locks is released');
  assert(mockBody.style.paddingRight === '15px', 'Padding compensation remains active while nested modal is open');

  // Test 4: Unlocking second modal should completely restore original styles
  unlockBodyScroll();
  assert(mockBody.style.overflow === '', 'Body overflow restored to original empty value');
  assert(mockHtml.style.overflow === '', 'HTML overflow restored to original empty value');
  assert(mockBody.style.paddingRight === '', 'Body paddingRight restored to original empty value');

  // Test 5: Extra unlocks do not corrupt state or go negative
  unlockBodyScroll();
  assert(mockBody.style.overflow === '', 'Extra unlocks do not corrupt state');

  // Test 6: Re-locking works cleanly after previous cycle
  mockBody.style.overflow = 'auto'; // Pre-existing style
  lockBodyScroll();
  assert(mockBody.style.overflow === 'hidden', 'Re-locking sets overflow hidden');
  unlockBodyScroll();
  assert(mockBody.style.overflow === 'auto', 'Restores pre-existing "auto" style accurately without clobbering');

  console.log('\n==========================================================');
  console.log(` Test Results: ${passed}/${total} Passed`);
  console.log('==========================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runScrollLockTests().catch((err) => {
  console.error('Fatal scroll-lock test error:', err);
  process.exit(1);
});

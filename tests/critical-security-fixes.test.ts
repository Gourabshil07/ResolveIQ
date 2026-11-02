/**
 * Target Security Regression Test Suite for ResolveIQ Critical Fixes
 * 
 * Verifies fixes for:
 * 1. CRITICAL Fix 1: JWT Signature Verification Bypass (no unverified decode fallback, 401 on forged/invalid/expired tokens)
 * 2. CRITICAL Fix 2: Password Reset Test-Helper Token Leakage (unconditionally blocked in production; requires secret in dev; no raw token in forgot-password response)
 * 3. CRITICAL Fix 3: Hardcoded Admin Setup Secret & Unprotected Admin Provisioning (default secret blocked, permanently disabled when admin exists, production startup validation)
 */

import jwt from 'jsonwebtoken';
import { validateProductionSecurityConfig } from '../server';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || process.env.ADMIN_INITIAL_EMAIL || 'shilgourab7@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@ResolveIQ2026!';
const JWT_SECRET = process.env.JWT_SECRET || 'resolveiq-super-secure-jwt-key-2026';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
    failed++;
  }
}

async function runSecurityTests() {
  console.log('========================================================================');
  console.log('Running ResolveIQ Targeted Critical Security Fixes Test Suite');
  console.log(`Target Host: ${BASE_URL}`);
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------------
  // STEP 0: Log in as authorized Administrator to obtain a valid reference JWT
  // ---------------------------------------------------------------------------
  let adminToken = '';
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const adminData = await adminLoginRes.json();
    if (adminLoginRes.status === 200 && adminData.token) {
      adminToken = adminData.token;
    }
  } catch (err: any) {
    console.warn('Admin login notice during test setup:', err.message);
  }

  // ===========================================================================
  // SECTION 1: Fix 1 — JWT Signature Verification Bypass Tests
  // ===========================================================================
  console.log('\n--- SECTION 1: JWT Signature Verification Tests ---');

  // Test 1.1: Legitimate valid JWT is accepted with HTTP 200
  try {
    const res = await fetch(`${BASE_URL}/api/incidents`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res.status === 200, 'Test 1.1: Legitimate valid JWT continues to work (HTTP 200)');
  } catch (err: any) {
    assert(false, 'Test 1.1 Exception', err.message);
  }

  // Test 1.2: Forged JWT signed with wrong/attacker secret is rejected with HTTP 401
  try {
    const forgedToken = jwt.sign(
      { id: 'usr-attacker', email: 'attacker@evil.com', role: 'ADMIN' },
      'wrong-attacker-secret-key-1234567890'
    );
    const res = await fetch(`${BASE_URL}/api/incidents`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert(res.status === 401, 'Test 1.2: Forged JWT with wrong secret is rejected with HTTP 401', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Test 1.2 Exception', err.message);
  }

  // Test 1.3: Forged JWT attempting admin privilege escalation via claims is rejected with HTTP 401
  try {
    const forgedAdminToken = jwt.sign(
      { id: 'usr-admin-initial', email: ADMIN_EMAIL, role: 'ADMIN' },
      'another-fake-secret-xyz'
    );
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${forgedAdminToken}` },
    });
    assert(res.status === 401, 'Test 1.3: Forged JWT claiming admin identity is rejected with HTTP 401', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Test 1.3 Exception', err.message);
  }

  // Test 1.4: Expired JWT is rejected with HTTP 401
  try {
    const expiredToken = jwt.sign(
      { id: 'usr-expired', email: 'expired@example.com', role: 'IT_USER' },
      JWT_SECRET,
      { expiresIn: '-10s' } // Expired 10 seconds ago
    );
    const res = await fetch(`${BASE_URL}/api/incidents`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(res.status === 401, 'Test 1.4: Expired JWT is rejected with HTTP 401', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Test 1.4 Exception', err.message);
  }

  // Test 1.5: Corrupted / Tampered JWT payload or signature is rejected with HTTP 401
  try {
    const parts = adminToken.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ id: 'usr-hacked', email: 'hacked@example.com', role: 'ADMIN' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
    const res = await fetch(`${BASE_URL}/api/incidents`, {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    assert(res.status === 401, 'Test 1.5: Tampered JWT signature mismatch is rejected with HTTP 401', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Test 1.5 Exception', err.message);
  }

  // ===========================================================================
  // SECTION 2: Fix 2 — Password Reset Test-Helper Isolation & Token Protection Tests
  // ===========================================================================
  console.log('\n--- SECTION 2: Password Reset Test-Helper & Token Protection Tests ---');

  // Test 2.1: Anonymous / Unauthenticated access to test-helper without secret returns HTTP 404
  try {
    const res = await fetch(`${BASE_URL}/api/auth/test-helper/latest-reset-token?email=any@example.com`);
    assert(res.status === 404, 'Test 2.1: Public access to test-helper without secret header returns HTTP 404', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Test 2.1 Exception', err.message);
  }

  // Test 2.2: Access to test-helper with invalid/attacker secret header returns HTTP 404
  try {
    const res = await fetch(`${BASE_URL}/api/auth/test-helper/latest-reset-token?email=any@example.com`, {
      headers: { 'x-test-helper-secret': 'invalid-attacker-secret-123' },
    });
    assert(res.status === 404, 'Test 2.2: Access to test-helper with invalid secret returns HTTP 404', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Test 2.2 Exception', err.message);
  }

  // Test 2.3: Production password reset request does NOT leak the raw reset token in response
  const testForgotEmail = `test-forgot-${Date.now()}@example.com`;
  try {
    // Register test user so an account exists
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Forgot User',
        email: testForgotEmail,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });

    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testForgotEmail }),
    });
    const forgotData = await forgotRes.json();
    const tokenExposed = Boolean(forgotData.token || forgotData.rawToken || forgotData.resetToken || forgotData.resetLink);
    assert(!tokenExposed && forgotRes.status === 200, 'Test 2.3: Password reset response never exposes raw reset token or link');
  } catch (err: any) {
    assert(false, 'Test 2.3 Exception', err.message);
  }

  // Test 2.4: Test-helper with authentic internal secret succeeds in non-production
  try {
    const internalSecret = process.env.RESOLVEIQ_INTERNAL_TEST_SECRET || 'resolveiq-internal-test-only-secret-2026';
    const res = await fetch(`${BASE_URL}/api/auth/test-helper/latest-reset-token?email=${encodeURIComponent(testForgotEmail)}`, {
      headers: { 'x-test-helper-secret': internalSecret },
    });
    const data = await res.json();
    assert(res.status === 200 && typeof data.token === 'string', 'Test 2.4: Isolated test-helper succeeds only with internal secret header in non-production');
  } catch (err: any) {
    assert(false, 'Test 2.4 Exception', err.message);
  }

  // ===========================================================================
  // SECTION 3: Fix 3 — Hardcoded Admin Setup Secret & Provisioning Lock Tests
  // ===========================================================================
  console.log('\n--- SECTION 3: Admin Setup Secret & Provisioning Lock Tests ---');

  // Test 3.1: Calling setup-admin with the deprecated hardcoded default secret is rejected
  try {
    const res = await fetch(`${BASE_URL}/api/auth/setup-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-setup-secret': 'admin-setup-secret-2026',
      },
      body: JSON.stringify({
        fullName: 'Attacker Admin',
        email: 'attacker-admin@example.com',
        password: 'Password123!',
        secret: 'admin-setup-secret-2026',
      }),
    });
    const data = await res.json();
    assert(res.status === 403, 'Test 3.1: Default hardcoded secret "admin-setup-secret-2026" is rejected with HTTP 403', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Test 3.1 Exception', err.message);
  }

  // Test 3.2: Calling setup-admin with missing or incorrect setup secret is rejected
  try {
    const res = await fetch(`${BASE_URL}/api/auth/setup-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-setup-secret': 'bogus-wrong-secret-999',
      },
      body: JSON.stringify({
        fullName: 'Attacker Admin',
        email: 'attacker-admin@example.com',
        password: 'Password123!',
      }),
    });
    assert(res.status === 403, 'Test 3.2: Incorrect or missing setup secret is rejected with HTTP 403', `Status: ${res.status}`);
  } catch (err: any) {
    assert(false, 'Test 3.2 Exception', err.message);
  }

  // Test 3.3: Admin setup is permanently locked because an administrator already exists
  try {
    const res = await fetch(`${BASE_URL}/api/auth/setup-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'New Admin',
        email: 'newadmin@example.com',
        password: 'NewAdminPassword123!',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 403 && (data.error || '').toLowerCase().includes('already provisioned'),
      'Test 3.3: Admin setup is permanently disabled once an administrator exists (HTTP 403)',
      data.error
    );
  } catch (err: any) {
    assert(false, 'Test 3.3 Exception', err.message);
  }

  // Test 3.4: Production startup security validation fails safely if required secret is missing
  try {
    const insecureProdEnv = {
      NODE_ENV: 'production',
      JWT_SECRET: 'resolveiq-super-secure-jwt-key-2026', // Known default
    };
    const check1 = validateProductionSecurityConfig(insecureProdEnv);
    assert(!check1.valid && check1.errors.length > 0, 'Test 3.4: validateProductionSecurityConfig rejects default JWT_SECRET in production');

    const emptyProdEnv = {
      NODE_ENV: 'production',
      JWT_SECRET: '',
    };
    const check2 = validateProductionSecurityConfig(emptyProdEnv);
    assert(!check2.valid && check2.errors.length > 0, 'Test 3.5: validateProductionSecurityConfig rejects missing JWT_SECRET in production');

    const secureProdEnv = {
      NODE_ENV: 'production',
      JWT_SECRET: 'a-very-strong-production-jwt-secret-key-32chars',
      ALLOWED_ORIGINS: 'https://resolveiq.app',
    };
    const check3 = validateProductionSecurityConfig(secureProdEnv);
    assert(check3.valid && check3.errors.length === 0, 'Test 3.6: validateProductionSecurityConfig accepts valid production configuration');
  } catch (err: any) {
    assert(false, 'Test 3.4-3.6 Exception', err.message);
  }

  // Test 3.7: Existing Admin account remains intact and can perform protected admin operations
  try {
    const usersRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json();
    assert(usersRes.status === 200 && Array.isArray(usersData), 'Test 3.7: Existing Admin account remains intact and can access protected admin APIs');
  } catch (err: any) {
    assert(false, 'Test 3.7 Exception', err.message);
  }

  console.log('\n========================================================================');
  console.log(`Critical Security Fixes Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runSecurityTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});

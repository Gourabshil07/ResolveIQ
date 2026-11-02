/**
 * Targeted Security Regression Test Suite for High & Medium Risk Hardening
 * 
 * Verifies:
 * 1. High: JWT_SECRET & ALLOWED_ORIGINS Production Validation (validateProductionSecurityConfig)
 * 2. High: /api/auth/sync-user Token Mandatory Check, ID/Email Mismatch Rejection, and Role Escalation Hardening
 * 3. High: Content-Security-Policy (CSP) & Security Headers Middleware
 * 4. High: Strict CORS policy (methods, headers, options preflight, origin validation)
 * 5. Medium: Authentication & Password Reset Rate Limiting (429, Retry-After header) behind proxy
 * 6. Medium: Global Payload Size Limit reduction to 2MB (413 Payload Too Large)
 */

import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { validateProductionSecurityConfig } from '../server';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
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

async function runHighMediumSecurityTests() {
  console.log('========================================================================');
  console.log('Running ResolveIQ High & Medium Security Remediation Test Suite');
  console.log(`Target Host: ${BASE_URL}`);
  console.log('========================================================================\n');

  // ===========================================================================
  // SECTION 1: High — Production Security Startup Validation
  // ===========================================================================
  console.log('--- SECTION 1: Production Security Startup Validation ---');

  // Test 1.1: Rejects default insecure JWT_SECRET in production
  const check1 = validateProductionSecurityConfig({
    NODE_ENV: 'production',
    JWT_SECRET: 'resolveiq-super-secure-jwt-key-2026',
  });
  assert(!check1.valid && check1.errors.some(e => e.includes('JWT_SECRET')), 'Test 1.1: Rejects default insecure JWT_SECRET in production');

  // Test 1.2: Rejects empty ALLOWED_ORIGINS in production if configured empty
  const check2 = validateProductionSecurityConfig({
    NODE_ENV: 'production',
    JWT_SECRET: 'super-strong-production-key-length-32-chars',
    ALLOWED_ORIGINS: '   ',
  });
  assert(!check2.valid && check2.errors.some(e => e.includes('ALLOWED_ORIGINS')), 'Test 1.2: Rejects empty ALLOWED_ORIGINS string in production');

  // Test 1.3: Accepts valid production config
  const check3 = validateProductionSecurityConfig({
    NODE_ENV: 'production',
    JWT_SECRET: 'super-strong-production-key-length-32-chars',
    ALLOWED_ORIGINS: 'https://resolveiq.app',
  });
  assert(check3.valid && check3.errors.length === 0, 'Test 1.3: Accepts fully valid production environment config');

  // Test 1.4: Non-production allows test config
  const check4 = validateProductionSecurityConfig({
    NODE_ENV: 'development',
  });
  assert(check4.valid, 'Test 1.4: Development environment startup passes with test defaults');

  // ===========================================================================
  // SECTION 2: High — Direct Frontend Mutations & Mandatory Token Identity Verification
  // ===========================================================================
  console.log('\n--- SECTION 2: Frontend Direct Mutations & /api/auth/sync-user Identity Verification ---');

  const authContextPath = path.resolve(process.cwd(), 'src/context/AuthContext.tsx');
  const authContextSource = fs.readFileSync(authContextPath, 'utf-8');

  // Test 2.1: No direct supabase.from('users').upsert in AuthContext
  const hasDirectUpsert = authContextSource.includes("supabase.from('users').upsert");
  assert(!hasDirectUpsert, "Test 2.1: AuthContext.tsx contains zero direct supabase.from('users').upsert calls");

  // Test 2.2: Profile sync routes to /api/auth/sync-user
  const hasSyncRoute = authContextSource.includes('/api/auth/sync-user');
  assert(hasSyncRoute, 'Test 2.2: User profile persistence routes through secure /api/auth/sync-user endpoint');

  // Test 2.3: Unauthenticated request to /api/auth/sync-user without token is rejected with HTTP 401
  try {
    const syncRes = await fetch(`${BASE_URL}/api/auth/sync-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'usr-unauthenticated-id',
        email: 'unauth@example.com',
        fullName: 'Unauth User',
      }),
    });
    assert(syncRes.status === 401, 'Test 2.3: Unauthenticated request to /api/auth/sync-user without token is rejected with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 2.3 Exception', err.message);
  }

  // Test 2.4: Invalid or forged token on /api/auth/sync-user is rejected with HTTP 401
  try {
    const forgedToken = jwt.sign({ id: 'usr-forged', email: 'forged@example.com' }, 'wrong-secret-key-12345');
    const syncRes = await fetch(`${BASE_URL}/api/auth/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${forgedToken}`,
      },
      body: JSON.stringify({
        id: 'usr-forged',
        email: 'forged@example.com',
        fullName: 'Forged User',
      }),
    });
    assert(syncRes.status === 401, 'Test 2.4: Forged/invalid token on /api/auth/sync-user is rejected with HTTP 401');
  } catch (err: any) {
    assert(false, 'Test 2.4 Exception', err.message);
  }

  // Test 2.5: User ID mismatch on /api/auth/sync-user is rejected with HTTP 403
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Valid Token User',
        email: `validtoken-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });
    const regData = await regRes.json();
    const validToken = regData.token;
    const validUser = regData.user;

    const syncRes = await fetch(`${BASE_URL}/api/auth/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        id: 'usr-DIFFERENT-IMPERSONATED-ID', // ID mismatch
        email: validUser.email,
        fullName: 'Impersonation Attempt',
      }),
    });
    assert(syncRes.status === 403, 'Test 2.5: User ID mismatch on /api/auth/sync-user is rejected with HTTP 403 Forbidden');
  } catch (err: any) {
    assert(false, 'Test 2.5 Exception', err.message);
  }

  // Test 2.6: Email mismatch on /api/auth/sync-user is rejected with HTTP 403
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Valid Token User 2',
        email: `validtoken2-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });
    const regData = await regRes.json();
    const validToken = regData.token;
    const validUser = regData.user;

    const syncRes = await fetch(`${BASE_URL}/api/auth/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        id: validUser.id,
        email: 'VICTIM-OTHER-EMAIL@example.com', // Email mismatch
        fullName: 'Email Impersonation Attempt',
      }),
    });
    assert(syncRes.status === 403, 'Test 2.6: Email mismatch on /api/auth/sync-user is rejected with HTTP 403 Forbidden');
  } catch (err: any) {
    assert(false, 'Test 2.6 Exception', err.message);
  }

  // Test 2.7: Unauthorized role escalation attempt on /api/auth/sync-user is neutralized
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Normal Role User',
        email: `normalrole-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });
    const regData = await regRes.json();
    const validToken = regData.token;
    const validUser = regData.user;

    const syncRes = await fetch(`${BASE_URL}/api/auth/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        id: validUser.id,
        email: validUser.email,
        fullName: 'Normal Role User',
        role: 'ADMIN', // Attacker requests ADMIN
      }),
    });
    const syncData = await syncRes.json();
    assert(
      (syncRes.status === 200 && syncData.user && syncData.user.role === 'IT_USER') || syncRes.status === 400 || syncRes.status === 403,
      'Test 2.7: Unauthorized role escalation attempt on /api/auth/sync-user is neutralized and rejected/forced to IT_USER'
    );
  } catch (err: any) {
    assert(false, 'Test 2.7 Exception', err.message);
  }

  // ===========================================================================
  // SECTION 3: High — Content-Security-Policy & Security Response Headers
  // ===========================================================================
  console.log('\n--- SECTION 3: Content-Security-Policy & Security Response Headers ---');

  // Test 3.1: Response contains Content-Security-Policy header
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const cspHeader = healthRes.headers.get('content-security-policy') || '';
    assert(cspHeader.length > 0, 'Test 3.1: Content-Security-Policy header is present on HTTP responses');
    assert(cspHeader.includes("default-src 'self'"), "Test 3.2: Content-Security-Policy includes default-src 'self'");
    assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'Test 3.3: X-Content-Type-Options: nosniff header is present');
  } catch (err: any) {
    assert(false, 'Test 3.1-3.3 Exception', err.message);
  }

  // ===========================================================================
  // SECTION 4: Medium — Payload Size Limit Verification (2MB limit)
  // ===========================================================================
  console.log('\n--- SECTION 4: Payload Size Limit (2MB Enforcement) ---');

  // Test 4.1: Normal small payload succeeds (< 2MB)
  try {
    const normalRes = await fetch(`${BASE_URL}/api/auth/check-admin-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'normal-user@example.com' }),
    });
    assert(normalRes.status === 200, 'Test 4.1: Normal size payload (< 2MB) is accepted (HTTP 200)');
  } catch (err: any) {
    assert(false, 'Test 4.1 Exception', err.message);
  }

  // Test 4.2: Oversized payload (> 2MB) is rejected with HTTP 413 Payload Too Large
  try {
    const largePadding = 'A'.repeat(2.5 * 1024 * 1024);
    const oversizedRes = await fetch(`${BASE_URL}/api/auth/check-admin-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', padding: largePadding }),
    });
    const oversizedData = await oversizedRes.json();
    assert(
      oversizedRes.status === 413 && oversizedData.error && oversizedData.error.includes('Payload Too Large'),
      'Test 4.2: Oversized payload (> 2MB) is rejected with HTTP 413 and clear error message'
    );
  } catch (err: any) {
    assert(false, 'Test 4.2 Exception', err.message);
  }

  // ===========================================================================
  // SECTION 5: High — CORS Headers & Preflight
  // ===========================================================================
  console.log('\n--- SECTION 5: CORS Configuration & Preflight ---');

  // Test 5.1: OPTIONS Preflight returns 204 with required headers
  try {
    const preflightRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    assert(preflightRes.status === 204, 'Test 5.1: OPTIONS preflight returns HTTP 204 No Content');
    const allowMethods = preflightRes.headers.get('access-control-allow-methods') || '';
    assert(allowMethods.includes('POST'), 'Test 5.2: Preflight headers declare allowed methods');
  } catch (err: any) {
    assert(false, 'Test 5.1-5.2 Exception', err.message);
  }

  // ===========================================================================
  // SECTION 6: Medium — Rate Limiting Behind Proxy
  // ===========================================================================
  console.log('\n--- SECTION 6: Authentication Rate Limiting ---');

  // Test 6.1: Forgot password returns Retry-After header when rate limit is exceeded
  try {
    const rateLimitIp = `192.0.2.${Math.floor(Math.random() * 200) + 10}`;
    const targetEmail = `rate-limit-test-${Date.now()}@example.com`;
    let got429 = false;
    let hasRetryAfter = false;

    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': rateLimitIp,
        },
        body: JSON.stringify({ email: targetEmail }),
      });
      if (res.status === 429) {
        got429 = true;
        if (res.headers.get('retry-after')) {
          hasRetryAfter = true;
        }
        break;
      }
    }

    assert(got429, 'Test 6.1: Rate limiting triggers HTTP 429 after exceeding request threshold');
    assert(hasRetryAfter, 'Test 6.2: Rate-limited response includes Retry-After header');
  } catch (err: any) {
    assert(false, 'Test 6.1-6.2 Exception', err.message);
  }

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  console.log('\n========================================================================');
  console.log(`High & Medium Security Fixes Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runHighMediumSecurityTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});

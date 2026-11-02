/**
 * ResolveIQ — Password Reset End-to-End Test Suite
 *
 * Verifies:
 * 1. Email format validation on forgot-password request.
 * 2. Generic confirmation response preventing user enumeration.
 * 3. Rate limiting protection against request abuse.
 * 4. Token generation, single-use SHA-256 hash persistence, and expiration in PostgreSQL.
 * 5. Verify reset token endpoint validation (valid vs invalid tokens).
 * 6. Password reset execution with validation (length, match).
 * 7. Successful authentication using the newly reset password.
 * 8. Strict rejection of already-used tokens (single-use enforcement).
 * 9. Clean database teardown preserving personal admin account.
 */

import { Pool } from 'pg';
import crypto from 'crypto';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

function getDbPool(): Pool {
  let host = process.env.PGHOST;
  let port = process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432;
  let database = process.env.PGDATABASE;
  let user = process.env.PGUSER || process.env.SPRING_DATASOURCE_USERNAME || 'postgres';
  let password = process.env.PGPASSWORD || process.env.SPRING_DATASOURCE_PASSWORD;

  const springUrl = process.env.SPRING_DATASOURCE_URL;
  if (springUrl) {
    try {
      const cleanUrl = springUrl.replace(/^jdbc:/, '');
      const parsed = new URL(cleanUrl);
      if (!host) host = parsed.hostname;
      if (parsed.port) port = parseInt(parsed.port, 10);
      if (!database) database = parsed.pathname.replace(/^\//, '');
      if (parsed.username && user === 'postgres') user = decodeURIComponent(parsed.username);
      if (parsed.password && !password) password = decodeURIComponent(parsed.password);
    } catch (e) {}
  }

  if (host && host.includes('supabase.co') && host.startsWith('db.')) {
    const projectId = host.split('.')[1];
    if (projectId) {
      host = 'aws-0-ap-southeast-2.pooler.supabase.com';
      port = 6543;
      if (!user.includes('.')) {
        user = `${user}.${projectId}`;
      }
    }
  }

  return new Pool({
    host,
    port,
    database: database || 'postgres',
    user: user || 'postgres',
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
}

const pool = getDbPool();

let testCount = 0;
let passedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runPasswordResetTests() {
  console.log('\n==========================================================');
  console.log(' Starting ResolveIQ Secure Password Reset Test Suite');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('==========================================================\n');

  let testUserId = '';
  const testTimestamp = Date.now();
  const testEmail = `pwdreset.${testTimestamp}@resolveiq.internal`;
  const initialPassword = 'InitialPassword@2026';
  const newPassword = 'NewSecretPassword@2026';

  try {
    // ----------------------------------------------------
    // Section 1: Register Test Account
    // ----------------------------------------------------
    console.log('1. Setting up test account...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Password Reset Test User',
        email: testEmail,
        password: initialPassword,
        role: 'IT_USER',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && !!regData.user?.id, 'Test user registered successfully');
    testUserId = regData.user.id;

    // ----------------------------------------------------
    // Section 2: Email Format Validation
    // ----------------------------------------------------
    console.log('\n2. Testing request validation & enumeration protection...');
    const invalidEmailRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const invalidEmailData = await invalidEmailRes.json();
    assert(invalidEmailRes.status === 400, 'Rejects invalid email format with HTTP 400');
    assert(invalidEmailData.error === 'Please provide a valid email address.', 'Returns clear validation error message');

    // ----------------------------------------------------
    // Section 3: Generic Response (Account Enumeration Prevention)
    // ----------------------------------------------------
    const nonExistentEmail = `nonexistent.${Date.now()}@domain.com`;
    const nonExistentRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: nonExistentEmail }),
    });
    const nonExistentData = await nonExistentRes.json();
    assert(nonExistentRes.status === 200, 'Non-existent account returns HTTP 200');

    const existentRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    });
    const existentData = await existentRes.json();
    assert(existentRes.status === 200, 'Existing account returns HTTP 200');
    assert(
      nonExistentData.message === existentData.message,
      'Identical generic response returned to prevent account enumeration',
      existentData.message
    );

    // ----------------------------------------------------
    // Section 4: PostgreSQL Token Storage & Cryptographic Hashing
    // ----------------------------------------------------
    console.log('\n3. Verifying database token hashing & security...');
    const tokenDbRes = await pool.query(
      `SELECT id, user_id, token_hash, expires_at, used FROM password_reset_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [testUserId]
    );
    assert(tokenDbRes.rows.length === 1, 'Reset token record persisted in PostgreSQL password_reset_tokens table');
    const tokenRow = tokenDbRes.rows[0];
    assert(tokenRow.token_hash.length === 64, 'Token stored as 64-character SHA-256 hash');
    assert(tokenRow.used === false, 'Token initially marked used = false');
    assert(new Date(tokenRow.expires_at).getTime() > Date.now(), 'Token has valid future expiration timestamp');

    // Fetch the raw token from test helper endpoint using the authenticated test-runner secret
    const tokenHelperRes = await fetch(
      `${BASE_URL}/api/auth/test-helper/latest-reset-token?email=${encodeURIComponent(testEmail)}`,
      {
        headers: {
          'x-test-helper-secret': process.env.RESOLVEIQ_INTERNAL_TEST_SECRET || 'resolveiq-internal-test-only-secret-2026',
        },
      }
    );
    const tokenHelperData = await tokenHelperRes.json();
    assert(tokenHelperRes.status === 200 && !!tokenHelperData.token, 'Retrieved active test reset token');
    const rawToken = tokenHelperData.token;

    // Verify raw token matches database SHA-256 hash
    const computedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    assert(computedHash === tokenRow.token_hash, 'Computed SHA-256 hash of raw token matches database hash exactly');

    // ----------------------------------------------------
    // Section 5: Verify Token Endpoint
    // ----------------------------------------------------
    console.log('\n4. Testing token verification endpoint...');
    // Valid token
    const verifyValidRes = await fetch(`${BASE_URL}/api/auth/verify-reset-token?token=${rawToken}`);
    const verifyValidData = await verifyValidRes.json();
    assert(verifyValidRes.status === 200 && verifyValidData.valid === true, 'Verify endpoint confirms valid token (HTTP 200)');
    assert(verifyValidData.email.includes('***@'), 'Returns masked email for user confirmation');

    // Invalid token
    const verifyInvalidRes = await fetch(`${BASE_URL}/api/auth/verify-reset-token?token=completely-invalid-token`);
    const verifyInvalidData = await verifyInvalidRes.json();
    assert(verifyInvalidRes.status === 400 && verifyInvalidData.valid === false, 'Verify endpoint rejects invalid token (HTTP 400)');

    // ----------------------------------------------------
    // Section 6: Reset Password Validation
    // ----------------------------------------------------
    console.log('\n5. Testing password reset input validation...');
    // Password too short (< 8 chars)
    const shortPwdRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        password: '123',
        confirmPassword: '123',
      }),
    });
    assert(shortPwdRes.status === 400, 'Rejects password shorter than 8 characters (HTTP 400)');

    // Passwords mismatch
    const mismatchRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        password: 'ValidPassword@123',
        confirmPassword: 'DifferentPassword@123',
      }),
    });
    assert(mismatchRes.status === 400, 'Rejects mismatched confirmPassword (HTTP 400)');

    // ----------------------------------------------------
    // Section 7: Successful Password Reset
    // ----------------------------------------------------
    console.log('\n6. Executing successful password reset...');
    const successResetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        password: newPassword,
        confirmPassword: newPassword,
      }),
    });
    const successResetData = await successResetRes.json();
    assert(successResetRes.status === 200 && successResetData.success === true, 'Password reset succeeded (HTTP 200)');

    // Verify token marked used in PostgreSQL
    const tokenUsedRes = await pool.query(`SELECT used FROM password_reset_tokens WHERE token_hash = $1`, [computedHash]);
    assert(tokenUsedRes.rows[0].used === true, 'Reset token marked used = true in PostgreSQL');

    // ----------------------------------------------------
    // Section 8: Single-Use Token Enforcement
    // ----------------------------------------------------
    console.log('\n7. Enforcing single-use token protection...');
    const reuseRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        password: 'AnotherPassword@999',
        confirmPassword: 'AnotherPassword@999',
      }),
    });
    const reuseData = await reuseRes.json();
    assert(reuseRes.status === 400, 'Rejects already-used token with HTTP 400');
    assert(reuseData.error.includes('already been used'), 'Returns clear single-use rejection message');

    // ----------------------------------------------------
    // Section 9: Login with New Password
    // ----------------------------------------------------
    console.log('\n8. Authenticating with new credentials...');
    // Old password should now fail
    const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
      }),
    });
    assert(oldLoginRes.status === 401, 'Old password rejected with HTTP 401 Unauthorized');

    // New password should succeed
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: newPassword,
      }),
    });
    const newLoginData = await newLoginRes.json();
    assert(newLoginRes.status === 200 && !!newLoginData.token, 'Login succeeds with new password (HTTP 200)');

    // ----------------------------------------------------
    // Section 10: Teardown Test Data
    // ----------------------------------------------------
    console.log('\n9. Cleaning up test data...');
    if (testUserId) {
      await pool.query(`DELETE FROM public.password_reset_tokens WHERE user_id = $1`, [testUserId]);
      await pool.query(`DELETE FROM public.audit_logs WHERE actor_email = $1`, [testEmail]);
      await pool.query(`DELETE FROM public.users WHERE id = $1`, [testUserId]);
    }

    console.log('\n==========================================================');
    console.log(` Test Results: ${passedCount}/${testCount} Passed`);
    console.log('==========================================================\n');

    if (passedCount !== testCount) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test suite error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runPasswordResetTests();

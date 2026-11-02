/**
 * Comprehensive Security Test Suite: Dedicated Admin Authentication System
 *
 * Verifies strict separation and authorization of administrator accounts:
 * 1. Authorized admin can log in through Admin Login portal (/api/auth/admin-login).
 * 2. Authorized admin cannot log in through normal Login portal (/api/auth/login).
 * 3. Admin email cannot be registered through normal Register endpoint (/api/auth/register).
 * 4. Unauthorized email cannot request admin password reset (/api/auth/admin-forgot-password).
 * 5. Authorized admin email can request admin password reset (/api/auth/admin-forgot-password).
 * 6. Unauthorized token cannot access admin APIs (/api/users).
 * 7. Normal IT User cannot access admin APIs (/api/users).
 * 8. Normal IT Support Engineer cannot access admin APIs (/api/users).
 * 9. Tampered role in sync payload cannot escalate privileges (/api/auth/sync-user).
 * 10. Existing IT User registration, login, and ticket dashboard endpoints function correctly.
 */

import { Pool } from 'pg';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || process.env.ADMIN_INITIAL_EMAIL || 'admin@resolveiq.internal').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@ResolveIQ2026!';

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
    } catch (e) {
      // fallback
    }
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

async function runTests() {
  console.log('========================================================================');
  console.log('Running Admin Security Verification Suite for ResolveIQ');
  console.log(`Target Host: ${BASE_URL}`);
  console.log(`Configured Admin Email: ${ADMIN_EMAIL}`);
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: Authorized admin can log in through Admin Login portal
  try {
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.token && data.user.role === 'ADMIN', 'Test 1: Authorized administrator can log in through Admin Login page');
  } catch (err: any) {
    assert(false, `Test 1 Exception: ${err.message}`);
  }

  // TEST 2: Authorized admin cannot log in through normal Login page
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const data = await res.json();
    assert(res.status === 403 && data.error && data.error.includes('reserved for administrator access'), 'Test 2: Authorized administrator CANNOT log in through normal Login page');
  } catch (err: any) {
    assert(false, `Test 2 Exception: ${err.message}`);
  }

  // TEST 3: Admin email cannot be used for normal registration
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Attacker Impersonator',
        email: ADMIN_EMAIL,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });
    const data = await res.json();
    assert(res.status === 403 && data.error && data.error.includes('reserved for administrator access'), 'Test 3: Admin email CANNOT be registered through normal Register page');
  } catch (err: any) {
    assert(false, `Test 3 Exception: ${err.message}`);
  }

  // TEST 4: Unauthorized email cannot request admin password reset
  try {
    const res = await fetch(`${BASE_URL}/api/auth/admin-forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fakeuser99@company.com' }),
    });
    const data = await res.json();
    assert(res.status === 403 && data.error && data.error.includes('Unauthorized email address'), 'Test 4: Unauthorized email CANNOT request an admin password reset');
  } catch (err: any) {
    assert(false, `Test 4 Exception: ${err.message}`);
  }

  // TEST 5: Authorized admin email CAN request admin password reset
  try {
    const res = await fetch(`${BASE_URL}/api/auth/admin-forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true, 'Test 5: Authorized administrator CAN request password reset');
  } catch (err: any) {
    assert(false, `Test 5 Exception: ${err.message}`);
  }

  // Register test IT User and IT Support accounts for authorization tests
  const testUserEmail = `testuser-${Date.now()}@company.com`;
  const testSupportEmail = `testsupport-${Date.now()}@company.com`;
  let userToken = '';
  let supportToken = '';

  try {
    const regUserRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test IT User',
        email: testUserEmail,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });
    const regUserData = await regUserRes.json();
    userToken = regUserData.token;

    const regSuppRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Support Eng',
        email: testSupportEmail,
        password: 'Password123!',
        role: 'SUPPORT_ENGINEER',
      }),
    });
    const regSuppData = await regSuppRes.json();
    supportToken = regSuppData.token;
  } catch (e: any) {
    console.warn('Test setup user creation error:', e.message);
  }

  // TEST 6: Unauthorized user (no token) cannot access Admin API
  try {
    const res = await fetch(`${BASE_URL}/api/users`);
    assert(res.status === 401 || res.status === 403, 'Test 6: Unauthorized request without token cannot access admin APIs');
  } catch (err: any) {
    assert(false, `Test 6 Exception: ${err.message}`);
  }

  // TEST 7: Normal IT User cannot access Admin API
  try {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(res.status === 403, 'Test 7: Normal IT User CANNOT access administrator APIs');
  } catch (err: any) {
    assert(false, `Test 7 Exception: ${err.message}`);
  }

  // TEST 8: Normal IT Support account cannot access Admin API
  try {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${supportToken}` },
    });
    assert(res.status === 403, 'Test 8: Normal IT Support Engineer CANNOT access administrator APIs');
  } catch (err: any) {
    assert(false, `Test 8 Exception: ${err.message}`);
  }

  // TEST 9: Modifying frontend role in sync payload cannot grant administrator privileges
  try {
    const syncRes = await fetch(`${BASE_URL}/api/auth/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        id: 'usr-attacker-id',
        email: testUserEmail,
        fullName: 'Privilege Escalation Attacker',
        role: 'ADMIN', // Attacker sends ADMIN role
      }),
    });
    const syncData = await syncRes.json();
    assert(
      syncRes.status === 403 || (syncData.user && syncData.user.role === 'IT_USER'),
      'Test 9: Tampering with role in payload does NOT grant administrator privileges (Server rejects mismatch with 403 or forces IT_USER)'
    );
  } catch (err: any) {
    assert(false, `Test 9 Exception: ${err.message}`);
  }

  // TEST 10: Existing normal user login and dashboard functionality continues to work
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, password: 'Password123!' }),
    });
    const loginData = await loginRes.json();

    const dashRes = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const dashData = await dashRes.json();

    assert(loginRes.status === 200 && dashRes.status === 200 && dashData.role === 'IT_USER', 'Test 10: Existing IT User login and dashboard functionality continues to work flawlessly');
  } catch (err: any) {
    assert(false, `Test 10 Exception: ${err.message}`);
  }

  console.log('\n========================================================================');
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});

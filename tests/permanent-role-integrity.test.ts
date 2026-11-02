/**
 * Verification test suite for Permanent User Role Assignment and Admin Role Modification Removal
 */
async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  console.log('\n--- STARTING PERMANENT ROLE INTEGRITY TESTS ---\n');

  // Test 1: Admin login to obtain admin token
  let adminToken = '';
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_INITIAL_EMAIL || 'shilgourab7@gmail.com';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Gourab@722162';
    const res = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const data = await res.json();
    assert(res.ok && !!data.token, 'Admin login succeeds and returns JWT token');
    adminToken = data.token;
  } catch (err: any) {
    assert(false, `Admin login failed: ${err.message}`);
  }

  // Test 2: Role change API endpoint must be permanently disabled
  try {
    const res = await fetch(`${BASE_URL}/api/users/some-user-id/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'SUPPORT_ENGINEER' }),
    });
    const data = await res.json();
    assert(
      res.status === 403 && data.error === 'Role modifications are permanently disabled. User roles are assigned at registration and cannot be changed.',
      'PATCH /api/users/:id/role is permanently disabled with 403 and proper explanation'
    );
  } catch (err: any) {
    assert(false, `PATCH role endpoint test error: ${err.message}`);
  }

  // Test 3: Attempting to register with ADMIN role must be rejected
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Attacker Admin',
        email: 'attacker@example.com',
        password: 'Password123!',
        role: 'ADMIN',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 403 && data.error.includes('Administrator accounts cannot be self-registered'),
      'Self-registration as ADMIN is strictly prohibited with 403'
    );
  } catch (err: any) {
    assert(false, `ADMIN self-registration test error: ${err.message}`);
  }

  // Test 4: Register an IT User permanently
  const itUserEmail = `ituser-${Date.now()}@testcompany.org`;
  let itUserId = '';
  let itUserToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Jane IT User',
        email: itUserEmail,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });
    const data = await res.json();
    assert(res.status === 201 && data.user.role === 'IT_USER', 'IT User registered successfully with role IT_USER');
    itUserId = data.user.id;
    itUserToken = data.token;
  } catch (err: any) {
    assert(false, `IT User registration failed: ${err.message}`);
  }

  // Test 5: Pre-registration validation when registering same email with different role
  try {
    const res = await fetch(`${BASE_URL}/api/auth/validate-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: itUserEmail,
        role: 'SUPPORT_ENGINEER',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 &&
      data.error === 'This email is already registered with a different account role. Please sign in using your existing account.',
      'validate-registration returns exact message when attempting role change for existing email'
    );
  } catch (err: any) {
    assert(false, `validate-registration test error: ${err.message}`);
  }

  // Test 6: Attempting to register same email as SUPPORT_ENGINEER via /api/auth/register
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Jane IT User Impersonator',
        email: itUserEmail,
        password: 'Password123!',
        role: 'SUPPORT_ENGINEER',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 &&
      data.error === 'This email is already registered with a different account role. Please sign in using your existing account.',
      '/api/auth/register returns exact error message when email is already registered with a different role'
    );
  } catch (err: any) {
    assert(false, `Duplicate different role registration test error: ${err.message}`);
  }

  // Test 7: Attempting to register same email as IT_USER again
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Jane IT User Duplicate',
        email: itUserEmail,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 &&
      data.error.includes('already exists'),
      'Registering same email with same role returns already exists error'
    );
  } catch (err: any) {
    assert(false, `Same role duplicate registration error: ${err.message}`);
  }

  // Test 8: Register a Support Engineer permanently
  const supportEmail = `support-${Date.now()}@testcompany.org`;
  let supportId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Sam Support Eng',
        email: supportEmail,
        password: 'Password123!',
        role: 'SUPPORT_ENGINEER',
      }),
    });
    const data = await res.json();
    assert(res.status === 201 && data.user.role === 'SUPPORT_ENGINEER', 'Support Engineer registered successfully with role SUPPORT_ENGINEER');
    supportId = data.user.id;
  } catch (err: any) {
    assert(false, `Support Engineer registration failed: ${err.message}`);
  }

  // Test 9: That same Support Engineer email must never be able to register again as IT User
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Sam Support as IT User',
        email: supportEmail,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 &&
      data.error === 'This email is already registered with a different account role. Please sign in using your existing account.',
      'Support Engineer email cannot register as IT User; returns exact required message'
    );
  } catch (err: any) {
    assert(false, `Support -> IT User registration test error: ${err.message}`);
  }

  // Test 10: Sync endpoint (/api/auth/sync-user) rejects role tampering
  try {
    const res = await fetch(`${BASE_URL}/api/auth/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${itUserToken}`,
      },
      body: JSON.stringify({
        id: itUserId,
        email: itUserEmail,
        fullName: 'Jane IT User Tampered',
        role: 'SUPPORT_ENGINEER', // Attempting to change role via sync
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 &&
      data.error === 'This email is already registered with a different account role. Please sign in using your existing account.',
      '/api/auth/sync-user strictly rejects role changes via sync payload with exact required message'
    );
  } catch (err: any) {
    assert(false, `Sync user role tampering test error: ${err.message}`);
  }

  // Test 11: Sync endpoint (/api/auth/sync-user) preserves permanent role on normal sync
  try {
    const res = await fetch(`${BASE_URL}/api/auth/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${itUserToken}`,
      },
      body: JSON.stringify({
        id: itUserId,
        email: itUserEmail,
        fullName: 'Jane IT User Synced',
        role: 'IT_USER',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.user.role === 'IT_USER',
      '/api/auth/sync-user preserves immutable IT_USER role on valid sync'
    );
  } catch (err: any) {
    assert(false, `Valid sync user test error: ${err.message}`);
  }

  // Test 12: Normal IT user login still works
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: itUserEmail,
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.user.role === 'IT_USER', 'Normal IT User login succeeds with correct permanent role');
  } catch (err: any) {
    assert(false, `Normal login test error: ${err.message}`);
  }

  // Test 13: Normal Support Engineer login still works
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: supportEmail,
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.user.role === 'SUPPORT_ENGINEER', 'Support Engineer login succeeds with correct permanent role');
  } catch (err: any) {
    assert(false, `Support Engineer login test error: ${err.message}`);
  }

  // Test 14: User list retains Block/Unblock and Delete User for admin
  try {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const itUserInList = data.find((u: any) => u.id === itUserId);
    assert(
      res.status === 200 && !!itUserInList && itUserInList.role === 'IT_USER',
      'Admin can fetch users list and verify permanent roles'
    );
  } catch (err: any) {
    assert(false, `Fetch users list error: ${err.message}`);
  }

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

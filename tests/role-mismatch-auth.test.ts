/**
 * ResolveIQ Role Mismatch Authentication Verification Test Suite
 * Verifies strict role matching between selected login portal and database permanent role.
 */

async function runRoleMismatchTests() {
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

  console.log('\n======================================================');
  console.log('--- RESOLVEIQ ROLE MISMATCH AUTHENTICATION TESTS ---');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const password = 'TestSecurePassword123!';

  // --- Test Case 1 & 2: IT_USER registration, IT_USER login (success), IT_SUPPORT login (403 reject) ---
  const itUserEmail = `ituser-${timestamp}@testresolveiq.org`;
  let itUserId = '';

  console.log('1. Testing IT_USER registration...');
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test IT User',
        email: itUserEmail,
        password,
        role: 'IT_USER',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.user.role === 'IT_USER', 'IT_USER registers successfully with role IT_USER');
    itUserId = regData.user.id;
  } catch (err: any) {
    assert(false, `IT_USER registration failed: ${err.message}`);
  }

  console.log('2. Testing IT_USER login through IT_USER option (expected: 200 SUCCESS)...');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: itUserEmail,
        password,
        role: 'IT_USER',
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.user.role === 'IT_USER' && !!loginData.token,
      'IT_USER logs in successfully via IT_USER portal option'
    );
  } catch (err: any) {
    assert(false, `IT_USER login failed: ${err.message}`);
  }

  console.log('3. Testing IT_USER login through IT_SUPPORT option (expected: 403 REJECT)...');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: itUserEmail,
        password,
        role: 'IT_SUPPORT',
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 403 &&
      loginData.error === 'Your account is registered as IT_USER. Please use the correct login option.',
      'IT_USER login via IT_SUPPORT is rejected with 403 and message: "Your account is registered as IT_USER. Please use the correct login option."'
    );
  } catch (err: any) {
    assert(false, `IT_USER via IT_SUPPORT login test failed: ${err.message}`);
  }

  // --- Test Case 3 & 4: IT_SUPPORT registration, IT_SUPPORT login (success), IT_USER login (403 reject) ---
  const itSupportEmail = `itsupport-${timestamp}@testresolveiq.org`;
  let itSupportId = '';

  console.log('4. Testing IT_SUPPORT registration...');
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Support Engineer',
        email: itSupportEmail,
        password,
        role: 'IT_SUPPORT',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.user.role === 'IT_SUPPORT', 'IT_SUPPORT registers successfully with role IT_SUPPORT');
    itSupportId = regData.user.id;
  } catch (err: any) {
    assert(false, `IT_SUPPORT registration failed: ${err.message}`);
  }

  console.log('5. Testing IT_SUPPORT login through IT_SUPPORT option (expected: 200 SUCCESS)...');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: itSupportEmail,
        password,
        role: 'IT_SUPPORT',
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.user.role === 'IT_SUPPORT' && !!loginData.token,
      'IT_SUPPORT logs in successfully via IT_SUPPORT portal option'
    );
  } catch (err: any) {
    assert(false, `IT_SUPPORT login failed: ${err.message}`);
  }

  console.log('6. Testing IT_SUPPORT login through IT_USER option (expected: 403 REJECT)...');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: itSupportEmail,
        password,
        role: 'IT_USER',
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 403 &&
      loginData.error === 'Your account is registered as IT_SUPPORT. Please use the correct login option.',
      'IT_SUPPORT login via IT_USER is rejected with 403 and message: "Your account is registered as IT_SUPPORT. Please use the correct login option."'
    );
  } catch (err: any) {
    assert(false, `IT_SUPPORT via IT_USER login test failed: ${err.message}`);
  }

  // --- Test Case 5: Duplicate registration with different role is rejected with 400 ---
  console.log('7. Testing duplicate registration with different role (expected: 400 REJECT)...');
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Impersonator',
        email: itUserEmail,
        password,
        role: 'IT_SUPPORT',
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 400 &&
      regData.error === 'This email is already registered with a different account role. Please sign in using your existing account.',
      'Duplicate registration of existing IT_USER email as IT_SUPPORT is rejected with HTTP 400'
    );
  } catch (err: any) {
    assert(false, `Duplicate registration test failed: ${err.message}`);
  }

  // --- Test Case 6: Dedicated ADMIN authentication works and is preserved ---
  console.log('8. Testing administrator login (expected: 200 SUCCESS)...');
  let adminToken = '';
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_INITIAL_EMAIL || 'shilgourab7@gmail.com';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Gourab@722162';
    const adminRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminData = await adminRes.json();
    assert(
      adminRes.status === 200 && adminData.user.role === 'ADMIN' && !!adminData.token,
      'Admin login succeeds and preserves dedicated administrator authentication'
    );
    adminToken = adminData.token;
  } catch (err: any) {
    assert(false, `Admin login test failed: ${err.message}`);
  }

  // --- Test Case 7: Blocked user login is rejected with HTTP 403 ---
  console.log('9. Testing blocked user login (expected: 403 REJECT)...');
  try {
    // Block the IT user using admin token
    const blockRes = await fetch(`${BASE_URL}/api/users/${itUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'BLOCKED' }),
    });
    assert(blockRes.status === 200, 'Admin successfully blocks test IT user');

    // Attempt login with blocked user
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: itUserEmail,
        password,
        role: 'IT_USER',
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 403 &&
      loginData.error.includes('blocked'),
      'Blocked user login attempt is rejected with HTTP 403'
    );

    // Unblock the user
    await fetch(`${BASE_URL}/api/users/${itUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
  } catch (err: any) {
    assert(false, `Blocked user test failed: ${err.message}`);
  }

  // --- Test Case 8: Deleted user login is rejected with HTTP 401 ---
  console.log('10. Testing deleted user login (expected: 401 REJECT)...');
  try {
    // Delete the support engineer using admin token
    const delRes = await fetch(`${BASE_URL}/api/users/${itSupportId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert(delRes.status === 200, 'Admin successfully deletes test Support user');

    // Attempt login with deleted user
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: itSupportEmail,
        password,
        role: 'IT_SUPPORT',
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 401 &&
      loginData.error === 'Invalid email or password',
      'Deleted user login attempt is rejected with HTTP 401'
    );
  } catch (err: any) {
    assert(false, `Deleted user test failed: ${err.message}`);
  }

  // --- Test Case 9: Existing permanent role cannot be changed through login or registration ---
  console.log('11. Testing permanent role immutability...');
  try {
    // Check that itUser is still IT_USER
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: itUserEmail,
        password,
        role: 'IT_USER',
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.user.role === 'IT_USER',
      'Permanent role remains unchanged and intact as IT_USER'
    );
  } catch (err: any) {
    assert(false, `Permanent role immutability test failed: ${err.message}`);
  }

  console.log(`\n======================================================`);
  console.log(`--- TEST RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRoleMismatchTests();

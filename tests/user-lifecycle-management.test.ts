// Verification test suite for ResolveIQ Admin User Management
// Tests: Block/Unblock, Permanent Deletion, Incident History Preservation, Admin Self-Protection

const BASE_URL = 'http://127.0.0.1:3000';

async function run() {
  console.log('========================================================================');
  console.log('Running User Lifecycle & Management Verification Tests');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Log in as Admin
  let adminToken = '';
  let adminId = '';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@ResolveIQ2026!';
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'shilgourab7@gmail.com', password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;
    adminId = adminLoginData.user?.id || '';
    assert(adminLoginRes.status === 200 && !!adminToken, 'Admin can log in successfully to obtain Admin JWT');
  } catch (err: any) {
    assert(false, `Admin login error: ${err.message}`);
    process.exit(1);
  }

  // 2. Register a test IT User to manage
  const testUserEmail = `lifecycle-user-${Date.now()}@example.com`;
  let testUserId = '';
  let testUserToken = '';

  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lifecycle Test User',
        email: testUserEmail,
        password: 'Password123!',
        role: 'IT_USER',
      }),
    });
    const regData = await regRes.json();
    testUserId = regData.user?.id;
    testUserToken = regData.token;
    assert(regRes.status === 201 && !!testUserId, `Registered test user: ${testUserEmail} (${testUserId})`);
  } catch (err: any) {
    assert(false, `Register user error: ${err.message}`);
  }

  // 3. Create an incident reported by this user to verify foreign key history preservation
  let incidentId = '';
  try {
    const incRes = await fetch(`${BASE_URL}/api/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        title: 'Network connectivity failure in Zone B',
        description: 'Unable to reach gateway router from terminal',
        category: 'Network',
        priority: 'High',
      }),
    });
    const incData = await incRes.json();
    incidentId = incData.id;
    assert(incRes.status === 201 && !!incidentId, `Created operational incident for test user: ${incidentId}`);
  } catch (err: any) {
    console.warn('Incident creation note:', err.message);
  }

  // 4. Test: Normal user CANNOT delete or block accounts (Security Check)
  try {
    const unauthDelete = await fetch(`${BASE_URL}/api/users/${testUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    assert(unauthDelete.status === 403, 'Normal IT User CANNOT delete user accounts (403 Forbidden)');

    const unauthBlock = await fetch(`${BASE_URL}/api/users/${testUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ status: 'BLOCKED' }),
    });
    assert(unauthBlock.status === 403, 'Normal IT User CANNOT block user accounts (403 Forbidden)');
  } catch (err: any) {
    assert(false, `Unauthorized permission check error: ${err.message}`);
  }

  // 5. Test: Admin CANNOT delete or block self (Safety Protection)
  try {
    const deleteSelfRes = await fetch(`${BASE_URL}/api/users/${adminId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteSelfRes.status === 400, 'Admin account is protected from accidental deletion (400 Bad Request)');

    const blockSelfRes = await fetch(`${BASE_URL}/api/users/${adminId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'BLOCKED' }),
    });
    assert(blockSelfRes.status === 400, 'Admin account is protected from accidental blocking (400 Bad Request)');
  } catch (err: any) {
    assert(false, `Admin self-protection check error: ${err.message}`);
  }

  // 6. Test: Admin blocks normal IT User
  try {
    const blockRes = await fetch(`${BASE_URL}/api/users/${testUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'BLOCKED' }),
    });
    const blockData = await blockRes.json();
    assert(blockRes.status === 200 && blockData.status === 'BLOCKED', 'Admin successfully blocks normal IT User');
  } catch (err: any) {
    assert(false, `Block user error: ${err.message}`);
  }

  // 7. Test: Blocked user cannot log in or access protected APIs, receiving exact message
  try {
    const blockedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, password: 'Password123!' }),
    });
    const blockedLoginData = await blockedLoginRes.json();
    const expectedMsg = 'Your account has been blocked. Please contact the administrator.';
    assert(
      blockedLoginRes.status === 403 && blockedLoginData.error === expectedMsg,
      `Blocked user login rejected with exact message: "${blockedLoginData.error}"`
    );

    // Also API access with existing token must be rejected
    const blockedApiRes = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const blockedApiData = await blockedApiRes.json();
    assert(
      blockedApiRes.status === 403 && blockedApiData.error === expectedMsg,
      `Blocked user existing session rejected on API call: "${blockedApiData.error}"`
    );
  } catch (err: any) {
    assert(false, `Blocked access check error: ${err.message}`);
  }

  // 8. Test: Admin unblocks the user and restores access
  try {
    const unblockRes = await fetch(`${BASE_URL}/api/users/${testUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const unblockData = await unblockRes.json();
    assert(unblockRes.status === 200 && unblockData.status === 'ACTIVE', 'Admin successfully unblocks normal IT User');

    const restoredLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, password: 'Password123!' }),
    });
    assert(restoredLoginRes.status === 200, 'Unblocked user can log in again successfully');
  } catch (err: any) {
    assert(false, `Unblock user error: ${err.message}`);
  }

  // 9. Test: Admin permanently deletes the user account
  try {
    const deleteRes = await fetch(`${BASE_URL}/api/users/${testUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200 && deleteData.success === true, `Admin permanently deletes user account (${deleteData.message})`);

    // Deleted user can no longer log in
    const deletedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail, password: 'Password123!' }),
    });
    assert(deletedLoginRes.status === 401 || deletedLoginRes.status === 403, 'Deleted user can no longer log in');

    // Incident history still exists in the system (not deleted)
    if (incidentId) {
      const incCheckRes = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(incCheckRes.status === 200, 'Operational incident history is preserved after user deletion');
    }
  } catch (err: any) {
    assert(false, `Permanent deletion test error: ${err.message}`);
  }

  console.log('\n========================================================================');
  console.log(`Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});

/**
 * Backend Verification Test Suite: Resolved Incident Assignment Locking
 *
 * Verifies backend enforcement preventing reassignment of RESOLVED incidents:
 * - Reject reassignment with HTTP 409 Conflict when status is RESOLVED.
 * - Enforce that unresolved incidents (OPEN / IN_PROGRESS) can still be assigned/reassigned by Admin (HTTP 200 OK).
 * - Enforce that non-admins cannot reassign incidents (HTTP 403 Forbidden).
 * - Enforce that accept/unassign attempts on RESOLVED incidents are rejected (HTTP 409 Conflict).
 */

import { Pool } from 'pg';

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

interface AuthResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

let adminToken = '';
let engineer1Token = '';
let engineer2Token = '';
let userToken = '';

let engineer1Id = '';
let engineer2Id = '';
let userId = '';

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

async function runTests() {
  console.log('\n==========================================================');
  console.log(' Starting ResolveIQ Backend Assignment Locking Test Suite');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('==========================================================\n');

  // 1. Setup & Authentication
  console.log('1. Setting up accounts and authenticating...');

  // Admin login
  const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'shilgourab7@gmail.com';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Gourab@722162';

  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    }),
  });

  const adminLoginData = (await adminLoginRes.json()) as AuthResponse;
  assert(adminLoginRes.status === 200 && !!adminLoginData.token, 'Admin authentication');
  adminToken = adminLoginData.token;

  // Support Engineer 1
  const eng1Email = `eng1.${Date.now()}@resolveiq.internal`;
  const eng1RegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Alex Vance',
      email: eng1Email,
      password: 'Password@123',
      role: 'SUPPORT_ENGINEER',
      department: 'Tier 2 Support',
    }),
  });
  const eng1Data = (await eng1RegRes.json()) as AuthResponse;
  assert(eng1RegRes.status === 201 && !!eng1Data.token, 'Engineer 1 registration');
  engineer1Token = eng1Data.token;
  engineer1Id = eng1Data.user.id;

  // Support Engineer 2
  const eng2Email = `eng2.${Date.now()}@resolveiq.internal`;
  const eng2RegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Marcus Brody',
      email: eng2Email,
      password: 'Password@123',
      role: 'SUPPORT_ENGINEER',
      department: 'Tier 2 Support',
    }),
  });
  const eng2Data = (await eng2RegRes.json()) as AuthResponse;
  assert(eng2RegRes.status === 201 && !!eng2Data.token, 'Engineer 2 registration');
  engineer2Token = eng2Data.token;
  engineer2Id = eng2Data.user.id;

  // IT User (reporter)
  const userEmail = `ituser.${Date.now()}@resolveiq.internal`;
  const userRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Jordan Lee',
      email: userEmail,
      password: 'Password@123',
      role: 'IT_USER',
      department: 'Marketing',
    }),
  });
  const userData = (await userRegRes.json()) as AuthResponse;
  assert(userRegRes.status === 201 && !!userData.token, 'IT User registration');
  userToken = userData.token;
  userId = userData.user.id;

  // 2. Incident Creation (Unresolved)
  console.log('\n2. Testing unresolved incident assignment & reassignment...');
  const createRes = await fetch(`${BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      title: 'PostgreSQL Connection Latency Spike',
      description: 'Queries against the primary cluster timing out after 15 seconds.',
      category: 'Database',
      priority: 'High',
    }),
  });
  const incident1 = await createRes.json();
  assert(createRes.status === 201 && incident1.status === 'OPEN', 'Unresolved incident created as OPEN');

  // 3. Admin Assigns Unresolved Incident to Engineer 1 (Must Succeed: 200 OK)
  const adminAssignRes1 = await fetch(`${BASE_URL}/api/incidents/${incident1.id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ assigneeId: engineer1Id }),
  });
  const assignedInc1 = await adminAssignRes1.json();
  assert(
    adminAssignRes1.status === 200 && assignedInc1.assigneeId === engineer1Id,
    'Admin successfully assigns unresolved incident to Engineer 1 (HTTP 200)',
    JSON.stringify(assignedInc1)
  );

  // 4. Admin Reassigns Unresolved Incident to Engineer 2 (Must Succeed: 200 OK)
  const adminReassignRes = await fetch(`${BASE_URL}/api/incidents/${incident1.id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ assigneeId: engineer2Id }),
  });
  const reassignedInc = await adminReassignRes.json();
  assert(
    adminReassignRes.status === 200 && reassignedInc.assigneeId === engineer2Id,
    'Admin successfully reassigns unresolved incident to Engineer 2 (HTTP 200)',
    JSON.stringify(reassignedInc)
  );

  // 5. Engineer 2 sets incident to IN_PROGRESS and then RESOLVED
  console.log('\n3. Progressing incident to RESOLVED status...');
  const progressRes = await fetch(`${BASE_URL}/api/incidents/${incident1.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${engineer2Token}`,
    },
    body: JSON.stringify({ status: 'IN_PROGRESS' }),
  });
  assert(progressRes.status === 200, 'Assigned engineer transitions status to IN_PROGRESS');

  const resolveRes = await fetch(`${BASE_URL}/api/incidents/${incident1.id}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${engineer2Token}`,
    },
    body: JSON.stringify({
      resolutionSummary: 'Identified query planner cache bloat. Vacuumed indexes and reloaded connection pool.',
    }),
  });
  const resolvedInc = await resolveRes.json();
  assert(
    resolveRes.status === 200 && resolvedInc.status === 'RESOLVED',
    'Assigned engineer resolves incident with resolution summary (status=RESOLVED)'
  );

  // 6. Backend Enforcement: Admin Reassignment on RESOLVED Incident MUST BE REJECTED (HTTP 409 Conflict)
  console.log('\n4. Testing backend enforcement on RESOLVED incident...');
  const adminReassignResolvedRes = await fetch(`${BASE_URL}/api/incidents/${incident1.id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ assigneeId: engineer1Id }),
  });
  const adminReassignResolvedBody = await adminReassignResolvedRes.json();
  assert(
    adminReassignResolvedRes.status === 409,
    'Admin reassignment on RESOLVED incident is rejected with HTTP 409 Conflict',
    `Expected status 409, got ${adminReassignResolvedRes.status}: ${JSON.stringify(adminReassignResolvedBody)}`
  );
  assert(
    adminReassignResolvedBody.error === 'Resolved incidents cannot be reassigned.',
    'Clear rejection error message: "Resolved incidents cannot be reassigned."',
    adminReassignResolvedBody.error
  );

  // 7. Backend Enforcement: Admin Attempt to UNASSIGN a RESOLVED Incident MUST ALSO BE REJECTED (HTTP 409)
  const adminUnassignResolvedRes = await fetch(`${BASE_URL}/api/incidents/${incident1.id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ assigneeId: 'UNASSIGNED' }),
  });
  const adminUnassignResolvedBody = await adminUnassignResolvedRes.json();
  assert(
    adminUnassignResolvedRes.status === 409,
    'Admin unassign attempt on RESOLVED incident is rejected with HTTP 409 Conflict',
    `Expected status 409, got ${adminUnassignResolvedRes.status}: ${JSON.stringify(adminUnassignResolvedBody)}`
  );

  // 8. Backend Enforcement: Engineer Attempt to Accept/Take Over a RESOLVED Incident MUST BE REJECTED (HTTP 409)
  const engineerAcceptResolvedRes = await fetch(`${BASE_URL}/api/incidents/${incident1.id}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${engineer1Token}`,
    },
  });
  const engineerAcceptResolvedBody = await engineerAcceptResolvedRes.json();
  assert(
    engineerAcceptResolvedRes.status === 409,
    'Engineer acceptance attempt on RESOLVED incident is rejected with HTTP 409 Conflict',
    `Expected status 409, got ${engineerAcceptResolvedRes.status}: ${JSON.stringify(engineerAcceptResolvedBody)}`
  );

  // 9. Backend Enforcement: Non-Admin Reassignment Attempt MUST BE REJECTED (HTTP 403 Forbidden)
  const nonAdminAssignRes = await fetch(`${BASE_URL}/api/incidents/${incident1.id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${engineer1Token}`,
    },
    body: JSON.stringify({ assigneeId: engineer1Id }),
  });
  assert(
    nonAdminAssignRes.status === 403,
    'Non-admin reassignment attempt is rejected with HTTP 403 Forbidden',
    `Expected status 403, got ${nonAdminAssignRes.status}`
  );

  // 10. Verify Unresolved Incidents Still Work
  console.log('\n5. Verifying that eligible unresolved incidents still assign & reassign cleanly...');
  const createRes2 = await fetch(`${BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      title: 'Office WiFi AP Authentication Failure',
      description: 'Radius server timeout on Floor 3 AP-East.',
      category: 'Network',
      priority: 'Medium',
    }),
  });
  const incident2 = await createRes2.json();
  assert(createRes2.status === 201, 'Second unresolved incident created');

  // Assign to Engineer 1
  const assign2Res = await fetch(`${BASE_URL}/api/incidents/${incident2.id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ assigneeId: engineer1Id }),
  });
  const assign2Body = await assign2Res.json();
  assert(
    assign2Res.status === 200 && assign2Body.assigneeId === engineer1Id,
    'Admin can assign new unresolved incident to Engineer 1 (HTTP 200)'
  );

  // Reassign to Engineer 2
  const reassign2Res = await fetch(`${BASE_URL}/api/incidents/${incident2.id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ assigneeId: engineer2Id }),
  });
  const reassign2Body = await reassign2Res.json();
  assert(
    reassign2Res.status === 200 && reassign2Body.assigneeId === engineer2Id,
    'Admin can reassign unresolved incident to Engineer 2 (HTTP 200)'
  );

  // Verify incident 1 (RESOLVED) preserved its original assigned engineer without change
  const fetchResolvedIncRes = await fetch(`${BASE_URL}/api/incidents/${incident1.id}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  const currentResolvedInc = await fetchResolvedIncRes.json();
  assert(
    currentResolvedInc.status === 'RESOLVED' && currentResolvedInc.assigneeId === engineer2Id,
    'Resolved incident assignee remains locked to original resolver (Marcus Brody / engineer2)',
    `Assignee: ${currentResolvedInc.assigneeId}`
  );

  // Teardown: Clean up temporary test data created during test execution
  try {
    const cleanPool = getDbPool();
    const idsToClean = [engineer1Id, engineer2Id, userId].filter(Boolean);
    if (idsToClean.length > 0) {
      await cleanPool.query(`DELETE FROM public.incident_feedback WHERE reporter_id = ANY($1::text[])`, [idsToClean]);
      await cleanPool.query(`DELETE FROM public.incident_messages WHERE sender_id = ANY($1::text[])`, [idsToClean]);
      await cleanPool.query(`DELETE FROM public.incident_updates WHERE author_id = ANY($1::text[])`, [idsToClean]);
      await cleanPool.query(`DELETE FROM public.notifications WHERE user_id = ANY($1::text[])`, [idsToClean]);
      await cleanPool.query(`DELETE FROM public.audit_logs WHERE incident_id IN (SELECT id FROM public.incidents WHERE reporter_id = ANY($1::text[]))`, [idsToClean]);
      await cleanPool.query(`DELETE FROM public.incidents WHERE reporter_id = ANY($1::text[])`, [idsToClean]);
      await cleanPool.query(`DELETE FROM public.users WHERE id = ANY($1::text[])`, [idsToClean]);
    }
    await cleanPool.end();
  } catch (cleanErr) {
    console.warn('Test teardown warning:', cleanErr);
  }

  console.log('\n==========================================================');
  console.log(` Test Results: ${passedCount}/${testCount} Passed`);
  console.log('==========================================================\n');

  if (passedCount !== testCount) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

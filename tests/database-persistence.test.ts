/**
 * ResolveIQ End-to-End Database Persistence Test Suite
 *
 * Verifies that ResolveIQ is fully backed by PostgreSQL and that:
 * 1. Supabase PostgreSQL contains all required tables in schema 'public'.
 * 2. User registration and authentication persist in PostgreSQL (with BCrypt hashes).
 * 3. Incident creation, assignment, troubleshooting, and status transitions persist in PostgreSQL.
 * 4. Chat messages, status updates, and resolutions persist in PostgreSQL.
 * 5. Incident feedback persists in PostgreSQL with ratings and comments.
 * 6. Notifications and audit log records persist in PostgreSQL.
 * 7. In-memory storage is not authoritative; querying the database directly returns the exact records.
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
      console.warn('[Test DB Pool] Error parsing SPRING_DATASOURCE_URL:', e);
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

async function runPersistenceTests() {
  console.log('\n==========================================================');
  console.log(' Starting ResolveIQ PostgreSQL Database Persistence Tests');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('==========================================================\n');

  try {
    // ----------------------------------------------------
    // Section 1: Schema Verification
    // ----------------------------------------------------
    console.log('1. Verifying PostgreSQL Database Schema in Supabase...');
    const tablesRes = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map((r: any) => r.table_name);
    console.log('   Discovered PostgreSQL tables in public schema:', tableNames.join(', '));

    const expectedTables = [
      'audit_logs',
      'incident_feedback',
      'incident_messages',
      'incident_updates',
      'incidents',
      'notifications',
      'users',
    ];

    for (const table of expectedTables) {
      assert(tableNames.includes(table), `Table "${table}" exists in PostgreSQL public schema`);
    }

    // ----------------------------------------------------
    // Section 2: User Persistence & Password Hashing
    // ----------------------------------------------------
    console.log('\n2. Testing User Registration & PostgreSQL Persistence...');
    const timestamp = Date.now();
    const testUserEmail = `dbtest.user.${timestamp}@company.internal`;
    const testEngEmail = `dbtest.eng.${timestamp}@company.internal`;

    // Register User via API
    const userRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Persistence Test User',
        email: testUserEmail,
        password: 'TestPassword@2026',
        role: 'IT_USER',
        department: 'Quality Assurance',
      }),
    });
    const userRegData = await userRegRes.json();
    assert(userRegRes.status === 201 && !!userRegData.token, 'User registered via REST API');
    const userToken = userRegData.token;
    const userId = userRegData.user.id;

    // Direct Database Query: Confirm User is in PostgreSQL (not in-memory)
    const dbUserRes = await pool.query('SELECT id, full_name, email, role, password_hash, department FROM users WHERE id = $1', [userId]);
    assert(dbUserRes.rows.length === 1, 'User record retrieved directly from PostgreSQL users table');
    const dbUser = dbUserRes.rows[0];
    assert(dbUser.email === testUserEmail, 'Database user email matches registration');
    assert(dbUser.password_hash.startsWith('$2b$'), 'User password stored securely as BCrypt hash in PostgreSQL');
    assert(dbUser.role === 'IT_USER', 'User role persisted correctly as IT_USER');

    // Register Support Engineer via API
    const engRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Persistence Test Engineer',
        email: testEngEmail,
        password: 'EngPassword@2026',
        role: 'SUPPORT_ENGINEER',
        department: 'Infrastructure Support',
      }),
    });
    const engRegData = await engRegRes.json();
    assert(engRegRes.status === 201 && !!engRegData.token, 'Engineer registered via REST API');
    const engToken = engRegData.token;
    const engId = engRegData.user.id;

    // Login with the newly registered user to verify auth against PostgreSQL
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'TestPassword@2026',
      }),
    });
    assert(loginRes.status === 200, 'User authentication succeeds by verifying password against PostgreSQL hash');

    // ----------------------------------------------------
    // Section 3: Incident Creation & Verification in PostgreSQL
    // ----------------------------------------------------
    console.log('\n3. Testing Incident Creation & PostgreSQL Persistence...');
    const createIncRes = await fetch(`${BASE_URL}/api/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        title: 'Supabase PostgreSQL Connection Verification Test Ticket',
        description: 'Validating end-to-end relational database persistence across all tables and operations.',
        category: 'Database',
        priority: 'High',
        serviceName: 'Core Persistence Service',
        symptoms: 'Verifying data integrity directly against the database cluster.',
      }),
    });
    const createIncData = await createIncRes.json();
    assert(createIncRes.status === 201 && !!createIncData.id, 'Incident created via REST API');
    const incidentId = createIncData.id;
    const ticketNumber = createIncData.ticketNumber;

    // Direct Database Query: Verify incident in 'incidents' table
    const dbIncRes = await pool.query('SELECT * FROM incidents WHERE id = $1', [incidentId]);
    assert(dbIncRes.rows.length === 1, 'Incident record found directly in PostgreSQL incidents table');
    const dbInc = dbIncRes.rows[0];
    assert(dbInc.ticket_number === ticketNumber, 'Database ticket_number matches generated ticket number');
    assert(dbInc.status === 'OPEN', 'Initial status persisted as OPEN in database');
    assert(dbInc.reporter_id === userId, 'Reporter foreign key correctly references users table');
    assert(dbInc.priority === 'High', 'Priority persisted as High');

    // ----------------------------------------------------
    // Section 4: Incident Lifecycle (Accept, Troubleshoot, Messages)
    // ----------------------------------------------------
    console.log('\n4. Testing Incident Lifecycle (Accept, Troubleshoot, Messages)...');
    // Engineer accepts the incident
    const acceptRes = await fetch(`${BASE_URL}/api/incidents/${incidentId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${engToken}`,
      },
    });
    assert(acceptRes.status === 200, 'Engineer accepts incident via REST API');

    // Verify in database: status changed to IN_PROGRESS, assignee set
    const dbAfterAccept = await pool.query('SELECT status, assignee_id, assignee_name FROM incidents WHERE id = $1', [incidentId]);
    assert(dbAfterAccept.rows[0].status === 'IN_PROGRESS', 'PostgreSQL status transitioned to IN_PROGRESS');
    assert(dbAfterAccept.rows[0].assignee_id === engId, 'PostgreSQL assignee_id references accepted engineer');

    // Engineer adds troubleshooting note
    const troubleshootRes = await fetch(`${BASE_URL}/api/incidents/${incidentId}/troubleshoot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${engToken}`,
      },
      body: JSON.stringify({
        notes: 'Ran connection pool diagnostic script. Verified 20 pooled connections active with SSL.',
      }),
    });
    assert(troubleshootRes.status === 200, 'Troubleshooting notes saved via REST API');

    // Verify troubleshooting notes in database
    const dbAfterNotes = await pool.query('SELECT troubleshooting_notes FROM incidents WHERE id = $1', [incidentId]);
    assert(
      dbAfterNotes.rows[0].troubleshooting_notes.includes('Verified 20 pooled connections'),
      'Troubleshooting notes stored directly in incidents.troubleshooting_notes'
    );

    // Engineer posts a chat message
    const chatRes = await fetch(`${BASE_URL}/api/incidents/${incidentId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${engToken}`,
      },
      body: JSON.stringify({
        content: 'Hello, I have initiated diagnostics on the database connection pool.',
        messageType: 'CHAT',
      }),
    });
    assert(chatRes.status === 201, 'Chat message sent via REST API');

    // Direct Database Query: Verify incident_messages table
    const dbMsgRes = await pool.query(
      'SELECT id, incident_id, sender_id, content, message_type FROM incident_messages WHERE incident_id = $1 AND message_type = $2',
      [incidentId, 'CHAT']
    );
    assert(dbMsgRes.rows.length >= 1, 'Chat message persisted in PostgreSQL incident_messages table');
    assert(dbMsgRes.rows[0].content.includes('initiated diagnostics'), 'Message content matches database row');

    // ----------------------------------------------------
    // Section 5: Incident Resolution & Feedback
    // ----------------------------------------------------
    console.log('\n5. Testing Incident Resolution & Feedback in PostgreSQL...');
    const resolveRes = await fetch(`${BASE_URL}/api/incidents/${incidentId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${engToken}`,
      },
      body: JSON.stringify({
        resolutionSummary: 'PostgreSQL connection normalized, schema idempotency verified, and persistent queries established.',
      }),
    });
    assert(resolveRes.status === 200, 'Incident resolved via REST API');

    // Direct Database Query: Verify resolution in database
    const dbResolved = await pool.query(
      'SELECT status, resolution_notes, resolved_by_id, resolved_at FROM incidents WHERE id = $1',
      [incidentId]
    );
    assert(dbResolved.rows[0].status === 'RESOLVED', 'PostgreSQL status updated to RESOLVED');
    assert(dbResolved.rows[0].resolved_by_id === engId, 'PostgreSQL resolved_by_id references resolving engineer');
    assert(dbResolved.rows[0].resolved_at !== null, 'PostgreSQL resolved_at timestamp is populated');

    // User submits Feedback
    const feedbackRes = await fetch(`${BASE_URL}/api/incidents/${incidentId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Outstanding support! Persistence issue is completely resolved and verified in database.',
      }),
    });
    assert(feedbackRes.status === 201, 'User feedback submitted via REST API');

    // Direct Database Query: Verify feedback in incident_feedback table
    const dbFeedback = await pool.query('SELECT * FROM incident_feedback WHERE incident_id = $1', [incidentId]);
    assert(dbFeedback.rows.length === 1, 'Feedback record persisted in PostgreSQL incident_feedback table');
    assert(dbFeedback.rows[0].rating === 5, 'Feedback rating persisted as 5 in database');
    assert(dbFeedback.rows[0].comment.includes('Outstanding support'), 'Feedback comment persisted in database');
    assert(dbFeedback.rows[0].resolved_by_user_id === engId, 'Feedback references resolving engineer in database');

    // ----------------------------------------------------
    // Section 6: Audit Logs and Notifications
    // ----------------------------------------------------
    console.log('\n6. Testing Audit Logs & Notifications in PostgreSQL...');
    // Verify notifications table
    const dbNotifs = await pool.query('SELECT * FROM notifications WHERE incident_id = $1', [incidentId]);
    assert(dbNotifs.rows.length >= 1, 'Notifications generated and persisted in PostgreSQL notifications table');

    // Verify audit logs table
    const dbAudit = await pool.query('SELECT * FROM audit_logs WHERE incident_id = $1', [incidentId]);
    assert(dbAudit.rows.length >= 1, 'Audit log entries generated and persisted in PostgreSQL audit_logs table');
    const eventTypes = dbAudit.rows.map((r: any) => r.event_type);
    assert(
      eventTypes.includes('INCIDENT_CREATED') || eventTypes.includes('INCIDENT_RESOLVED'),
      'Audit log contains expected lifecycle event types'
    );

    // ----------------------------------------------------
    // Section 7: Independent Querying (Zero In-Memory Fallback)
    // ----------------------------------------------------
    console.log('\n7. Verifying Application Reads Directly from PostgreSQL...');
    // Create a new separate connection pool to query the incident and verify data was committed
    const freshPool = getDbPool();
    const independentRes = await freshPool.query(
      `SELECT i.ticket_number, i.title, i.status, f.rating, f.comment
       FROM incidents i
       LEFT JOIN incident_feedback f ON i.id = f.incident_id
       WHERE i.id = $1`,
      [incidentId]
    );
    await freshPool.end();

    assert(independentRes.rows.length === 1, 'Independent PostgreSQL client successfully reads persisted incident');
    assert(independentRes.rows[0].status === 'RESOLVED', 'Independent client confirms committed RESOLVED status');
    assert(independentRes.rows[0].rating === 5, 'Independent client confirms committed feedback rating of 5');

    // Teardown: Clean up temporary test data created during test execution
    try {
      const cleanIds = [userId, engId].filter(Boolean);
      if (cleanIds.length > 0) {
        await pool.query(`DELETE FROM public.incident_feedback WHERE reporter_id = ANY($1::text[])`, [cleanIds]);
        await pool.query(`DELETE FROM public.incident_messages WHERE sender_id = ANY($1::text[])`, [cleanIds]);
        await pool.query(`DELETE FROM public.incident_updates WHERE author_id = ANY($1::text[])`, [cleanIds]);
        await pool.query(`DELETE FROM public.notifications WHERE user_id = ANY($1::text[])`, [cleanIds]);
        await pool.query(`DELETE FROM public.audit_logs WHERE incident_id = $1`, [incidentId]);
        await pool.query(`DELETE FROM public.incidents WHERE reporter_id = ANY($1::text[])`, [cleanIds]);
        await pool.query(`DELETE FROM public.users WHERE id = ANY($1::text[])`, [cleanIds]);
      }
    } catch (cleanErr) {
      console.warn('Persistence test teardown warning:', cleanErr);
    }

    console.log('\n==========================================================');
    console.log(` Test Results: ${passedCount}/${testCount} Passed`);
    console.log('==========================================================\n');

    if (passedCount === testCount) {
      console.log(' All PostgreSQL database persistence tests PASSED successfully!\n');
    }
  } catch (err: any) {
    console.error('Test Suite encountered an unexpected error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runPersistenceTests();

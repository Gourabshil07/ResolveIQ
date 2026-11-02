import { Incident, KnowledgeArticle, NotificationItem, SystemSettings, User } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: 'usr_emp_01',
    name: 'Alex Chen',
    email: 'alex.chen@company.internal',
    role: 'EMPLOYEE',
    department: 'Product Operations',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 019-2831'
  },
  {
    id: 'usr_eng_01',
    name: 'Elena Rostova',
    email: 'elena.rostova@company.internal',
    role: 'ENGINEER',
    department: 'Site Reliability Engineering',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 014-9922'
  },
  {
    id: 'usr_eng_02',
    name: 'Devon Miller',
    email: 'devon.miller@company.internal',
    role: 'ENGINEER',
    department: 'Core Infrastructure',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 018-7744'
  },
  {
    id: 'usr_adm_01',
    name: 'Marcus Vance',
    email: 'marcus.vance@company.internal',
    role: 'ADMIN',
    department: 'IT Systems & Security',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 012-3301'
  }
];

export const MOCK_SERVICES = [
  'Stripe Payment Gateway',
  'AWS Aurora PostgreSQL',
  'Okta SSO & Identity',
  'Kubernetes Ingress Cluster',
  'Cloudflare CDN & Edge',
  'Internal GitLab Runner Pool',
  'SendGrid Email Relays',
  'Redis Cache Cluster',
  'Elasticsearch Cluster Alpha',
  'Office 365 Exchange Relay'
];

export const INITIAL_INCIDENTS: Incident[] = [];

export const MOCK_KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'KB-101',
    title: 'PostgreSQL HikariCP Connection Pool Exhaustion Playbook',
    category: 'DATABASE',
    service: 'AWS Aurora PostgreSQL',
    summary: 'Step-by-step triage guide to identify blocking transactions, inspect pg_stat_activity, and scale pool parameters safely.',
    content: `### 1. Verification
Check CloudWatch metrics for RDS:
- DatabaseConnections: Check if capped at 100% of max_connections.
- CPUUtilization: Verify if starvation is caused by CPU saturation or lock waits.

### 2. Identify Blocking Queries
Run the following in read/write session:
\`\`\`sql
SELECT pid, usename, client_addr, state, query_start, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC
LIMIT 10;
\`\`\`

### 3. Terminate Stuck Connection
If an unindexed query holds row-level locks:
\`\`\`sql
SELECT pg_cancel_backend(12345); -- Graceful cancel
SELECT pg_terminate_backend(12345); -- Force kill if unresponsive
\`\`\`

### 4. Application Configuration Mitigation
Increase pool timeout temporarily or bump max pool size if instance RAM > 8GB:
\`\`\`yaml
spring.datasource.hikari.maximum-pool-size: 350
spring.datasource.hikari.connection-timeout: 20000
\`\`\``,
    tags: ['postgres', 'database', 'hikaricp', 'locks'],
    readTimeMinutes: 4,
    lastUpdated: '2026-10-18',
    usageCount: 42
  },
  {
    id: 'KB-102',
    title: 'Okta SAML 2.0 Certificate Expiration & Key Rotation',
    category: 'AUTHENTICATION',
    service: 'Okta SSO & Identity',
    summary: 'Procedure for renewing SAML token signing certificates in Okta and synchronizing the x509 public key in Spring Security.',
    content: `### Overview
When SAML certificates expire, SSO login requests fail with signature verification exceptions.

### Rotation Steps
1. Log in to Okta Admin Portal (Identity -> Security -> Certificate Authority).
2. Choose target application: e.g. "VPN Gateways" or "Corporate Portal".
3. Under Sign-On Settings, generate New Signing Certificate.
4. Set status of new certificate to "Active".
5. Download raw .crt / .pem or copy thumbprint.
6. In Spring Boot application configuration:
\`\`\`yaml
spring.security.saml2.relyingparty.registration.okta:
  assertingparty.verification.credentials:
    - certificate-location: "classpath:credentials/okta-2026-renewed.crt"
\`\`\`
7. Run canary test with test user profile.`,
    tags: ['okta', 'saml', 'certificate', 'security', 'sso'],
    readTimeMinutes: 6,
    lastUpdated: '2026-10-12',
    usageCount: 19
  },
  {
    id: 'KB-103',
    title: 'Kubernetes Ingress-Nginx Pod OOMKilled Emergency Recovery',
    category: 'CLOUD_INFRA',
    service: 'Kubernetes Ingress Cluster',
    summary: 'How to diagnose memory leaks in Nginx Lua modules and adjust container memory limits without downtime.',
    content: `### Symptom Analysis
Containers exiting with code 137 denote an out-of-memory termination enacted by the Linux kernel cgroup OOM-killer.

### Diagnostic Command
\`\`\`bash
kubectl get pods -n ingress-nginx -o wide
kubectl describe pod <ingress-pod-name> -n ingress-nginx | grep -A 5 "Last State"
\`\`\`

### Resolution
1. Temporarily patch deployment resource limits:
\`\`\`bash
kubectl set resources deployment ingress-nginx-controller -n ingress-nginx --limits=memory=2Gi --requests=memory=1Gi
\`\`\`
2. Scale up replica count to distribute concurrent SSL handshakes:
\`\`\`bash
kubectl scale deployment ingress-nginx-controller -n ingress-nginx --replicas=6
\`\`\`
3. Verify Prometheus graph: \`container_memory_working_set_bytes\`.`,
    tags: ['k8s', 'ingress', 'nginx', 'oom', 'kubernetes'],
    readTimeMinutes: 5,
    lastUpdated: '2026-09-30',
    usageCount: 28
  },
  {
    id: 'KB-104',
    title: 'Stripe Webhook Replay & Idempotency Best Practices',
    category: 'SOFTWARE',
    service: 'Stripe Payment Gateway',
    summary: 'Architectural pattern to handle webhook retry floods gracefully using Redis TTL locks and Spring transactional events.',
    content: `### Core Rule
All webhook receivers must be idempotent. Never execute billing logic directly in the webhook HTTP handler.

### Recommended Implementation
1. Ingest webhook, verify Stripe-Signature header.
2. Check Redis key: \`stripe_event:<id>\`. If exists, return HTTP 200 immediately.
3. Set Redis key with 24-hour expiration.
4. Dispatch asynchronous event to internal message queue.
5. Return 200 OK within 200ms.`,
    tags: ['stripe', 'webhooks', 'idempotency', 'payments'],
    readTimeMinutes: 3,
    lastUpdated: '2026-10-01',
    usageCount: 15
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_welcome',
    title: 'ResolveIQ Workspace Initialized',
    message: 'Welcome to your clean ResolveIQ environment. All systems nominal with zero active incident cases.',
    type: 'SYSTEM',
    timestamp: new Date().toISOString(),
    read: false
  }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  organizationName: 'ResolveIQ Enterprise Systems',
  supportEmail: 'sre-oncall@company.internal',
  enableAiAutoTriage: true,
  aiModel: 'gemini-2.5-flash',
  renderBackendUrl: 'https://resolveiq-backend.onrender.com',
  supabaseEndpoint: 'https://xyzproject.supabase.co',
  slaPolicies: {
    P1_CRITICAL: { responseHours: 0.25, resolveHours: 2 },
    P2_HIGH: { responseHours: 0.5, resolveHours: 4 },
    P3_MEDIUM: { responseHours: 2, resolveHours: 12 },
    P4_LOW: { responseHours: 4, resolveHours: 48 }
  }
};

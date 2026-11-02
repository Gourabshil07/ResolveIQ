# ResolveIQ — Administrator Account Setup & Security Guide

This guide details how to securely initialize, configure, and manage the primary Administrator account in **ResolveIQ**, both in local development and in production on Render.

---

## 1. Security Architecture & Principles

To maintain enterprise security standards:

1. **No Public Admin Self-Registration**:
   The public registration form (`/register`) is strictly restricted to `IT User` and `Support Engineer`. The `ADMIN` role is forbidden from public registration. Any attempt to send a modified registration payload containing `role: "ADMIN"` is blocked on the server with `403 Forbidden`.

2. **BCrypt Password Hashing**:
   All passwords are encrypted using `BCryptPasswordEncoder` with salt rounds before being stored in the database. Plaintext passwords and password hashes are never returned in API responses.

3. **Backend Authorization & Spring Security**:
   Endpoints such as `/api/users` and `/api/users/{id}/role` enforce `@PreAuthorize("hasRole('ADMIN')")` on Spring Boot and matching role inspection in Express. Role claims supplied by clients are never trusted; only verified JWT claims and database records are used.

4. **Multiple Secure Bootstrap Paths**:
   - Automated bootstrap via backend environment variables on startup.
   - Protected one-time setup endpoint (`POST /api/auth/setup-admin`) secured with a secret key.
   - In-app role promotion by an existing administrator via the User Directory.

---

## 2. Setting Up the First Admin Account Locally

### Option A: Using Environment Variables (Recommended)

When ResolveIQ boots up, it automatically checks if an administrator account already exists. If none is found, it initializes the primary admin using these environment variables.

1. Create or edit your local `.env` file in the project root:

```bash
# ResolveIQ Admin Bootstrap Configuration
ADMIN_INITIAL_EMAIL=shilgourab7@gmail.com
ADMIN_INITIAL_PASSWORD=YourSecureAdminPassword123!
ADMIN_INITIAL_FULL_NAME=ResolveIQ Administrator
ADMIN_SETUP_SECRET=your-private-setup-secret-2026
```

2. Start the application:

```bash
# Run full-stack dev server (Port 3000)
npm run dev
```

3. On startup, the server output will confirm:
```
[ResolveIQ Security] Initialized primary administrator: admin@resolveiq.internal
```

4. Sign in via the login page:
   - Navigate to `http://localhost:3000`
   - Click **"Sign in as Administrator"**
   - Enter your email and password.

---

### Option B: Using the Protected One-Time Setup REST API

If you wish to initialize or configure the administrator via API:

```bash
curl -X POST http://localhost:3000/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -H "X-Admin-Setup-Secret: your-private-setup-secret-2026" \
  -d '{
    "fullName": "System Administrator",
    "email": "admin@resolveiq.internal",
    "password": "YourSecureAdminPassword123!"
  }'
```

**Security Rules for `/setup-admin`**:
- If no administrator exists in the database, this endpoint succeeds and provisions the initial admin.
- Once an administrator exists, further calls to `/setup-admin` are locked and return `403 Forbidden` unless the request includes a valid `X-Admin-Setup-Secret` header or matching secret payload.

---

## 3. Production Setup on Render

Deploying ResolveIQ on Render with Supabase PostgreSQL and Spring Boot:

### Step 1: Configure Environment Variables in Render Dashboard

1. In your **Render Dashboard**, select your ResolveIQ Web Service.
2. Go to the **Environment** tab.
3. Add the following required environment variables:

| Key | Example Value | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://db.<supabase-ref>.supabase.co:5432/postgres` | Supabase PostgreSQL JDBC connection string |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Supabase database user |
| `SPRING_DATASOURCE_PASSWORD` | `your-db-password` | Supabase database password |
| `JWT_SECRET` | `generate-a-strong-32-char-secret-string` | JWT signing secret |
| `ADMIN_INITIAL_EMAIL` | `admin@yourorganization.com` | Production admin email |
| `ADMIN_INITIAL_PASSWORD` | `GenerateAStrongPass2026!` | Production admin initial password |
| `ADMIN_INITIAL_FULL_NAME` | `Lead IT Administrator` | Production admin display name |
| `ADMIN_SETUP_SECRET` | `generate-a-random-token-here` | Secret token to guard `/setup-admin` |

### Step 2: Automatic Database Migration & Seeding

On first startup in Render, Spring Boot runs Flyway migrations:
- `V1__init_schema.sql`: Provisions `users` and `incidents` tables with indexes.
- `V2__seed_admin.sql`: Safely inserts the initial admin record if not present.
- `AdminInitializer.java`: Ensures the admin account is mapped to the configured `ADMIN_INITIAL_EMAIL` and encoded with BCrypt.

### Step 3: Verify Admin Sign-In in Production

1. Navigate to your deployed Render URL (e.g., `https://resolveiq.onrender.com`).
2. Click **"Sign in as Administrator"** on the login page.
3. Sign in using your `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD`.
4. You will be redirected to the **Admin Dashboard** with access to:
   - System incident metrics & triage.
   - All Incidents overview and assignment to Support Engineers.
   - **User Directory** for managing and promoting roles.

---

## 4. Promoting Other Users to Administrator or Support Engineer

Once you are signed in as an Administrator:

1. Click on **User Directory** in the left sidebar (`/admin/users`).
2. Locate the user you wish to modify.
3. Click **Change Role**.
4. Select the desired role:
   - **IT User**: Can report tickets and track status.
   - **Support Engineer**: Can claim, triage, update status to `IN_PROGRESS`, and resolve tickets with resolution notes.
   - **Administrator**: Full access to all incidents, assignment controls, and user directory.
5. Click **Update Role** to apply the change immediately.

---

## 5. Security Verification Checklist

- [x] Public registration only offers `IT User` and `Support Engineer`.
- [x] Direct API call attempting `POST /api/auth/register` with `role: "ADMIN"` returns `403 Forbidden`.
- [x] Passwords stored in Supabase PostgreSQL are BCrypt hashed.
- [x] Admin endpoints are protected by Spring Security / JWT middleware.
- [x] Password hashes are never exposed in user responses or directory listings.

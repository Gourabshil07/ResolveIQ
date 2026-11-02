-- V4__security_hardening_rls.sql
-- ResolveIQ Security Hardening: Enable Row Level Security & Revoke Direct PostgREST Grants
--
-- Rationale:
-- 1. Enable Row Level Security (RLS) on all 7 tables to remove Supabase UNRESTRICTED warnings.
-- 2. Revoke SELECT, INSERT, UPDATE, DELETE, TRUNCATE on public tables and sequences from 'anon' and 'authenticated'
--    roles to prevent direct PostgREST or unauthenticated access from bypassing the Express backend.
-- 3. Alter default privileges for future tables/sequences created by 'postgres' in the public schema.
-- 4. Note: Node.js/Express backend connects using the 'postgres' database role (table owner), which bypasses
--    RLS by default, ensuring zero latency or operational impact on Express API behavior.

-- 1. Enable Row Level Security on all 7 tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Revoke table privileges from anon and authenticated roles
REVOKE ALL ON TABLE public.users FROM anon, authenticated;
REVOKE ALL ON TABLE public.incidents FROM anon, authenticated;
REVOKE ALL ON TABLE public.incident_messages FROM anon, authenticated;
REVOKE ALL ON TABLE public.incident_updates FROM anon, authenticated;
REVOKE ALL ON TABLE public.incident_feedback FROM anon, authenticated;
REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;

-- 3. Revoke sequence privileges in schema public
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- 4. Alter default privileges for future tables and sequences created by postgres in schema public
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

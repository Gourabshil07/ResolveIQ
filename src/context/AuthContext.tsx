import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfigError } from '../lib/supabase';
import { api, authStorage, UserProfile, UserRole } from '../services/api';
import { Role, User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, selectedRole?: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    role: 'IT_USER' | 'SUPPORT_ENGINEER' | 'IT_SUPPORT';
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const cached = authStorage.getUser();
    if (cached) {
      return {
        id: cached.id,
        name: cached.fullName,
        email: cached.email,
        role: cached.role as Role,
        department:
          cached.role === 'IT_USER'
            ? 'IT Operations'
            : cached.role === 'SUPPORT_ENGINEER'
            ? 'Support Engineering'
            : 'System Administration',
      };
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!authStorage.getToken();
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync user metadata into state & PostgreSQL database
  const syncSupabaseUser = useCallback(async (sessionUser: any, access_token?: string) => {
    if (!sessionUser) {
      authStorage.clear();
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    const meta = sessionUser.user_metadata || {};
    const fullName = meta.fullName || meta.full_name || sessionUser.email?.split('@')[0] || 'User';
    const role: UserRole = (
      meta.role === 'SUPPORT_ENGINEER'
        ? 'SUPPORT_ENGINEER'
        : meta.role === 'ADMIN'
        ? 'ADMIN'
        : 'IT_USER'
    ) as UserRole;
    const department =
      meta.department ||
      (role === 'SUPPORT_ENGINEER'
        ? 'Support Engineering'
        : role === 'ADMIN'
        ? 'System Administration'
        : 'IT Operations');

    if (access_token) {
      authStorage.setToken(access_token);
    }

    // Secure profile synchronization is routed exclusively through authenticated backend API

    // Sync profile to backend API / PostgreSQL database using Supabase Auth UUID as authority
    try {
      const res = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token || authStorage.getToken()}`,
        },
        body: JSON.stringify({
          id: sessionUser.id,
          email: sessionUser.email,
          fullName,
          role,
          department,
        }),
      });

      if (res.ok) {
        const syncData = await res.json();
        const dbUser = syncData.user;

        if (dbUser.status === 'BLOCKED' || dbUser.isBlocked) {
          authStorage.clear();
          setCurrentUser(null);
          setIsAuthenticated(false);
          if (isSupabaseConfigured) {
            try { await supabase.auth.signOut(); } catch {}
          }
          return;
        }

        const appUser: User = {
          id: dbUser.id,
          name: dbUser.fullName || fullName,
          email: dbUser.email || sessionUser.email,
          role: dbUser.role as Role,
          department: dbUser.department || department,
        };

        authStorage.setUser({
          id: dbUser.id,
          fullName: dbUser.fullName || fullName,
          email: dbUser.email || sessionUser.email,
          role: dbUser.role as UserRole,
        });

        setCurrentUser(appUser);
        setIsAuthenticated(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403) {
          authStorage.clear();
          setCurrentUser(null);
          setIsAuthenticated(false);
          if (isSupabaseConfigured) {
            try { await supabase.auth.signOut(); } catch {}
          }
        }
        console.warn('[Profile Sync Diagnostic] /api/auth/sync-user notice:', errorData.error || res.statusText);
      }
    } catch (e: any) {
      console.warn('[Profile Sync Diagnostic] Network sync notice:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Session listener
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (!isSupabaseConfigured) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && isMounted) {
          await syncSupabaseUser(session.user, session.access_token);
        } else if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.warn('[Auth Diagnostic] Supabase session initialization notice:', err.message);
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session) {
            await syncSupabaseUser(session.user, session.access_token);
          }
        } else if (event === 'SIGNED_OUT') {
          authStorage.clear();
          setCurrentUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, [syncSupabaseUser]);

  // Normal user login handler (supports Supabase Auth & Backend API)
  const login = async (email: string, password: string, selectedRole?: string) => {
    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Block admin email from normal login
    try {
      const checkRes = await fetch('/api/auth/check-admin-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const checkData = await checkRes.json();
      if (checkData.isAdminEmail) {
        setIsLoading(false);
        throw new Error('This email is reserved for administrator access. Please use the Admin Login portal.');
      }
    } catch (e: any) {
      if (e.message && e.message.includes('reserved for administrator')) {
        throw e;
      }
    }

    // 2. Try Supabase Auth first if configured
    let supabaseSessionToken: string | null = null;
    let supabaseUser: any = null;

    if (isSupabaseConfigured) {
      try {
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (!sbError && sbData?.user && sbData?.session) {
          supabaseSessionToken = sbData.session.access_token;
          supabaseUser = sbData.user;
        }
      } catch (sbErr) {
        console.warn('[Auth System] Supabase Auth check bypassed, falling back to backend API:', sbErr);
      }
    }

    // 3. If Supabase Auth session obtained, sync profile via /api/auth/sync-user
    if (supabaseSessionToken && supabaseUser) {
      try {
        const syncRes = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseSessionToken}`,
          },
          body: JSON.stringify({
            id: supabaseUser.id,
            email: supabaseUser.email || trimmedEmail,
            fullName: supabaseUser.user_metadata?.fullName || supabaseUser.user_metadata?.full_name,
            role: supabaseUser.user_metadata?.role,
            department: supabaseUser.user_metadata?.department,
          }),
        });

        if (syncRes.ok) {
          const { user: dbUser } = await syncRes.json();
          if (dbUser.status === 'BLOCKED' || dbUser.isBlocked) {
            try { await supabase.auth.signOut(); } catch {}
            authStorage.clear();
            setIsLoading(false);
            throw new Error('Your account has been blocked. Please contact the administrator.');
          }
          if (dbUser.isDeleted) {
            try { await supabase.auth.signOut(); } catch {}
            authStorage.clear();
            setIsLoading(false);
            throw new Error('User account no longer exists.');
          }

          const isSupport = (r: any) => r === 'SUPPORT_ENGINEER' || r === 'IT_SUPPORT';
          const isRoleMatch = (sel?: string, actual?: string) => {
            if (!sel) return true;
            if (sel === actual) return true;
            if (isSupport(sel) && isSupport(actual)) return true;
            return false;
          };

          if (selectedRole && !isRoleMatch(selectedRole, dbUser.role)) {
            try { await supabase.auth.signOut(); } catch {}
            authStorage.clear();
            setIsLoading(false);
            throw new Error(`Your account is registered as ${dbUser.role}. Please use the correct login option.`);
          }

          authStorage.setToken(supabaseSessionToken);
          authStorage.setUser({
            id: dbUser.id,
            fullName: dbUser.fullName,
            email: dbUser.email,
            role: dbUser.role as UserRole,
          });

          setCurrentUser({
            id: dbUser.id,
            name: dbUser.fullName,
            email: dbUser.email,
            role: dbUser.role as Role,
            department: dbUser.department || (isSupport(dbUser.role) ? 'Support Engineering' : 'IT Operations'),
          });

          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        if (err.message && err.message.includes('Please use the correct login option')) {
          throw err;
        }
        // Fall back to backend authentication
      }
    }

    // 4. Backend API Login (/api/auth/login)
    const backendRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, password, role: selectedRole }),
    });

    const backendData = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok || !backendData.token || !backendData.user) {
      setIsLoading(false);
      throw new Error(backendData.error || 'Invalid email or password');
    }

    const dbUser = backendData.user;
    if (dbUser.status === 'BLOCKED' || dbUser.isBlocked) {
      authStorage.clear();
      setIsLoading(false);
      throw new Error('Your account has been blocked. Please contact the administrator.');
    }

    if (dbUser.isDeleted) {
      authStorage.clear();
      setIsLoading(false);
      throw new Error('User account no longer exists.');
    }

    authStorage.setToken(backendData.token);
    authStorage.setUser({
      id: dbUser.id,
      fullName: dbUser.fullName,
      email: dbUser.email,
      role: dbUser.role as UserRole,
    });

    setCurrentUser({
      id: dbUser.id,
      name: dbUser.fullName,
      email: dbUser.email,
      role: dbUser.role as Role,
      department: dbUser.department || (dbUser.role === 'SUPPORT_ENGINEER' || dbUser.role === 'IT_SUPPORT' ? 'Support Engineering' : 'IT Operations'),
    });

    setIsAuthenticated(true);
    setIsLoading(false);
  };

  // Dedicated Admin Login Handler
  const adminLogin = async (email: string, password: string) => {
    setIsLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setIsLoading(false);
        throw new Error(data.error || 'Administrator login failed.');
      }

      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
        } catch {
          // ignore if admin password in local DB differs from Supabase Auth
        }
      }

      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
      setCurrentUser({
        id: data.user.id,
        name: data.user.fullName,
        email: data.user.email,
        role: 'ADMIN',
        department: 'System Administration',
      });
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
  };

  // Register handler using Supabase Auth as the single authority
  const register = async (payload: {
    fullName: string;
    email: string;
    password: string;
    role: 'IT_USER' | 'SUPPORT_ENGINEER' | 'IT_SUPPORT';
  }) => {
    setIsLoading(true);
    const trimmedEmail = payload.email.trim().toLowerCase();
    const cleanRole = payload.role === 'IT_SUPPORT' ? 'IT_SUPPORT' : (payload.role === 'SUPPORT_ENGINEER' ? 'SUPPORT_ENGINEER' : 'IT_USER');

    // 1. Block admin email from normal registration
    try {
      const checkRes = await fetch('/api/auth/check-admin-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const checkData = await checkRes.json();
      if (checkData.isAdminEmail) {
        setIsLoading(false);
        throw new Error('This email address is reserved for administrator access. Please use the dedicated Admin Login portal.');
      }
    } catch (e: any) {
      if (e.message && e.message.includes('reserved for administrator')) {
        throw e;
      }
    }

    // Enforce permanent role check on backend before registration
    const valRes = await fetch('/api/auth/validate-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, role: cleanRole }),
    });
    const valData = await valRes.json().catch(() => ({}));
    if (!valRes.ok || !valData.valid) {
      setIsLoading(false);
      throw new Error(valData.error || 'Registration cannot proceed for this account.');
    }

    // Register via Backend API (/api/auth/register)
    const backendRes = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: payload.fullName.trim(),
        email: trimmedEmail,
        password: payload.password,
        role: cleanRole,
      }),
    });

    const backendData = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok || !backendData.token || !backendData.user) {
      setIsLoading(false);
      throw new Error(backendData.error || 'Registration failed.');
    }

    const dbUser = backendData.user;
    const userToken = backendData.token;

    // Optional Supabase Auth signup in background (non-blocking if Supabase Auth is unreachable)
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signUp({
          email: trimmedEmail,
          password: payload.password,
          options: {
            data: {
              fullName: payload.fullName.trim(),
              role: cleanRole,
              department: cleanRole === 'SUPPORT_ENGINEER' ? 'Support Engineering' : 'IT Operations',
            },
          },
        });
      } catch {
        // Non-blocking
      }
    }

    authStorage.setToken(userToken);
    authStorage.setUser({
      id: dbUser.id,
      fullName: dbUser.fullName,
      email: dbUser.email,
      role: dbUser.role as UserRole,
    });

    setCurrentUser({
      id: dbUser.id,
      name: dbUser.fullName,
      email: dbUser.email,
      role: dbUser.role as Role,
      department: dbUser.department || (cleanRole === 'SUPPORT_ENGINEER' ? 'Support Engineering' : 'IT Operations'),
    });

    setIsAuthenticated(true);
    setIsLoading(false);
  };

  // Logout handler
  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Non-blocking
      }
    }
    authStorage.clear();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const refreshProfile = async () => {
    if (isSupabaseConfigured) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await syncSupabaseUser(session.user, session.access_token);
        return;
      }
    }
    const token = authStorage.getToken();
    if (token) {
      try {
        const profile = await api.getMe();
        setCurrentUser({
          id: profile.id,
          name: profile.fullName,
          email: profile.email,
          role: profile.role as Role,
          department: profile.role === 'IT_USER' ? 'IT Operations' : profile.role === 'SUPPORT_ENGINEER' ? 'Support Engineering' : 'System Administration',
        });
        setIsAuthenticated(true);
      } catch {
        authStorage.clear();
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        login,
        adminLogin,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

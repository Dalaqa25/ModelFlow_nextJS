'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/db/supabase';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const router = useRouter();

  const clearBrokenLocalSession = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {}
    setUser(null);
  };

  const validateServerSession = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
        redirect: 'manual',
        cache: 'no-store',
      });

      if (response.type === 'opaqueredirect') {
        return false;
      }

      if (response.status >= 300 && response.status < 400) {
        return false;
      }

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        // Reading the local session first avoids two unnecessary network requests
        // for signed-out visitors. Authenticated sessions are still verified by
        // both Supabase and ModelGrow before they are trusted.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) {
          if (sessionError) await clearBrokenLocalSession();
          else setUser(null);
          return;
        }

        const [userResult, isServerSessionValid] = await Promise.all([
          supabase.auth.getUser(),
          validateServerSession(),
        ]);
        const verifiedUser = userResult.data?.user;

        if (userResult.error || !verifiedUser || !isServerSessionValid) {
          await clearBrokenLocalSession();
        } else {
          setUser(verifiedUser);
        }
      } catch (error) {
        await clearBrokenLocalSession();
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // getInitialSession owns the first validation. Repeating it here adds a
        // second /api/user round trip and delays the initial app reveal.
        if (event === 'INITIAL_SESSION') return;

        if (!session?.user) {
          setUser(null);
          setLoading(false);
          return;
        }

        const isServerSessionValid = await validateServerSession();
        if (!isServerSessionValid) {
          await clearBrokenLocalSession();
        } else {
          setUser(session.user);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signUpWithOtp = async (email, userData = {}) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userData }),
      });
      const json = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: json?.error || 'Signup failed', field: json?.field, validationErrors: json?.validationErrors } };
      }
      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Network error during signup' } };
    }
  };

  const signInWithOtp = async (email) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: json?.error || 'Failed to send OTP', field: json?.field } };
      }
      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Network error during sign in' } };
    }
  };

  const verifyOtp = async (email, token) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      const json = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: json?.error || 'OTP verification failed' } };
      }
      if (json.session) await supabase.auth.setSession(json.session);
      if (json.user) setUser(json.user);
      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Network error during OTP verification' } };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
      if (typeof window !== 'undefined') localStorage.removeItem('userName');
      router.push('/');
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const clearAuthData = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
    } catch (error) { }
  };

  const value = {
    user,
    loading,
    signUpWithOtp,
    signInWithOtp,
    verifyOtp,
    signOut,
    clearAuthData,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

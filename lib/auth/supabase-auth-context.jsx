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
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          await supabase.auth.signOut({ scope: 'local' });
          setUser(null);
        } else {
          setUser(session?.user ?? null);
          if (session?.user?.email) {
            try { await fetch('/api/user', { method: 'GET' }); } catch (e) { }
          }
        }
      } catch (error) {
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

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

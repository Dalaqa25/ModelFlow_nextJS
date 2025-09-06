'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from './supabase';
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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If there's an error getting the session, clear any stale data
        if (error) {
          console.error('Session error, clearing auth state:', error);
          await supabase.auth.signOut({ scope: 'local' });
          setUser(null);
        } else {
          setUser(session?.user ?? null);
          // Ensure app-level user row exists when session is present
          if (session?.user?.email) {
            try {
              await fetch('/api/user', { method: 'GET' });
            } catch (e) {
              console.warn('Failed to ensure user row exists:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // Clear any stale session data
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Handle specific auth events
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
        } else {
          setUser(session?.user ?? null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // OTP-based authentication methods
  const signUpWithOtp = async (email, userData = {}) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userData }),
      });

      const json = await response.json();

      if (!response.ok) {
        const message = json?.error || 'Signup failed';
        return { data: null, error: { message, field: json?.field, validationErrors: json?.validationErrors } };
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
        const message = json?.error || 'Failed to send OTP';
        return { data: null, error: { message, field: json?.field } };
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
        const message = json?.error || 'OTP verification failed';
        return { data: null, error: { message } };
      }

      // If we got a session back, set it in the Supabase client
      if (json.session) {
        await supabase.auth.setSession(json.session);
      }

      // Update the user state if verification was successful
      if (json.user) {
        setUser(json.user);
      }

      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Network error during OTP verification' } };
    }
  };

  // signUp method removed - will be replaced with OTP-based signup

  const signOut = async () => {
    try {
      // Clear all auth data including localStorage
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
      // Redirect to home page immediately after sign out
      router.push('/');
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const clearAuthData = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  // Password reset methods removed - not needed for OTP-based auth

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
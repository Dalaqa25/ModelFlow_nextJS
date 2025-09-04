'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { toast } from 'react-hot-toast';

export default function TestSignupPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword123');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, user, isAuthenticated } = useAuth();

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const { data, error } = await signUp(email, password, {
        name: 'Test User',
        email: email,
      });
      
      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message);
      } else {
        toast.success('Account created successfully! Check your email for confirmation.');
      }
    } catch (error) {
      console.error('Sign up exception:', error);
      toast.error('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('Sign in error:', error);
        toast.error(error.message);
      } else {
        toast.success('Logged in successfully!');
      }
    } catch (error) {
      console.error('Sign in exception:', error);
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Auth Test Page
          </h2>
          <div className="mt-2 text-center text-sm text-gray-600">
            <p>Auth Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
            {user && <p>User: {user.email}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
            
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h3 className="font-medium text-gray-900 mb-2">Debug Info:</h3>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify({
              isAuthenticated,
              user: user ? {
                id: user.id,
                email: user.email,
                hasMetadata: !!user.user_metadata
              } : null
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 
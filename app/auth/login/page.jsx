'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('Sign in error:', error);
        toast.error(error.message);
      } else {
        toast.success('Logged in successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Sign in exception:', error);
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Debug info
    isAuthenticated,
    user: user ? { id: user.id, email: user.email } : null
  });

  return (
    <UnifiedBackground variant="auth" className="pt-16">
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
              Welcome Back
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Sign in to your account
            </h2>
            <p className="text-gray-300">
              Access your AI model marketplace
            </p>
          </div>
          
          <UnifiedCard variant="solid" className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/auth/signup')}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </form>
          </UnifiedCard>
        </div>
      </div>
    </UnifiedBackground>
  );
} 
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';
import { validateSignupForm, getPasswordStrength } from '@/lib/validation-utils';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '', color: 'text-gray-400', strengthText: '' });
  const { signUp } = useAuth();
  const router = useRouter();

  // Debounced username availability check
  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username || username.length < 5) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Debounce username checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (name) {
        checkUsernameAvailability(name);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [name, checkUsernameAvailability]);

  // Update password strength on password change
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(password));
  }, [password]);

  // Real-time validation
  const validateField = (field, value) => {
    const validation = validateSignupForm({ email, password, username: name });
    setValidationErrors(validation.errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Client-side validation
    const validation = validateSignupForm({ email, password, username: name });
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setLoading(false);
      return;
    }

    // Check username availability one more time
    if (usernameAvailable === false) {
      toast.error('Username is already taken. Please choose a different one.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, {
        name: name,
        email: email,
      });
      
      if (error) {
        // Handle specific error types
        if (error.message.includes('already registered')) {
          setValidationErrors({ email: ['An account with this email already exists'] });
        } else if (error.message.includes('password')) {
          setValidationErrors({ password: ['Password does not meet requirements'] });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.');
        router.push('/auth/login');
      }
    } catch (error) {
      toast.error('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedBackground variant="auth" className="pt-10">
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">          
          <UnifiedCard variant="solid" className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="username"
                      required
                      className={`w-full px-4 py-3 bg-slate-700/50 border rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300 ${
                        validationErrors.username?.length > 0 
                          ? 'border-red-500' 
                          : usernameAvailable === true 
                            ? 'border-green-500' 
                            : usernameAvailable === false 
                              ? 'border-red-500' 
                              : 'border-slate-600/50'
                      }`}
                      placeholder="Choose a username (5-20 characters)"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        validateField('username', e.target.value);
                      }}
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                      </div>
                    )}
                    {usernameAvailable === true && !checkingUsername && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {usernameAvailable === false && !checkingUsername && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {validationErrors.username?.length > 0 && (
                    <div className="mt-1 text-sm text-red-400">
                      {validationErrors.username.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}
                  {usernameAvailable === true && !validationErrors.username?.length && (
                    <div className="mt-1 text-sm text-green-400">Username is available!</div>
                  )}
                  {usernameAvailable === false && (
                    <div className="mt-1 text-sm text-red-400">Username is already taken</div>
                  )}
                </div>
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
                    className={`w-full px-4 py-3 bg-slate-700/50 border rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300 ${
                      validationErrors.email?.length > 0 ? 'border-red-500' : 'border-slate-600/50'
                    }`}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateField('email', e.target.value);
                    }}
                  />
                  {validationErrors.email?.length > 0 && (
                    <div className="mt-1 text-sm text-red-400">
                      {validationErrors.email.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={`w-full px-4 py-3 bg-slate-700/50 border rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300 ${
                      validationErrors.password?.length > 0 ? 'border-red-500' : 'border-slate-600/50'
                    }`}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validateField('password', e.target.value);
                    }}
                  />
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Password Strength:</span>
                        <span className={`text-xs font-medium ${passwordStrength.color}`}>
                          {passwordStrength.strengthText}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score <= 1 ? 'bg-red-500' :
                            passwordStrength.score <= 2 ? 'bg-orange-500' :
                            passwordStrength.score <= 3 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <div className={`text-xs mt-1 ${passwordStrength.color}`}>
                        {passwordStrength.feedback}
                      </div>
                    </div>
                  )}
                  
                  {validationErrors.password?.length > 0 && (
                    <div className="mt-1 text-sm text-red-400">
                      {validationErrors.password.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}
                  
                  {/* Password Requirements */}
                  <div className="mt-2 text-xs text-gray-400">
                    <div>Password must contain:</div>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                      <li>At least 8 characters</li>
                      <li>One uppercase letter</li>
                      <li>One lowercase letter</li>
                      <li>One number</li>
                      <li>One special symbol</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !email || !password || !name || usernameAvailable === false || Object.values(validationErrors).some(errors => errors.length > 0)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/auth/login')}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
                  >
                    Sign in
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
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';
import { validateEmail, validateUsername } from '@/lib/validation-utils';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { signUpWithOtp, verifyOtp } = useAuth();
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

  // Update password strength on password change - REMOVED
  // useEffect(() => {
  //   setPasswordStrength(getPasswordStrength(password));
  // }, [password]);

  // Real-time validation
  const validateField = (field, value) => {
    const emailValidation = validateEmail(email);
    const usernameValidation = validateUsername(name);
    setValidationErrors({
      email: emailValidation.errors,
      username: usernameValidation.errors,
    });
  };

  // Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Client-side validation
    const emailValidation = validateEmail(email);
    const usernameValidation = validateUsername(name);
    const errors = {
      email: emailValidation.errors,
      username: usernameValidation.errors,
    };
    
    if (!emailValidation.isValid || !usernameValidation.isValid) {
      setValidationErrors(errors);
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
      const { data, error } = await signUpWithOtp(email, {
        name: name,
        email: email,
      });
      
      if (error) {
        // Handle specific error types
        if (error.validationErrors) {
          setValidationErrors(error.validationErrors);
        } else if (error.field === 'email') {
          setValidationErrors({ email: [error.message] });
        } else if (error.field === 'username') {
          setValidationErrors({ username: [error.message] });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('OTP sent to your email!');
        setOtpSent(true);
        startResendCooldown();
      }
    } catch (error) {
      toast.error('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await verifyOtp(email, otpCode);
      
      if (error) {
        console.error('Verify OTP error:', error);
        toast.error(error.message);
      } else {
        toast.success('Account created and verified successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Verify OTP exception:', error);
      toast.error('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  // Resend cooldown timer
  const startResendCooldown = () => {
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const { data, error } = await signUpWithOtp(email, {
        name: name,
        email: email,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('New OTP sent to your email!');
        startResendCooldown();
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedBackground variant="auth" className="pt-10">
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">          
          <UnifiedCard variant="solid" className="mt-8">
            {!otpSent ? (
              // Step 1: Signup form
              <form className="space-y-6" onSubmit={handleSendOtp}>
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
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || !email || !name || usernameAvailable === false || Object.values(validationErrors).some(errors => errors.length > 0)}
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending OTP...
                      </div>
                    ) : (
                      'Send OTP Code'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Step 2: OTP verification
              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div className="text-center mb-4">
                  <p className="text-gray-300">
                    We sent a verification code to
                  </p>
                  <p className="text-white font-medium">{email}</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="otpCode" className="block text-sm font-medium text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      id="otpCode"
                      name="otpCode"
                      type="text"
                      required
                      maxLength="6"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300 text-center text-2xl tracking-widest"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Verify & Create Account'
                    )}
                  </button>
                </div>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? (
                      `Resend code in ${resendCooldown}s`
                    ) : (
                      'Resend code'
                    )}
                  </button>
                  
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                        setResendCooldown(0);
                      }}
                      className="text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200"
                    >
                      Change details
                    </button>
                  </div>
                </div>
              </form>
            )}
              
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
          </UnifiedCard>
        </div>
      </div>
    </UnifiedBackground>
  );
} 
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { IoClose } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { validateEmail, validateUsername } from '@/lib/validation-utils';

export default function SignUpDialog({ isOpen, onClose, onSwitchToSignIn }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const { signUpWithOtp, verifyOtp } = useAuth();
  const router = useRouter();

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setUsername('');
      setOtpCode('');
      setOtpSent(false);
      setLoading(false);
      setResendCooldown(0);
      setValidationErrors({});
      setUsernameAvailable(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Check username availability
  const checkUsernameAvailability = useCallback(async (usernameToCheck) => {
    if (!usernameToCheck || usernameToCheck.length < 5) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameToCheck }),
      });
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Debounce username checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (username) checkUsernameAvailability(username);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [username, checkUsernameAvailability]);

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

  // Validate fields
  const validateField = (field, value) => {
    const currentEmail = field === 'email' ? value : email;
    const currentUsername = field === 'username' ? value : username;
    
    const emailValidation = validateEmail(currentEmail);
    const usernameValidation = validateUsername(currentUsername);
    setValidationErrors({
      email: emailValidation.errors,
      username: usernameValidation.errors,
    });
  };

  // Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    const emailValidation = validateEmail(email);
    const usernameValidation = validateUsername(username);
    
    if (!emailValidation.isValid || !usernameValidation.isValid) {
      setValidationErrors({
        email: emailValidation.errors,
        username: usernameValidation.errors,
      });
      return;
    }

    if (usernameAvailable === false) {
      toast.error('Username is already taken');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUpWithOtp(email, { name: username, email });
      
      if (error) {
        if (error.validationErrors) {
          setValidationErrors(error.validationErrors);
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
      const { error } = await verifyOtp(email, otpCode);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created successfully!');
        onClose();
        router.push('/main');
      }
    } catch (error) {
      toast.error('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const { error } = await signUpWithOtp(email, { name: username, email });
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('New OTP sent!');
        startResendCooldown();
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const hasValidationErrors = Object.values(validationErrors).some(errors => errors?.length > 0);
  const isFormValid = email && username && usernameAvailable !== false && !hasValidationErrors;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          {/* Dialog */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md mx-4 bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl shadow-purple-900/20 backdrop-blur-xl p-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <IoClose className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                Get Started
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Create your account
              </h2>
              <p className="text-gray-400">
                Join the AI automation platform
              </p>
            </div>

            {!otpSent ? (
              // Step 1: Signup form
              <form className="space-y-4" onSubmit={handleSendOtp}>
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoFocus
                      className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                        validationErrors.username?.length > 0 ? 'border-red-500' :
                        usernameAvailable === true ? 'border-green-500' :
                        usernameAvailable === false ? 'border-red-500' : 'border-slate-700/50'
                      }`}
                      placeholder="Choose a username (5-20 characters)"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        validateField('username', e.target.value);
                      }}
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                      </div>
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">✓</div>
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">✗</div>
                    )}
                  </div>
                  {validationErrors.username?.map((err, i) => (
                    <p key={i} className="mt-1 text-sm text-red-400">{err}</p>
                  ))}
                  {usernameAvailable === true && !validationErrors.username?.length && (
                    <p className="mt-1 text-sm text-green-400">Username is available!</p>
                  )}
                  {usernameAvailable === false && (
                    <p className="mt-1 text-sm text-red-400">Username is already taken</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                  <input
                    type="email"
                    required
                    className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      validationErrors.email?.length > 0 ? 'border-red-500' : 'border-slate-700/50'
                    }`}
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateField('email', e.target.value);
                    }}
                  />
                  {validationErrors.email?.map((err, i) => (
                    <p key={i} className="mt-1 text-sm text-red-400">{err}</p>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              </form>
            ) : (
              // Step 2: OTP verification
              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div className="text-center mb-4">
                  <p className="text-gray-400">We sent a verification code to</p>
                  <p className="text-white font-medium">{email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-center text-2xl tracking-widest"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
                    >
                      Change details
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Footer */}
            <div className="text-center mt-6 pt-6 border-t border-white/10">
              <p className="text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignIn}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

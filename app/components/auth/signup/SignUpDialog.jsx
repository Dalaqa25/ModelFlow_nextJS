'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { validateEmail, validateUsername } from '@/lib/auth/validation-utils';
import { takePendingDestination } from '@/lib/auth/pending-destination';
import AuthDialogFrame from '../AuthDialogFrame';

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
  const [mounted, setMounted] = useState(false);
  const { signUpWithOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

    const cleanEmail = email.trim().toLowerCase();
    const emailValidation = validateEmail(cleanEmail);
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
      setEmail(cleanEmail);
      const { error } = await signUpWithOtp(cleanEmail, { name: username, email: cleanEmail });

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
        // Carry on to whatever they were trying to reach before the wall.
        const destination = takePendingDestination();
        if (destination) {
          router.push(destination);
        } else if (pathname === '/' || pathname === '/auth/login') {
          router.push('/main');
        } else {
          router.refresh();
        }
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
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await signUpWithOtp(cleanEmail, { name: username, email: cleanEmail });

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

  if (!mounted) return null;

  return createPortal(
    <AuthDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      eyebrow="Get started"
      title="Put the repeated work in motion."
      description="Create your ModelGrow account, then choose the first task you want handled in the background."
      labelledBy="signup-dialog-title"
    >
            {!otpSent ? (
              <form className="space-y-4" onSubmit={handleSendOtp}>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.09em] text-[#4e5568]">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoFocus
                      className={`auth-landing-input pr-11 ${validationErrors.username?.length > 0 ? '!border-[#ca5968] !ring-[#ca5968]/10' :
                          usernameAvailable === true ? '!border-[#2e9f73]' :
                            usernameAvailable === false ? '!border-[#ca5968]' : ''
                        }`}
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        validateField('username', e.target.value);
                      }}
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7041d6]/20 border-t-[#7041d6]" />
                      </div>
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[#218461]">✓</div>
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[#bd4a5a]">✗</div>
                    )}
                  </div>
                  {validationErrors.username?.map((err, i) => (
                    <p key={i} className="mt-1 text-xs font-semibold text-[#bd4a5a]">{err}</p>
                  ))}
                  {usernameAvailable === true && !validationErrors.username?.length && (
                    <p className="mt-1 text-xs font-semibold text-[#218461]">Username is available</p>
                  )}
                  {usernameAvailable === false && (
                    <p className="mt-1 text-xs font-semibold text-[#bd4a5a]">Username is already taken</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.09em] text-[#4e5568]">Email address</label>
                  <input
                    type="email"
                    required
                    className={`auth-landing-input ${validationErrors.email?.length > 0 ? '!border-[#ca5968] !ring-[#ca5968]/10' : ''
                      }`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateField('email', e.target.value);
                    }}
                  />
                  {validationErrors.email?.map((err, i) => (
                    <p key={i} className="mt-1 text-xs font-semibold text-[#bd4a5a]">{err}</p>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="auth-landing-submit mt-2"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending code…
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">Create account <ArrowRight className="h-4 w-4" /></span>
                  )}
                </button>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div className="rounded-[18px] border border-[#6f4bc4]/10 bg-[#f3effb] px-4 py-3 text-sm text-[#6d6580]">
                  We sent a verification code to <span className="font-black text-[#3e3459]">{email}</span>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.09em] text-[#4e5568]">Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    autoFocus
                    className="auth-landing-input text-center text-2xl tracking-[0.35em]"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="auth-landing-submit"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verifying…
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
                    className="text-sm font-black text-[#7041d6] transition-colors hover:text-[#4e2aa7] disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs font-bold text-[#8b91a0] transition-colors hover:text-[#4e5568]"
                    >
                      Change details
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-7 border-t border-[#25204f]/8 pt-5 text-center">
              <p className="text-sm font-medium text-[#777e90]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignIn}
                  className="font-black text-[#7041d6] transition-colors hover:text-[#4e2aa7]"
                >
                  Sign in
                </button>
              </p>
              <p className="mt-3 text-[10px] font-semibold leading-5 text-[#9a9fad]">
                By creating an account, you agree to our{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-[#747b8d] underline transition-colors hover:text-[#7041d6]">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-[#747b8d] underline transition-colors hover:text-[#7041d6]">
                  Privacy Policy
                </a>
              </p>
            </div>
    </AuthDialogFrame>,
    document.body
  );
}

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import AuthDialogFrame from '../AuthDialogFrame';
import { takePendingDestination } from '@/lib/auth/pending-destination';

export default function SignInDialog({ isOpen, onClose, onSwitchToSignUp, customMessage }) {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { signInWithOtp, verifyOtp } = useAuth();
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
      setOtpCode('');
      setOtpSent(false);
      setLoading(false);
      setResendCooldown(0);
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

  // Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signInWithOtp(email);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('OTP sent to your email!');
        setOtpSent(true);
        startResendCooldown();
      }
    } catch (error) {
      toast.error('An error occurred while sending OTP');
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
        toast.success('Logged in successfully!');
        onClose();
        // Someone with an account hits the same wall as a new visitor, and lost
        // their chosen automation the same way.
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
      const { error } = await signInWithOtp(email);
      
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

  if (!mounted) return null;

  return createPortal(
    <AuthDialogFrame
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={customMessage ? 'Sign in required' : 'Welcome back'}
      title="Return to the work already in motion."
      description={customMessage || 'Sign in with your email. We will send a secure one-time code—no password to remember.'}
      labelledBy="signin-dialog-title"
      compact
    >
            {!otpSent ? (
              <form className="space-y-6" onSubmit={handleSendOtp}>
                <div>
                  <label htmlFor="dialog-email" className="mb-2 block text-xs font-black uppercase tracking-[0.09em] text-[#4e5568]">
                    Email address
                  </label>
                  <input
                    id="dialog-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    className="auth-landing-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="auth-landing-submit"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending code…
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">Continue with email <ArrowRight className="h-4 w-4" /></span>
                  )}
                </button>
                <p className="text-center text-[11px] font-semibold leading-5 text-[#9298a7]">We use a one-time code to keep access simple and secure.</p>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleVerifyOtp}>
                <div className="rounded-[18px] border border-[#6f4bc4]/10 bg-[#f3effb] px-4 py-3 text-sm text-[#6d6580]">
                  We sent a verification code to <span className="font-black text-[#3e3459]">{email}</span>
                </div>
                
                <div>
                  <label htmlFor="dialog-otp" className="mb-2 block text-xs font-black uppercase tracking-[0.09em] text-[#4e5568]">
                    Verification Code
                  </label>
                  <input
                    id="dialog-otp"
                    name="otpCode"
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
                    'Verify & Sign In'
                  )}
                </button>
                
                <div className="text-center space-y-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-sm font-black text-[#7041d6] transition-colors hover:text-[#4e2aa7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                  
                  <div>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs font-bold text-[#8b91a0] transition-colors hover:text-[#4e5568]"
                    >
                      Change email
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-8 border-t border-[#25204f]/8 pt-6 text-center">
              <p className="text-sm font-medium text-[#777e90]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className="font-black text-[#7041d6] transition-colors hover:text-[#4e2aa7]"
                >
                  Sign up
                </button>
              </p>
            </div>
    </AuthDialogFrame>,
    document.body
  );
}

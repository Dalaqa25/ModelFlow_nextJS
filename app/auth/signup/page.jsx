'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';
import SignupForm from '@/app/components/auth/signup/SignupForm';
import OtpVerificationForm from '@/app/components/auth/signup/OtpVerificationForm';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { signUpWithOtp, verifyOtp } = useAuth();
  const router = useRouter();

  // Handle OTP sent callback
  const handleOtpSent = (userEmail, userUsername) => {
    setEmail(userEmail);
    setUsername(userUsername);
    setOtpSent(true);
  };

  // Handle successful verification
  const handleVerificationSuccess = () => {
    router.push('/dashboard');
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

  // Handle changing details (go back to signup form)
  const handleChangeDetails = () => {
    setOtpSent(false);
    setResendCooldown(0);
  };

  return (
    <UnifiedBackground variant="auth" className="pt-10">
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">          
          <UnifiedCard variant="solid" className="mt-8">
            {!otpSent ? (
              // Step 1: Signup form
              <SignupForm
                onOtpSent={handleOtpSent}
                signUpWithOtp={signUpWithOtp}
                startResendCooldown={startResendCooldown}
              />
            ) : (
              // Step 2: OTP verification
              <OtpVerificationForm
                email={email}
                username={username}
                verifyOtp={verifyOtp}
                signUpWithOtp={signUpWithOtp}
                resendCooldown={resendCooldown}
                startResendCooldown={startResendCooldown}
                onChangeDetails={handleChangeDetails}
                onVerificationSuccess={handleVerificationSuccess}
              />
            )}
              
            <div className="text-center mt-4">
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
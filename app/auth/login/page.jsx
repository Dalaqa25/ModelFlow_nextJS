'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/supabase-auth-context';
import { useRouter } from 'next/navigation';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import UnifiedCard from '@/app/components/shared/UnifiedCard';
import LoginHeader from '@/app/components/auth/login/LoginHeader';
import LoginForm from '@/app/components/auth/login/LoginForm';
import LoginOtpVerificationForm from '@/app/components/auth/login/LoginOtpVerificationForm';
import LoginFooter from '@/app/components/auth/login/LoginFooter';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { signInWithOtp, verifyOtp } = useAuth();
  const router = useRouter();

  // Handle OTP sent callback
  const handleOtpSent = (userEmail) => {
    setEmail(userEmail);
    setOtpSent(true);
  };

  // Handle successful verification
  const handleVerificationSuccess = () => {
    router.push('/main');
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

  // Handle changing email (go back to login form)
  const handleChangeEmail = () => {
    setOtpSent(false);
    setResendCooldown(0);
  };


  return (
    <AdaptiveBackground variant="landing" showParticles={true} className="pt-8">
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full space-y-8">
          <LoginHeader />
          
          <UnifiedCard variant="solid" className="mt-5">
            {!otpSent ? (
              // Step 1: Email input
              <LoginForm
                onOtpSent={handleOtpSent}
                signInWithOtp={signInWithOtp}
                startResendCooldown={startResendCooldown}
              />
            ) : (
              // Step 2: OTP verification
              <LoginOtpVerificationForm
                email={email}
                verifyOtp={verifyOtp}
                signInWithOtp={signInWithOtp}
                resendCooldown={resendCooldown}
                startResendCooldown={startResendCooldown}
                onChangeEmail={handleChangeEmail}
                onVerificationSuccess={handleVerificationSuccess}
              />
            )}
              
            <LoginFooter />
          </UnifiedCard>
        </div>
      </div>
    </AdaptiveBackground>
  );
} 
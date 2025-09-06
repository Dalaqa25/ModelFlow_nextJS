'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function LoginOtpVerificationForm({ 
  email, 
  verifyOtp, 
  signInWithOtp, 
  resendCooldown, 
  startResendCooldown,
  onChangeEmail,
  onVerificationSuccess 
}) {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

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
        toast.success('Logged in successfully!');
        if (onVerificationSuccess) {
          onVerificationSuccess();
        }
      }
    } catch (error) {
      console.error('Verify OTP exception:', error);
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
      const { data, error } = await signInWithOtp(email);
      
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
            'Verify & Sign In'
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
            onClick={onChangeEmail}
            className="text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200"
          >
            Change email
          </button>
        </div>
      </div>
    </form>
  );
}
'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function LoginForm({ onOtpSent, signInWithOtp, startResendCooldown }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signInWithOtp(email);
      
      if (error) {
        console.error('Send OTP error:', error);
        toast.error(error.message);
      } else {
        toast.success('OTP sent to your email!');
        onOtpSent(email);
        startResendCooldown();
      }
    } catch (error) {
      console.error('Send OTP exception:', error);
      toast.error('An error occurred while sending OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSendOtp}>
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
      </div>

      <div>
        <button
          type="submit"
          disabled={loading || !email}
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
  );
}
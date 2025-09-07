'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { validateEmail, validateUsername } from '@/lib/validation-utils';
import UsernameInput from './UsernameInput';
import EmailInput from './EmailInput';

export default function SignupForm({ 
  onOtpSent, 
  signUpWithOtp, 
  startResendCooldown 
}) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Real-time validation
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
    setLoading(true);

    // Client-side validation
    const emailValidation = validateEmail(email);
    const usernameValidation = validateUsername(username);
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
        name: username,
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
        onOtpSent(email, username);
        startResendCooldown();
      }
    } catch (error) {
      toast.error('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const hasValidationErrors = Object.values(validationErrors).some(errors => errors.length > 0);
  const isFormValid = email && username && usernameAvailable !== false && !hasValidationErrors;

  return (
    <form className="space-y-4 sm:space-y-6" onSubmit={handleSendOtp}>
      <div className="space-y-3 sm:space-y-4">
        <UsernameInput
          value={username}
          onChange={(value) => {
            setUsername(value);
            validateField('username', value);
          }}
          validationErrors={validationErrors.username}
          usernameAvailable={usernameAvailable}
          setUsernameAvailable={setUsernameAvailable}
        />
        
        <EmailInput
          value={email}
          onChange={(value) => {
            setEmail(value);
            validateField('email', value);
          }}
          validationErrors={validationErrors.email}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base touch-manipulation"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
              <span className="text-sm sm:text-base">Sending OTP...</span>
            </div>
          ) : (
            'Send OTP Code'
          )}
        </button>
      </div>
    </form>
  );
}
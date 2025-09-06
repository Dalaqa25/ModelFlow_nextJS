/**
 * Validation utilities for authentication and user data
 * Note: Password validation removed for OTP-based authentication
 */

// Username validation rules (using name field as username)
export const USERNAME_RULES = {
  minLength: 5,
  maxLength: 20,
  allowSpecialChars: true,
  allowNumbers: true,
  noEmojis: true,
  noSpecialCharStart: true,
};

// Password validation removed - not needed for OTP authentication

/**
 * Validates username format (using name field as username)
 * @param {string} username - Username to validate
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export function validateUsername(username) {
  const errors = [];

  if (!username) {
    errors.push('Username is required');
    return { isValid: false, errors };
  }

  if (username.length < USERNAME_RULES.minLength) {
    errors.push(`Username must be at least ${USERNAME_RULES.minLength} characters long`);
  }

  if (username.length > USERNAME_RULES.maxLength) {
    errors.push(`Username must be no more than ${USERNAME_RULES.maxLength} characters long`);
  }

  // Check for emojis
  if (USERNAME_RULES.noEmojis && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(username)) {
    errors.push('Username cannot contain emojis');
  }

  // Check if starts with special character
  if (USERNAME_RULES.noSpecialCharStart && /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(username)) {
    errors.push('Username cannot start with a special character');
  }

  // Check for invalid characters (allow letters, numbers, and some special chars)
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/? ]+$/.test(username)) {
    errors.push('Username contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export function validateEmail(email) {
  const errors = [];

  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates signup form data (email and username only)
 * @param {object} formData - { email, username }
 * @returns {object} - { isValid: boolean, errors: object }
 */
export function validateSignupForm(formData) {
  const { email, username } = formData;
  
  const emailValidation = validateEmail(email);
  const usernameValidation = validateUsername(username);

  const allErrors = {
    email: emailValidation.errors,
    username: usernameValidation.errors,
  };

  const isValid = emailValidation.isValid && usernameValidation.isValid;

  return {
    isValid,
    errors: allErrors,
  };
}

// Password strength function removed - not needed for OTP authentication

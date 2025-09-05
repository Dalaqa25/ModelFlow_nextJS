/**
 * Validation utilities for authentication and user data
 */

// Password validation rules
export const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
};

// Username validation rules (using name field as username)
export const USERNAME_RULES = {
  minLength: 5,
  maxLength: 20,
  allowSpecialChars: true,
  allowNumbers: true,
  noEmojis: true,
  noSpecialCharStart: true,
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export function validatePassword(password) {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters long`);
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_RULES.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_RULES.requireSymbol && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special symbol');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

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
 * Validates all signup form data
 * @param {object} formData - { email, password, username }
 * @returns {object} - { isValid: boolean, errors: object }
 */
export function validateSignupForm(formData) {
  const { email, password, username } = formData;
  
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const usernameValidation = validateUsername(username);

  const allErrors = {
    email: emailValidation.errors,
    password: passwordValidation.errors,
    username: usernameValidation.errors,
  };

  const isValid = emailValidation.isValid && passwordValidation.isValid && usernameValidation.isValid;

  return {
    isValid,
    errors: allErrors,
  };
}

/**
 * Gets password strength score and feedback
 * @param {string} password - Password to analyze
 * @returns {object} - { score: number, feedback: string, color: string }
 */
export function getPasswordStrength(password) {
  if (!password) {
    return { score: 0, feedback: 'Enter a password', color: 'text-gray-400' };
  }

  let score = 0;
  const feedback = [];

  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('One uppercase letter');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('One lowercase letter');

  if (/\d/.test(password)) score += 1;
  else feedback.push('One number');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('One special character');

  let color = 'text-red-400';
  let strengthText = 'Very Weak';

  if (score >= 4) {
    color = 'text-green-400';
    strengthText = 'Strong';
  } else if (score >= 3) {
    color = 'text-yellow-400';
    strengthText = 'Medium';
  } else if (score >= 2) {
    color = 'text-orange-400';
    strengthText = 'Weak';
  }

  return {
    score,
    feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : 'Strong password!',
    color,
    strengthText,
  };
}

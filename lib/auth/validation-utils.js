/**
 * Validation utilities for authentication and user data
 */

export const USERNAME_RULES = {
  minLength: 5,
  maxLength: 20,
  allowSpecialChars: true,
  allowNumbers: true,
  noEmojis: true,
  noSpecialCharStart: true,
};

/**
 * Validates username format
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

  if (USERNAME_RULES.noEmojis && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(username)) {
    errors.push('Username cannot contain emojis');
  }

  if (USERNAME_RULES.noSpecialCharStart && /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(username)) {
    errors.push('Username cannot start with a special character');
  }

  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/? ]+$/.test(username)) {
    errors.push('Username contains invalid characters');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates email format
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

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates signup form data
 */
export function validateSignupForm(formData) {
  const { email, username } = formData;
  
  const emailValidation = validateEmail(email);
  const usernameValidation = validateUsername(username);

  return {
    isValid: emailValidation.isValid && usernameValidation.isValid,
    errors: {
      email: emailValidation.errors,
      username: usernameValidation.errors,
    },
  };
}

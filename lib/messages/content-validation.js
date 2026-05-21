const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

export function containsContactInfo(text) {
  if (!text || typeof text !== 'string') return false;
  return EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text);
}

export function contactInfoErrorMessage() {
  return 'Please do not share email or phone numbers. Use Message to discuss privately on ModelGrow.';
}

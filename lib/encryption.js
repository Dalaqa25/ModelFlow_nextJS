import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted string (iv:tag:data in hex)
 */
export function encrypt(text) {
    if (!text) return null;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Format: iv:tag:encryptedData (all in hex)
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 * @param {string} encryptedText - Encrypted string (iv:tag:data in hex)
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
    if (!encryptedText) return null;
    
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

/**
 * Encrypt all values in a key-value object
 * @param {Object} keys - Object with key names and values
 * @returns {Object} - Object with encrypted values
 */
export function encryptKeys(keys) {
    if (!keys || typeof keys !== 'object') return {};
    
    const encrypted = {};
    for (const [name, value] of Object.entries(keys)) {
        if (value) {
            encrypted[name] = encrypt(value);
        }
    }
    return encrypted;
}

/**
 * Decrypt all values in a key-value object
 * @param {Object} encryptedKeys - Object with encrypted values
 * @returns {Object} - Object with decrypted values
 */
export function decryptKeys(encryptedKeys) {
    if (!encryptedKeys || typeof encryptedKeys !== 'object') return {};
    
    const decrypted = {};
    for (const [name, value] of Object.entries(encryptedKeys)) {
        if (value) {
            decrypted[name] = decrypt(value);
        }
    }
    return decrypted;
}

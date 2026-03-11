import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-identity-key-change-me';

/**
 * Encrypts sensitive data (NIN/BVN) for temporary storage
 * @param {string} data 
 * @returns {string}
 */
export const encryptIdentity = (data) => {
    if (!data) return null;
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

/**
 * Decrypts sensitive data for PDF generation
 * @param {string} ciphertext 
 * @returns {string}
 */
export const decryptIdentity = (ciphertext) => {
    if (!ciphertext) return null;
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Masks sensitive information for logging
 * @param {string} data 
 * @returns {string}
 */
export const maskData = (data, visibleCount = 4) => {
    if (!data) return '';
    const maskedLength = data.length - visibleCount;
    if (maskedLength <= 0) return data;
    return '*'.repeat(maskedLength) + data.slice(-visibleCount);
};

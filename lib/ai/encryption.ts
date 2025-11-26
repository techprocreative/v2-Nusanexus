import crypto from 'crypto';

// Ensure ENCRYPTION_KEY is set in environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
}

if (ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters)');
}

const ALGORITHM = 'aes-256-gcm';
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypt a string (e.g., API key)
 * Returns format: iv:authTag:encrypted
 */
export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted string
 * Expects format: iv:authTag:encrypted
 */
export function decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Test if encryption/decryption works correctly
 */
export function testEncryption(): boolean {
    try {
        const testString = 'test-api-key-12345';
        const encrypted = encrypt(testString);
        const decrypted = decrypt(encrypted);
        return testString === decrypted;
    } catch (error) {
        console.error('Encryption test failed:', error);
        return false;
    }
}

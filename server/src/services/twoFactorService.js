import crypto from 'crypto';
import { generateSecret, generateURI, verifySync, generateSync } from 'otplib';
import QRCode from 'qrcode';

/**
 * ============================================================================
 * NEXORA Two-Factor Authentication (Google Authenticator / TOTP) Service
 * Implements RFC 6238 TOTP with AES-256-GCM Encryption & Anti-Replay
 * ============================================================================
 */

// Derive deterministic 32-byte key for AES-256-GCM authenticated encryption
const ENCRYPTION_SECRET = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET || 'nexora_totp_vault_secure_key_2026';
const VAULT_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

/**
 * Encrypt Base32 TOTP secret using AES-256-GCM
 */
export const encryptSecret = (plainSecret) => {
  if (!plainSecret) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', VAULT_KEY, iv);
  let encrypted = cipher.update(plainSecret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt AES-256-GCM encrypted TOTP secret
 */
export const decryptSecret = (encryptedPayload) => {
  if (!encryptedPayload) return null;
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format');
  }
  const [ivHex, authTagHex, encrypted] = parts;
  if (
    !/^[0-9a-fA-F]+$/.test(ivHex) ||
    !/^[0-9a-fA-F]+$/.test(authTagHex) ||
    !/^[0-9a-fA-F]+$/.test(encrypted) ||
    encrypted.length % 2 !== 0
  ) {
    throw new Error('Invalid hex encoding in encrypted secret payload');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', VAULT_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Generate a new unique Base32 TOTP secret and Google Authenticator provisioning URI
 */
export const generate2FASecret = async (userEmail) => {
  const secret = generateSecret(); // 32-char Base32 RFC 3548
  const issuer = 'NEXORA';

  // Provisioning URI format for Google Authenticator:
  // otpauth://totp/NEXORA:user@email.com?secret=...&issuer=NEXORA
  const otpauthUrl = generateURI({
    secret,
    label: userEmail,
    issuer,
  });

  // Generate high-resolution Data URL QR code
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#0F382C', // NEXORA Forest Green
      light: '#FFFFFF',
    },
  });

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
    formattedKey: secret.match(/.{1,4}/g)?.join(' ') || secret,
  };
};

/**
 * Generate a 6-digit TOTP code for a given secret (used in tests and verification)
 */
export const generateTOTPCode = (plainSecret, epoch = undefined) => {
  return generateSync({
    secret: plainSecret,
    ...(epoch !== undefined ? { epoch } : {}),
  });
};

/**
 * Verify a 6-digit TOTP code against an encrypted secret with anti-replay check
 * Supports +/- 30-second clock-drift tolerance (epochTolerance: 30)
 */
export const verifyTOTPCode = (inputCode, encryptedSecret, lastUsedToken = null) => {
  if (!inputCode || !encryptedSecret) return false;

  const cleanCode = inputCode.toString().trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanCode)) return false;

  // Anti-replay prevention: Reject if the same token was already consumed recently
  if (lastUsedToken && lastUsedToken === cleanCode) {
    console.warn('[2FA/Security] Replay attack prevented. Token was already used.');
    return false;
  }

  try {
    const plainSecret = decryptSecret(encryptedSecret);
    const result = verifySync({
      token: cleanCode,
      secret: plainSecret,
      epochTolerance: 30, // +/- 1 30-second interval clock drift
    });
    return !!result?.valid;
  } catch (err) {
    console.error('[2FA/Verify] Failed to decrypt or verify TOTP secret:', err.message);
    return false;
  }
};

/**
 * Generate 8 single-use 8-character backup recovery codes
 */
export const generateRecoveryCodes = () => {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < 8; i++) {
    const part1 = crypto.randomBytes(2).toString('hex');
    const part2 = crypto.randomBytes(2).toString('hex');
    const code = `${part1}-${part2}`; // e.g. "a1b2-c3d4"
    plainCodes.push(code);

    const codeHash = crypto.createHash('sha256').update(code.toLowerCase().trim()).digest('hex');
    hashedCodes.push({
      codeHash,
      used: false,
      usedAt: null,
    });
  }

  return { plainCodes, hashedCodes };
};

/**
 * Verify a backup recovery code against stored hashes
 */
export const verifyRecoveryCode = (inputCode, recoveryCodes = []) => {
  if (!inputCode || !Array.isArray(recoveryCodes)) return -1;

  const cleanInput = inputCode.toString().trim().toLowerCase();
  const inputHash = crypto.createHash('sha256').update(cleanInput).digest('hex');

  const index = recoveryCodes.findIndex((rc) => !rc.used && rc.codeHash === inputHash);
  return index; // Returns index of matched unused code, or -1
};

export default {
  encryptSecret,
  decryptSecret,
  generate2FASecret,
  generateTOTPCode,
  verifyTOTPCode,
  generateRecoveryCodes,
  verifyRecoveryCode,
};

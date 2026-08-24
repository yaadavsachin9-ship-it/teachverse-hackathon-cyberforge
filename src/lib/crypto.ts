import { QRTokenPayload, VerificationResult, UserProfile, GateLocation } from './types';

// Default secret key used for signing QR tokens in the demo/organization context
const SIGNING_SECRET = 'SECUREID_ORG_HMAC_MASTER_KEY_2026';

/**
 * Generates a SHA-256 HMAC signature in hex format using Web Crypto API with fallback
 */
export async function generateHmacSignature(data: string, secret: string = SIGNING_SECRET): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(data);

      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signature));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    }
  } catch (e) {
    console.warn('SubtleCrypto unavailable, using fallback signature', e);
  }

  // Pure JS DJB2/FNV-1a hybrid fast HMAC fallback for universal compatibility
  let hash1 = 5381;
  let hash2 = 0x811c9dc5;
  const combined = `${secret}:${data}:${secret}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = (hash2 ^ char) * 16777619;
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((hash1 ^ hash2) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((hash1 + hash2) >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}${part3}${part4}`;
}

/**
 * Creates a signed QR token string representing a user's digital identity
 */
export async function createSignedQRToken(
  user: UserProfile,
  rotationSeconds: number = 60
): Promise<{ token: string; payload: QRTokenPayload; expiresAtFormatted: string }> {
  const nowSec = Math.floor(Date.now() / 1000);
  // If rotationSeconds > 0, token expires after rotation window; otherwise lasts 24h
  const validitySeconds = rotationSeconds > 0 ? rotationSeconds : 86400;
  const expSec = nowSec + validitySeconds;
  const nonce = Math.random().toString(36).substring(2, 10);

  const unsignedData = `v1:${user.id}:${user.orgId}:${user.memberNumber}:${nowSec}:${expSec}:${nonce}`;
  const sig = await generateHmacSignature(unsignedData);

  const payload: QRTokenPayload = {
    v: 1,
    uid: user.id,
    oid: user.orgId,
    num: user.memberNumber,
    iat: nowSec,
    exp: expSec,
    nonce,
    sig,
  };

  // Base64-encode JSON payload to keep QR compact and tamper-evident
  const jsonStr = JSON.stringify(payload);
  const token = typeof window !== 'undefined' 
    ? btoa(unescape(encodeURIComponent(jsonStr)))
    : Buffer.from(jsonStr).toString('base64');

  const expiresDate = new Date(expSec * 1000);
  const expiresAtFormatted = expiresDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return { token, payload, expiresAtFormatted };
}

/**
 * Parses and decodes a raw token string or QR payload
 */
export function parseQRToken(rawToken: string): QRTokenPayload | null {
  try {
    let decoded = '';
    // Check if it's already JSON or Base64
    if (rawToken.trim().startsWith('{')) {
      decoded = rawToken.trim();
    } else {
      decoded = typeof window !== 'undefined'
        ? decodeURIComponent(escape(atob(rawToken.trim())))
        : Buffer.from(rawToken.trim(), 'base64').toString('utf8');
    }
    const payload = JSON.parse(decoded) as QRTokenPayload;
    if (payload.uid && payload.sig && payload.exp) {
      return payload;
    }
  } catch (e) {
    console.error('Failed to parse QR token:', e);
  }
  return null;
}

/**
 * Cryptographically verifies a QR token against user registry and gate security policies
 */
export async function verifyQRToken(
  tokenString: string,
  getUserById: (id: string) => UserProfile | undefined,
  currentGate?: GateLocation
): Promise<VerificationResult> {
  const timestamp = new Date().toISOString();
  const payload = parseQRToken(tokenString);

  if (!payload) {
    return {
      result: 'TAMPERED',
      isValid: false,
      reason: 'Invalid or malformed QR token payload. Code could not be decoded.',
      timestamp,
    };
  }

  // 1. Verify HMAC Signature
  const unsignedData = `v1:${payload.uid}:${payload.oid}:${payload.num}:${payload.iat}:${payload.exp}:${payload.nonce}`;
  const expectedSig = await generateHmacSignature(unsignedData);

  if (payload.sig !== expectedSig) {
    return {
      result: 'TAMPERED',
      isValid: false,
      reason: 'Cryptographic signature mismatch. Digital identity signature has been forged or altered.',
      timestamp,
    };
  }

  // 2. Fetch User Profile
  const profile = getUserById(payload.uid);
  if (!profile) {
    return {
      result: 'NOT_FOUND',
      isValid: false,
      reason: `Member profile ID "${payload.uid}" was not found in the organization directory.`,
      timestamp,
    };
  }

  // 3. Check Token Time Expiration (anti-replay window)
  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec > payload.exp) {
    return {
      result: 'EXPIRED',
      isValid: false,
      reason: `QR token expired ${Math.floor((nowSec - payload.exp))} seconds ago. Request fresh QR code from member's app.`,
      profile,
      timestamp,
    };
  }

  // 4. Check Member Record Validity Date
  const validUntilDate = new Date(profile.validUntil);
  if (new Date() > validUntilDate || profile.status === 'expired') {
    return {
      result: 'EXPIRED',
      isValid: false,
      reason: `Membership validity ended on ${profile.validUntil}. Profile is expired.`,
      profile,
      timestamp,
    };
  }

  // 5. Check Revocation Status
  if (profile.status === 'revoked') {
    return {
      result: 'REVOKED',
      isValid: false,
      reason: 'This identity credential has been REVOKED by the administrator. Access is denied.',
      profile,
      timestamp,
    };
  }

  if (profile.status === 'pending') {
    return {
      result: 'NOT_FOUND',
      isValid: false,
      reason: 'Membership is pending administrator approval. ID not yet active.',
      profile,
      timestamp,
    };
  }

  // 6. Check High-Security Gate OTP Requirement
  if (currentGate?.highSecurity) {
    return {
      result: 'OTP_REQUIRED',
      isValid: false,
      reason: `Gate "${currentGate.name}" is designated High Security. Secondary 6-digit OTP verification is required.`,
      profile,
      timestamp,
      otpRequired: true,
    };
  }

  // 7. Verified PASS
  return {
    result: 'VALID',
    isValid: true,
    reason: `Verified valid digital identity for ${profile.fullName} (${profile.memberNumber}).`,
    profile,
    timestamp,
  };
}

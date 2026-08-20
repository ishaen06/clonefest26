/**
 * CloakVault Client-Side Zero-Knowledge Cryptographic Core
 * Built on native WebCrypto API (AES-256-GCM, PBKDF2-SHA256, SHA-256)
 */

// Helper to convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert Uint8Array to Hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to convert Hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Generate a high-entropy 256-bit AES-GCM raw key (Hex format)
export function generateRandomKeyHex(): string {
  const keyBytes = new Uint8Array(32); // 256 bits
  window.crypto.getRandomValues(keyBytes);
  return bytesToHex(keyBytes);
}

// Compute SHA-256 cryptographic checksum (fingerprint) of a string or buffer
export async function computeSha256Checksum(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = typeof data === 'string' ? encoder.encode(data) : data;
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer as unknown as BufferSource);
  return bytesToHex(new Uint8Array(hashBuffer));
}

// Derive a 256-bit AES-GCM CryptoKey from password + salt via PBKDF2 (600,000 iterations)
export async function deriveKeyFromPassword(
  password: string,
  saltBytes: Uint8Array,
  iterations = 600000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password) as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Import a raw hex key into a CryptoKey for AES-GCM
export async function importRawKey(keyHex: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(keyHex);
  return window.crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Base64
  salt: string; // Base64 (if password used)
  iterations: number;
}

/**
 * Encrypt arbitrary plaintext string or JSON with a 256-bit key (and optional password layer)
 */
export async function encryptPayload(
  plaintext: string,
  rawKeyHex: string,
  password?: string
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // 96-bit (12-byte) initialization vector for AES-GCM
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  let cryptoKey: CryptoKey;
  let salt = '';
  const iterations = 600000;

  if (password && password.trim().length > 0) {
    // Layer password with rawKey
    const saltBytes = new Uint8Array(16);
    window.crypto.getRandomValues(saltBytes);
    salt = arrayBufferToBase64(saltBytes);

    // Combine rawKey and password for two-factor cryptographic derivation
    const combinedSecret = `${rawKeyHex}:${password}`;
    cryptoKey = await deriveKeyFromPassword(combinedSecret, saltBytes, iterations);
  } else {
    cryptoKey = await importRawKey(rawKeyHex);
  }

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    cryptoKey,
    data as unknown as BufferSource
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    salt,
    iterations,
  };
}

/**
 * Decrypt payload with raw key (and optional password)
 */
export async function decryptPayload(
  payload: { ciphertext: string; iv: string; salt?: string; iterations?: number },
  rawKeyHex: string,
  password?: string
): Promise<string> {
  const encryptedBytes = base64ToArrayBuffer(payload.ciphertext);
  const ivBytes = base64ToArrayBuffer(payload.iv);

  let cryptoKey: CryptoKey;
  if (payload.salt && payload.salt.length > 0) {
    if (!password) {
      throw new Error('Password required for decryption.');
    }
    const saltBytes = base64ToArrayBuffer(payload.salt);
    const iterations = payload.iterations || 600000;
    const combinedSecret = `${rawKeyHex}:${password}`;
    cryptoKey = await deriveKeyFromPassword(combinedSecret, saltBytes, iterations);
  } else {
    cryptoKey = await importRawKey(rawKeyHex);
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
    },
    cryptoKey,
    encryptedBytes as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Encrypt a binary file to a client-side protected package
 */
export async function encryptFile(
  file: File,
  rawKeyHex: string,
  password?: string
): Promise<{
  name: string;
  size: number;
  type: string;
  encryptedBase64: string;
  iv: string;
  salt: string;
  checksum: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);
  const checksum = await computeSha256Checksum(fileBytes);

  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  let cryptoKey: CryptoKey;
  let salt = '';
  const iterations = 600000;

  if (password && password.trim().length > 0) {
    const saltBytes = new Uint8Array(16);
    window.crypto.getRandomValues(saltBytes);
    salt = arrayBufferToBase64(saltBytes);
    const combinedSecret = `${rawKeyHex}:${password}`;
    cryptoKey = await deriveKeyFromPassword(combinedSecret, saltBytes, iterations);
  } else {
    cryptoKey = await importRawKey(rawKeyHex);
  }

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    cryptoKey,
    fileBytes as unknown as BufferSource
  );

  return {
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    encryptedBase64: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    salt,
    checksum,
  };
}

/**
 * Decrypt an encrypted file package into a Blob URL
 */
export async function decryptFile(
  fileData: {
    name: string;
    type: string;
    encryptedBase64: string;
    iv: string;
    salt?: string;
  },
  rawKeyHex: string,
  password?: string
): Promise<{ blobUrl: string; arrayBuffer: ArrayBuffer; checksum: string }> {
  const encryptedBytes = base64ToArrayBuffer(fileData.encryptedBase64);
  const ivBytes = base64ToArrayBuffer(fileData.iv);

  let cryptoKey: CryptoKey;
  if (fileData.salt && fileData.salt.length > 0) {
    if (!password) {
      throw new Error('Password required for file decryption.');
    }
    const saltBytes = base64ToArrayBuffer(fileData.salt);
    const combinedSecret = `${rawKeyHex}:${password}`;
    cryptoKey = await deriveKeyFromPassword(combinedSecret, saltBytes, 600000);
  } else {
    cryptoKey = await importRawKey(rawKeyHex);
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
    },
    cryptoKey,
    encryptedBytes as unknown as BufferSource
  );

  const checksum = await computeSha256Checksum(new Uint8Array(decryptedBuffer));
  const blob = new Blob([decryptedBuffer], { type: fileData.type });
  const blobUrl = URL.createObjectURL(blob);

  return { blobUrl, arrayBuffer: decryptedBuffer, checksum };
}

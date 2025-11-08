// crypto.js - Web Crypto API utilities for hybrid encryption

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate RSA-OAEP key pair for encryption/decryption
 */
export async function generateEncryptionKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true, // extractable
    ["wrapKey", "unwrapKey"]
  );
}

/**
 * Generate RSA-PSS key pair for signing/verification
 */
export async function generateSigningKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true, // extractable
    ["sign", "verify"]
  );
}

/**
 * Export public key to JWK format
 */
export async function exportPublicKeyJWK(publicKey) {
  return await window.crypto.subtle.exportKey("jwk", publicKey);
}

/**
 * Export private key to JWK format
 */
export async function exportPrivateKeyJWK(privateKey) {
  return await window.crypto.subtle.exportKey("jwk", privateKey);
}

/**
 * Import public key from JWK
 */
export async function importPublicKeyJWK(jwk, algorithm) {
  const algName = algorithm === 'encryption' ? 'RSA-OAEP' : 'RSA-PSS';
  const keyUsages = algorithm === 'encryption' ? ['wrapKey'] : ['verify'];
  
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: algName,
      hash: "SHA-256"
    },
    true,
    keyUsages
  );
}

/**
 * Import private key from JWK
 */
export async function importPrivateKeyJWK(jwk, algorithm) {
  const algName = algorithm === 'encryption' ? 'RSA-OAEP' : 'RSA-PSS';
  const keyUsages = algorithm === 'encryption' ? ['unwrapKey'] : ['sign'];
  
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: algName,
      hash: "SHA-256"
    },
    true,
    keyUsages
  );
}

/**
 * Generate ephemeral AES-256-GCM key for data encryption
 */
export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt data with AES-GCM
 * Returns { ciphertext, iv }
 */
export async function encryptData(data, aesKey) {
  // Generate random IV (96 bits for GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128 // 128-bit authentication tag
    },
    aesKey,
    data
  );
  
  return {
    ciphertext,
    iv
  };
}

/**
 * Decrypt data with AES-GCM
 */
export async function decryptData(ciphertext, aesKey, iv) {
  return await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128
    },
    aesKey,
    ciphertext
  );
}

/**
 * Wrap AES key with RSA-OAEP public key
 */
export async function wrapKey(aesKey, rsaPublicKey) {
  const wrappedKey = await window.crypto.subtle.wrapKey(
    "raw",
    aesKey,
    rsaPublicKey,
    {
      name: "RSA-OAEP"
    }
  );
  
  return wrappedKey;
}

/**
 * Unwrap AES key with RSA-OAEP private key
 */
export async function unwrapKey(wrappedKey, rsaPrivateKey) {
  return await window.crypto.subtle.unwrapKey(
    "raw",
    wrappedKey,
    rsaPrivateKey,
    {
      name: "RSA-OAEP"
    },
    {
      name: "AES-GCM",
      length: 256
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Sign data with RSA-PSS private key
 */
export async function signData(data, rsaPrivateKey) {
  return await window.crypto.subtle.sign(
    {
      name: "RSA-PSS",
      saltLength: 32
    },
    rsaPrivateKey,
    data
  );
}

/**
 * Verify signature with RSA-PSS public key
 */
export async function verifySignature(signature, data, rsaPublicKey) {
  return await window.crypto.subtle.verify(
    {
      name: "RSA-PSS",
      saltLength: 32
    },
    rsaPublicKey,
    signature,
    data
  );
}

/**
 * Read file as ArrayBuffer
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Download blob as file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Store private key in IndexedDB (encrypted with user password)
 * This is a simplified version - in production, use a proper key derivation function
 */
export async function storePrivateKeySecurely(privateKeyJWK, password, keyId) {
  // In production, use PBKDF2 to derive encryption key from password
  // For demo purposes, we'll just store in localStorage with a warning
  
  console.warn('⚠️ SECURITY WARNING: Private key storage should use proper encryption with PBKDF2');
  
  const keyData = {
    keyId,
    privateKey: privateKeyJWK,
    timestamp: Date.now()
  };
  
  // Store in localStorage (NOT secure for production!)
  localStorage.setItem(`privateKey_${keyId}`, JSON.stringify(keyData));
  
  return keyId;
}

/**
 * Retrieve private key from storage
 */
export function retrievePrivateKeySecurely(keyId) {
  const stored = localStorage.getItem(`privateKey_${keyId}`);
  if (!stored) return null;
  
  const keyData = JSON.parse(stored);
  return keyData.privateKey;
}

/**
 * Clear all stored private keys
 */
export function clearStoredPrivateKeys() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('privateKey_')) {
      localStorage.removeItem(key);
    }
  });
}
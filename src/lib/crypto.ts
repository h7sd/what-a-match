/**
 * Client-side AES-256-GCM encryption for file uploads
 * Files are encrypted before upload and can only be decrypted by the website
 */

// Derive encryption key from user-specific data + server secret
export async function deriveEncryptionKey(keyMaterial: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  
  // Import as raw key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES-256-GCM key using PBKDF2
  const salt = encoder.encode('uservault-file-encryption-v1');
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a file using AES-256-GCM
export async function encryptFile(file: File, key: CryptoKey): Promise<{ encryptedBlob: Blob; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const fileBuffer = await file.arrayBuffer();
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );
  
  // Prepend IV to encrypted data for storage
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  
  return {
    encryptedBlob: new Blob([combined], { type: 'application/octet-stream' }),
    iv,
  };
}

// Decrypt file data
export async function decryptFile(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  originalMimeType: string
): Promise<Blob> {
  const data = new Uint8Array(encryptedData);
  
  // Extract IV (first 12 bytes)
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  return new Blob([decryptedBuffer], { type: originalMimeType });
}

// Decrypt and create object URL for display
export async function decryptToObjectUrl(
  encryptedUrl: string,
  key: CryptoKey,
  mimeType: string
): Promise<string> {
  const response = await fetch(encryptedUrl);
  const encryptedData = await response.arrayBuffer();
  const decryptedBlob = await decryptFile(encryptedData, key, mimeType);
  return URL.createObjectURL(decryptedBlob);
}

// Check if a URL points to an encrypted file (by checking metadata)
export function isEncryptedFile(url: string): boolean {
  return url.includes('/encrypted/') || url.includes('.enc');
}

// Encode metadata for encrypted files
export function encodeFileMetadata(originalName: string, mimeType: string): string {
  const metadata = { n: originalName, t: mimeType, v: 1 };
  return btoa(JSON.stringify(metadata));
}

// Decode file metadata
export function decodeFileMetadata(encoded: string): { name: string; type: string } | null {
  try {
    const metadata = JSON.parse(atob(encoded));
    return { name: metadata.n, type: metadata.t };
  } catch {
    return null;
  }
}

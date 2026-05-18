// AES-256-GCM encryption helpers for protecting personal connection data at rest.
// WHY: Personal info (email, LinkedIn, GitHub) submitted by connections must be
//      encrypted so a DB breach doesn't expose plaintext user data.
//      We use AES-256-GCM (authenticated encryption) which:
//        - Encrypts data (confidentiality)
//        - Detects tampering via auth tag (integrity)
// EFFECT: All text stored in Connection rows is unreadable without ENCRYPTION_KEY.
//         The admin dashboard decrypts on the fly via the API layer.
//
// ENCRYPTION_KEY must be exactly 64 hex characters (= 32 bytes).
// Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

// Encrypt a plaintext string.
// Returns: base64-encoded  [12-byte IV | 16-byte auth tag | ciphertext]
export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag(); // 16 bytes — detects tampering
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

// Decrypt a string produced by encrypt().
// Throws if the auth tag doesn't match (tampered or wrong key).
export function decrypt(data: string): string {
  const key = getKey();
  const buf = Buffer.from(data, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

// One-way SHA-256 hash — used to deduplicate connections by email without
// storing the plaintext. Compare hash(incoming) === stored hash.
// WHY: Normalise to lowercase+trim so "User@Example.com" === "user@example.com".
export function hash(text: string): string {
  return createHash("sha256")
    .update(text.toLowerCase().trim())
    .digest("hex");
}

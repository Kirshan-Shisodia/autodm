import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY is required");
  }

  const decoded = Buffer.from(key, "base64");

  if (decoded.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to 32 bytes");
  }

  return decoded;
}

export function encryptToken(plaintext: string): {
  encrypted: string;
  iv: string;
} {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([ciphertext, tag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptToken(encrypted: string, ivB64: string): string {
  const data = Buffer.from(encrypted, "base64");
  const ciphertext = data.subarray(0, data.length - 16);
  const tag = data.subarray(data.length - 16);
  const iv = Buffer.from(ivB64, "base64");
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

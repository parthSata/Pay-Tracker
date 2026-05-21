import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ALGORITHM = "aes-256-cbc";
// Derive a 32-byte key from the environment variable (or fallback) using SHA-256
const secret = process.env.BANK_ENCRYPTION_KEY || "default-fallback-key-should-be-changed-in-production";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(secret).digest();

/**
 * Encrypts a string using AES-256-CBC.
 * Returns the encrypted string in the format "ivHex:ciphertextHex".
 * @param {string} text Plain text to encrypt
 * @returns {string} Encrypted string
 */
export function encrypt(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("[ERROR] Encryption failed:", error);
    return text; // Return text on failure to avoid blocking execution
  }
}

/**
 * Decrypts a string that was encrypted using AES-256-CBC.
 * If the string is not in the format "ivHex:ciphertextHex" (e.g., legacy plain text),
 * it returns the string as-is.
 * @param {string} encryptedText Encrypted string in "ivHex:ciphertextHex" format
 * @returns {string} Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  
  // Format check: iv (32 hex characters) followed by a colon and the ciphertext (hex characters)
  const formatRegex = /^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/;
  if (!formatRegex.test(encryptedText)) {
    // Return as-is for legacy plain text data
    return encryptedText;
  }

  try {
    const [ivHex, ciphertextHex] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[ERROR] Decryption failed (might be a bad key or corrupted string):", error);
    return encryptedText; // Fallback to raw text to ensure application does not crash
  }
}

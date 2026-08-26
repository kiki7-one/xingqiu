import CryptoJS from "crypto-js";

const PBKDF2_ITERATIONS = 10000;
const SALT = "kiki-star-salt";

export function hashPassword(password: string): string {
  return CryptoJS.PBKDF2(password, SALT, {
    keySize: 256 / 32,
    iterations: PBKDF2_ITERATIONS,
  }).toString();
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function encrypt(plaintext: string, password: string): string {
  return CryptoJS.AES.encrypt(plaintext, password).toString();
}

export function decrypt(ciphertext: string, password: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}

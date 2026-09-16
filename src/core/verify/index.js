import { verifyArgon2 } from '../hash/argon2.js';
import { verifyBcrypt } from '../hash/bcrypt.js';
import { verifyScrypt } from '../hash/scrypt.js';
import { performance } from 'node:perf_hooks';

/**
 * Detect the cryptographic algorithm from a Modular Crypt Format hash string
 * @param {string} hashString
 * @returns {string|null}
 */
export function detectHashAlgorithm(hashString) {
  if (typeof hashString !== 'string') return null;
  const trimmed = hashString.trim();

  if (trimmed.startsWith('$argon2id$')) return 'argon2id';
  if (trimmed.startsWith('$argon2i$')) return 'argon2i';
  if (trimmed.startsWith('$argon2d$')) return 'argon2d';
  if (/^\$2[abyx]\$/.test(trimmed)) return 'bcrypt';
  if (trimmed.startsWith('$scrypt$')) return 'scrypt';

  return null;
}

/**
 * Verify a secret against a hash with full details (algorithm, execution time, match status).
 * Compatible with PHP >= 8.2 ($2y$, $argon2id$), Python (bcrypt, argon2-cffi), and Node.js.
 *
 * @param {string|Buffer} secret - Plaintext secret
 * @param {string} hashString - The formatted hash string
 * @returns {Promise<{ valid: boolean, algorithm: string, executionTimeMs: number }>}
 */
export async function verifyDetailed(secret, hashString) {
  if (!secret || !hashString || typeof hashString !== 'string') {
    return { valid: false, algorithm: 'unknown', executionTimeMs: 0 };
  }

  const trimmed = hashString.trim();
  const algo = detectHashAlgorithm(trimmed);

  if (!algo) {
    return { valid: false, algorithm: 'unknown', executionTimeMs: 0 };
  }

  const startTime = performance.now();
  let valid = false;

  switch (algo) {
    case 'argon2id':
    case 'argon2i':
    case 'argon2d':
      valid = await verifyArgon2(secret, trimmed);
      break;

    case 'bcrypt':
      valid = await verifyBcrypt(secret, trimmed);
      break;

    case 'scrypt':
      valid = await verifyScrypt(secret, trimmed);
      break;
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
  return { valid, algorithm: algo, executionTimeMs };
}

/**
 * Verify a secret against a hash string.
 *
 * @param {string|Buffer} secret - Plaintext secret
 * @param {string} hashString - The formatted hash string
 * @returns {Promise<boolean>}
 */
export async function verify(secret, hashString) {
  const result = await verifyDetailed(secret, hashString);
  return result.valid;
}

import { hash as bcryptHash, verify as bcryptVerify } from '@node-rs/bcrypt';
import { performance } from 'node:perf_hooks';

/**
 * Bcrypt hashing options
 * @typedef {Object} BcryptOptions
 * @property {number} [cost=12] Cost factor (4 - 16, default: 12)
 * @property {'2b'|'2y'} [prefix='2b'] Format prefix ('2b' for Node/Python/BSD, '2y' for PHP compatibility)
 */

/**
 * Hash a secret using Bcrypt
 * Fully compatible with PHP >= 8.2 (PASSWORD_BCRYPT) and Python bcrypt.
 *
 * @param {string|Buffer} secret - The secret text to hash
 * @param {BcryptOptions} [options={}] - Bcrypt parameters
 * @returns {Promise<{ hash: string, algorithm: string, executionTimeMs: number, parameters: object }>}
 */
export async function hashBcrypt(secret, options = {}) {
  if (secret === undefined || secret === null) {
    throw new TypeError('Secret input is required for Bcrypt hashing');
  }

  const cost = Number(options.cost ?? 12);
  if (isNaN(cost) || cost < 4 || cost > 31) {
    throw new RangeError('Bcrypt cost factor must be an integer between 4 and 31');
  }

  const prefix = (options.prefix || '2b').toLowerCase();
  if (prefix !== '2b' && prefix !== '2y') {
    throw new Error("Unsupported Bcrypt prefix. Use '2b' or '2y'.");
  }

  const startTime = performance.now();
  let hashString = await bcryptHash(secret, cost);
  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  if (prefix === '2y' && hashString.startsWith('$2b$')) {
    hashString = '$2y$' + hashString.slice(4);
  }

  return {
    hash: hashString,
    algorithm: 'bcrypt',
    executionTimeMs,
    parameters: {
      cost,
      prefix,
    },
  };
}

/**
 * Verify a secret against a Bcrypt hash string
 * Accepts $2a$, $2b$, $2y$, and $2x$ prefixes.
 *
 * @param {string|Buffer} secret - The secret text to verify
 * @param {string} hashString - The Bcrypt hash string
 * @returns {Promise<boolean>}
 */
export async function verifyBcrypt(secret, hashString) {
  if (!secret || !hashString || typeof hashString !== 'string') {
    return false;
  }

  const trimmed = hashString.trim();
  if (!/^\$2[abyx]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(trimmed)) {
    return false;
  }

  try {
    return await bcryptVerify(secret, trimmed);
  } catch {
    try {
      const normalized = trimmed.replace(/^\$2[yx]\$/, '$2b$');
      return await bcryptVerify(secret, normalized);
    } catch {
      return false;
    }
  }
}

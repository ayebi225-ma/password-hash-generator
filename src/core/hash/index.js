import { hashArgon2 } from './argon2.js';
import { hashBcrypt } from './bcrypt.js';
import { hashScrypt } from './scrypt.js';

export { hashArgon2 } from './argon2.js';
export { hashBcrypt } from './bcrypt.js';
export { hashScrypt } from './scrypt.js';

/**
 * Unified hashing function supporting Argon2id, Argon2i, Argon2d, Bcrypt, and Scrypt.
 *
 * @param {string|Buffer} secret - The secret string to hash
 * @param {Object} [options={}] - Hash configuration
 * @param {'argon2id'|'argon2i'|'argon2d'|'bcrypt'|'scrypt'} [options.algorithm='argon2id'] - Algorithm to use
 * @returns {Promise<{ hash: string, algorithm: string, executionTimeMs: number, parameters: object }>}
 */
export async function hash(secret, options = {}) {
  const algo = (options.algorithm || 'argon2id').toLowerCase();

  switch (algo) {
    case 'argon2id':
    case 'argon2i':
    case 'argon2d':
      return hashArgon2(secret, { ...options, algorithm: algo });

    case 'bcrypt':
      return hashBcrypt(secret, options);

    case 'scrypt':
      return hashScrypt(secret, options);

    default:
      throw new Error(`Unsupported hashing algorithm: '${algo}'. Supported: argon2id, argon2i, argon2d, bcrypt, scrypt.`);
  }
}

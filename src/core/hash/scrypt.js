import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { performance } from 'node:perf_hooks';

const scryptAsync = promisify(crypto.scrypt);

/**
 * Scrypt hashing options
 * @typedef {Object} ScryptOptions
 * @property {number} [cost=16384] CPU/memory cost (N, power of 2, default: 16384 = 2^14)
 * @property {number} [blockSize=8] Block size parameter (r, default: 8)
 * @property {number} [parallelization=1] Parallelization parameter (p, default: 1)
 * @property {number} [keyLen=32] Derived key length in bytes (default: 32)
 * @property {number} [saltLen=16] Salt length in bytes (default: 16)
 */

/**
 * Hash a secret using Scrypt
 * Outputs standard PHC string format: $scrypt$ln=<log2(N)>,r=<r>,p=<p>$<salt_b64>$<hash_b64>
 *
 * @param {string|Buffer} secret - The secret text to hash
 * @param {ScryptOptions} [options={}] - Scrypt parameters
 * @returns {Promise<{ hash: string, algorithm: string, executionTimeMs: number, parameters: object }>}
 */
export async function hashScrypt(secret, options = {}) {
  if (secret === undefined || secret === null) {
    throw new TypeError('Secret input is required for Scrypt hashing');
  }

  const cost = Number(options.cost ?? 16384);
  const blockSize = Number(options.blockSize ?? 8);
  const parallelization = Number(options.parallelization ?? 1);
  const keyLen = Number(options.keyLen ?? 32);
  const saltLen = Number(options.saltLen ?? 16);

  if ((cost & (cost - 1)) !== 0 || cost < 2) {
    throw new RangeError('Scrypt cost (N) must be a power of 2 greater than 1');
  }

  const logN = Math.log2(cost);
  const salt = crypto.randomBytes(saltLen);

  const startTime = performance.now();
  const derivedKey = await scryptAsync(secret, salt, keyLen, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: 128 * cost * blockSize * 2,
  });
  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  // Serialize into PHC string format
  const saltB64 = salt.toString('base64').replace(/=+$/, '');
  const hashB64 = Buffer.from(derivedKey).toString('base64').replace(/=+$/, '');
  const formattedHash = `$scrypt$ln=${logN},r=${blockSize},p=${parallelization}$${saltB64}$${hashB64}`;

  return {
    hash: formattedHash,
    algorithm: 'scrypt',
    executionTimeMs,
    parameters: {
      cost,
      logN,
      blockSize,
      parallelization,
      keyLen,
      saltLen,
    },
  };
}

/**
 * Verify a secret against an Scrypt hash string in constant time
 *
 * @param {string|Buffer} secret - The secret text to verify
 * @param {string} hashString - The PHC formatted Scrypt hash string
 * @returns {Promise<boolean>}
 */
export async function verifyScrypt(secret, hashString) {
  if (!secret || !hashString || typeof hashString !== 'string') {
    return false;
  }

  const trimmed = hashString.trim();
  if (!trimmed.startsWith('$scrypt$')) {
    return false;
  }

  try {
    const parts = trimmed.split('$').filter(Boolean);
    // parts[0] = 'scrypt', parts[1] = 'ln=14,r=8,p=1', parts[2] = saltB64, parts[3] = hashB64
    if (parts.length < 4 || parts[0] !== 'scrypt') {
      return false;
    }

    const params = Object.fromEntries(
      parts[1].split(',').map((pair) => pair.split('='))
    );

    const logN = Number(params.ln);
    const r = Number(params.r);
    const p = Number(params.p);

    if (isNaN(logN) || isNaN(r) || isNaN(p)) {
      return false;
    }

    const N = Math.pow(2, logN);
    const salt = Buffer.from(parts[2], 'base64');
    const expectedHash = Buffer.from(parts[3], 'base64');

    const derivedKey = await scryptAsync(secret, salt, expectedHash.length, {
      N,
      r,
      p,
      maxmem: 128 * N * r * 2,
    });

    return crypto.timingSafeEqual(Buffer.from(derivedKey), expectedHash);
  } catch {
    return false;
  }
}

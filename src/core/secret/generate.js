import crypto from 'node:crypto';

/**
 * Generate cryptographically secure API keys, tokens, or session secrets
 *
 * @param {Object} [options={}]
 * @param {number} [options.bytes=32] - Number of random bytes (default: 32 = 256 bits)
 * @param {'hex'|'base64'|'base64url'|'uuid'} [options.format='hex'] - Output encoding
 * @returns {string} Encoded secret token
 */
export function generateSecret(options = {}) {
  const bytes = Math.max(8, Math.min(1024, Number(options.bytes ?? 32)));
  const format = (options.format || 'hex').toLowerCase();

  if (format === 'uuid') {
    return crypto.randomUUID();
  }

  const buf = crypto.randomBytes(bytes);

  switch (format) {
    case 'hex':
      return buf.toString('hex');

    case 'base64':
      return buf.toString('base64');

    case 'base64url':
      return buf.toString('base64url');

    default:
      throw new Error(`Unsupported secret format: '${options.format}'. Supported: hex, base64, base64url, uuid.`);
  }
}

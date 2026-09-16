import { calculateEntropy } from './strength.js';

/**
 * @typedef {Object} PasswordPolicy
 * @property {number} [minLength=12]
 * @property {number} [maxLength=128]
 * @property {boolean} [requireUppercase=true]
 * @property {boolean} [requireLowercase=true]
 * @property {boolean} [requireNumbers=true]
 * @property {boolean} [requireSymbols=true]
 * @property {number} [minEntropy=50]
 * @property {boolean} [disallowWhitespace=true]
 * @property {string[]} [forbiddenWords=[]]
 */

/**
 * Validate a password against security policy rules
 *
 * @param {string} secretInput
 * @param {PasswordPolicy} [policy={}]
 * @returns {{ compliant: boolean, violations: string[], details: object }}
 */
export function validatePolicy(secretInput, policy = {}) {
  const minLength = Number(policy.minLength ?? 12);
  const maxLength = Number(policy.maxLength ?? 128);
  const reqUpper = policy.requireUppercase !== false;
  const reqLower = policy.requireLowercase !== false;
  const reqNumbers = policy.requireNumbers !== false;
  const reqSymbols = policy.requireSymbols !== false;
  const minEntropy = Number(policy.minEntropy ?? 50);
  const disallowWhitespace = policy.disallowWhitespace !== false;
  const forbidden = policy.forbiddenWords || [];

  const violations = [];

  if (typeof secretInput !== 'string') {
    return {
      compliant: false,
      violations: ['Password must be a valid string'],
      details: { length: 0, entropy: 0 },
    };
  }

  const len = secretInput.length;
  if (len < minLength) {
    violations.push(`Must be at least ${minLength} characters long (current: ${len})`);
  }
  if (len > maxLength) {
    violations.push(`Must not exceed ${maxLength} characters (current: ${len})`);
  }

  if (reqUpper && !/[A-Z]/.test(secretInput)) {
    violations.push('Must contain at least one uppercase letter (A-Z)');
  }
  if (reqLower && !/[a-z]/.test(secretInput)) {
    violations.push('Must contain at least one lowercase letter (a-z)');
  }
  if (reqNumbers && !/[0-9]/.test(secretInput)) {
    violations.push('Must contain at least one number (0-9)');
  }
  if (reqSymbols && !/[^a-zA-Z0-9\s]/.test(secretInput)) {
    violations.push('Must contain at least one special symbol');
  }

  if (disallowWhitespace && /\s/.test(secretInput)) {
    violations.push('Must not contain whitespace characters');
  }

  const entropy = calculateEntropy(secretInput);
  if (minEntropy > 0 && entropy < minEntropy) {
    violations.push(`Entropy too low (${entropy} bits, minimum required: ${minEntropy} bits)`);
  }

  const lower = secretInput.toLowerCase();
  for (const word of forbidden) {
    if (word && lower.includes(word.toLowerCase())) {
      violations.push(`Contains forbidden keyword or pattern: '${word}'`);
    }
  }

  return {
    compliant: violations.length === 0,
    violations,
    details: {
      length: len,
      entropyBits: entropy,
      hasUpper: /[A-Z]/.test(secretInput),
      hasLower: /[a-z]/.test(secretInput),
      hasDigits: /[0-9]/.test(secretInput),
      hasSymbols: /[^a-zA-Z0-9\s]/.test(secretInput),
    },
  };
}

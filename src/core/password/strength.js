/**
 * Calculate the Shannon entropy of a password string in bits
 *
 * @param {string} secretInput
 * @returns {number} Entropy in bits
 */
export function calculateEntropy(secretInput) {
  if (!secretInput || typeof secretInput !== 'string') return 0;

  const len = secretInput.length;
  if (len === 0) return 0;

  let poolSize = 0;
  if (/[a-z]/.test(secretInput)) poolSize += 26;
  if (/[A-Z]/.test(secretInput)) poolSize += 26;
  if (/[0-9]/.test(secretInput)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(secretInput)) poolSize += 33;

  if (poolSize === 0) return 0;

  // Pool-based entropy: length * log2(poolSize)
  const poolEntropy = len * Math.log2(poolSize);

  // Character frequency deduction for repeated characters
  const freq = {};
  for (const ch of secretInput) {
    freq[ch] = (freq[ch] || 0) + 1;
  }

  let shannonBits = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    shannonBits -= p * Math.log2(p);
  }
  const totalShannon = Number((shannonBits * len).toFixed(1));

  // Balanced entropy
  return Number(Math.min(poolEntropy, Math.max(totalShannon, poolEntropy * 0.8)).toFixed(1));
}

/**
 * Format a number of seconds into human-readable duration
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds > 1e18) return 'Millions of centuries';
  if (seconds < 1) return 'Instant (< 1 second)';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = hours / 24;
  if (days < 365) return `${Math.round(days)} days`;
  const years = days / 365.25;
  if (years < 100) return `${Math.round(years)} years`;
  const centuries = years / 100;
  if (centuries < 1000) return `${Math.round(centuries)} centuries`;
  return `${(centuries / 10).toFixed(0)} millennia`;
}

/**
 * Perform comprehensive password strength analysis
 *
 * @param {string} secretInput
 * @returns {Object} Strength score, entropy, crack time estimations, and detected weaknesses
 */
export function analyzeStrength(secretInput) {
  if (typeof secretInput !== 'string') {
    return {
      score: 0,
      label: 'Very Weak',
      entropyBits: 0,
      crackTimes: {},
      weaknesses: ['Invalid input'],
    };
  }

  const entropy = calculateEntropy(secretInput);
  const len = secretInput.length;
  const weaknesses = [];

  if (len < 8) {
    weaknesses.push('Length is under 8 characters (critical risk).');
  } else if (len < 12) {
    weaknesses.push('Length is under 12 characters (minimum modern recommendation).');
  }

  if (!/[A-Z]/.test(secretInput)) weaknesses.push('Missing uppercase letters.');
  if (!/[a-z]/.test(secretInput)) weaknesses.push('Missing lowercase letters.');
  if (!/[0-9]/.test(secretInput)) weaknesses.push('Missing numbers.');
  if (!/[^a-zA-Z0-9]/.test(secretInput)) weaknesses.push('Missing special characters.');

  // Repeated sequences (e.g. "aaaa")
  if (/(.)\1{2,}/.test(secretInput)) {
    weaknesses.push('Contains consecutive repeated characters.');
  }

  // Common keyboard patterns
  const lower = secretInput.toLowerCase();
  const patterns = ['123456', 'qwerty', 'azerty', 'password', 'admin', 'motdepasse', 'welcome', 'secret'];
  for (const pat of patterns) {
    if (lower.includes(pat)) {
      weaknesses.push(`Contains common sequence '${pat}'.`);
      break;
    }
  }

  // Total combinations = 2^entropy
  const combinations = Math.pow(2, entropy);

  // Scenarios:
  // 1. Online throttled: 100 attempts / hour (~0.027 attempts/sec)
  const secThrottled = combinations / (100 / 3600);
  // 2. Online unthrottled: 1,000 attempts / sec
  const secUnthrottled = combinations / 1000;
  // 3. Offline slow KDF (Argon2id / Bcrypt 12): 10,000 hashes / sec on multi-GPU
  const secOfflineSlowKdf = combinations / 10000;
  // 4. Offline fast hash (MD5 / SHA-256 on GPU cluster): 100,000,000,000 (100B) hashes / sec
  const secOfflineFastHash = combinations / 100000000000;

  // Score from 0 to 4
  let score = 0;
  if (entropy >= 80 && weaknesses.length === 0) {
    score = 4; // Very Strong
  } else if (entropy >= 60 && weaknesses.length <= 1) {
    score = 3; // Strong
  } else if (entropy >= 45 && weaknesses.length <= 2) {
    score = 2; // Medium
  } else if (entropy >= 28) {
    score = 1; // Weak
  } else {
    score = 0; // Very Weak
  }

  const scoreLabels = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];

  return {
    score,
    label: scoreLabels[score],
    entropyBits: entropy,
    length: len,
    crackTimes: {
      onlineThrottled: formatDuration(secThrottled),
      onlineUnthrottled: formatDuration(secUnthrottled),
      offlineSlowKdf: formatDuration(secOfflineSlowKdf),
      offlineFastHash: formatDuration(secOfflineFastHash),
    },
    weaknesses,
    recommendation: score >= 3 ? 'Password meets modern cryptographic strength standards.' : 'Strengthen this password by increasing length or using a Diceware passphrase.',
  };
}

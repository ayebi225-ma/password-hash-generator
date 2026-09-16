/**
 * Heuristic algorithm detection for password hashes and cryptographic digests.
 *
 * @param {string} input - The hash or digest string
 * @returns {Object} Detection report with identified candidates and security status
 */
export function detectAlgorithm(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new TypeError('Input must be a non-empty string');
  }

  const raw = input.trim();
  const candidates = [];

  // 1. Argon2 family
  if (raw.startsWith('$argon2id$')) {
    candidates.push({ algorithm: 'Argon2id', category: 'KDF (Memory-Hard)', secure: true, recommendation: 'Modern standard' });
  } else if (raw.startsWith('$argon2i$')) {
    candidates.push({ algorithm: 'Argon2i', category: 'KDF (Memory-Hard)', secure: true, recommendation: 'Side-channel resistant' });
  } else if (raw.startsWith('$argon2d$')) {
    candidates.push({ algorithm: 'Argon2d', category: 'KDF (Memory-Hard)', secure: false, recommendation: 'Avoid for passwords (GPU only)' });
  }

  // 2. Bcrypt family
  else if (/^\$2[abyx]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(raw)) {
    const sub = raw.slice(1, 3);
    candidates.push({
      algorithm: `Bcrypt (${sub})`,
      category: 'KDF (Compute-Hard)',
      secure: true,
      recommendation: sub === '2y' ? 'PHP Bcrypt format' : 'Standard Bcrypt format',
    });
  }

  // 3. Scrypt
  else if (raw.startsWith('$scrypt$')) {
    candidates.push({ algorithm: 'Scrypt', category: 'KDF (Memory-Hard)', secure: true, recommendation: 'Hardware-resistant KDF' });
  }

  // 4. SHA-crypt ($5$ or $6$)
  else if (/^\$6\$(rounds=\d+\$)?[./A-Za-z0-9]{1,16}\$[./A-Za-z0-9]{86}$/.test(raw)) {
    candidates.push({ algorithm: 'SHA-512 Crypt (Unix)', category: 'Unix crypt', secure: true, recommendation: 'Standard Linux shadow format' });
  } else if (/^\$5\$(rounds=\d+\$)?[./A-Za-z0-9]{1,16}\$[./A-Za-z0-9]{43}$/.test(raw)) {
    candidates.push({ algorithm: 'SHA-256 Crypt (Unix)', category: 'Unix crypt', secure: true, recommendation: 'Legacy Linux shadow format' });
  }

  // 5. MD5 crypt ($1$ or $apr1$)
  else if (/^\$1\$[./A-Za-z0-9]{1,8}\$[./A-Za-z0-9]{22}$/.test(raw) || /^\$apr1\$[./A-Za-z0-9]{1,8}\$[./A-Za-z0-9]{22}$/.test(raw)) {
    candidates.push({ algorithm: 'MD5-Crypt / Apache APR1', category: 'Legacy crypt', secure: false, recommendation: 'Deprecated, crackable in seconds' });
  }

  // 6. PBKDF2
  else if (raw.startsWith('$pbkdf2') || raw.startsWith('$p5k2$')) {
    candidates.push({ algorithm: 'PBKDF2', category: 'KDF (Compute-Hard)', secure: true, recommendation: 'NIST approved, but susceptible to GPU acceleration' });
  }

  // 7. Plain hex digests (Unsalted or Raw)
  else if (/^[a-fA-F0-9]+$/.test(raw)) {
    const len = raw.length;
    if (len === 32) {
      candidates.push(
        { algorithm: 'MD5 (Hex)', category: 'Unsalted Hash', secure: false, recommendation: 'CRITICAL: Obsolete & collision-vulnerable. Upgrade to Argon2id/Bcrypt immediately.' },
        { algorithm: 'NTLM (Hex)', category: 'Unsalted Hash', secure: false, recommendation: 'CRITICAL: Fast to crack. Use modern authentication.' }
      );
    } else if (len === 40) {
      candidates.push(
        { algorithm: 'SHA-1 (Hex)', category: 'Unsalted Hash', secure: false, recommendation: 'CRITICAL: Shattered / collision broken. Upgrade immediately.' },
        { algorithm: 'RIPEMD-160 (Hex)', category: 'Unsalted Hash', secure: false, recommendation: 'Unsalted, vulnerable to GPU rainbow tables.' }
      );
    } else if (len === 64) {
      candidates.push(
        { algorithm: 'SHA-256 (Hex)', category: 'Fast Digest', secure: false, recommendation: 'Fast hash: Unsuitable for passwords without slow KDF (Argon2/PBKDF2).' },
        { algorithm: 'SHA3-256 / BLAKE2s (Hex)', category: 'Fast Digest', secure: false, recommendation: 'Fast cryptographic hash: Unsuitable for passwords directly.' }
      );
    } else if (len === 96) {
      candidates.push(
        { algorithm: 'SHA-384 (Hex)', category: 'Fast Digest', secure: false, recommendation: 'Fast hash: Unsuitable for passwords without slow KDF.' }
      );
    } else if (len === 128) {
      candidates.push(
        { algorithm: 'SHA-512 (Hex)', category: 'Fast Digest', secure: false, recommendation: 'Fast hash: Unsuitable for passwords without slow KDF.' },
        { algorithm: 'BLAKE2b (Hex)', category: 'Fast Digest', secure: false, recommendation: 'Fast cryptographic hash: Unsuitable for passwords directly.' }
      );
    }
  }

  return {
    raw,
    identified: candidates.length > 0,
    matches: candidates,
    primaryCandidate: candidates[0] || null,
  };
}

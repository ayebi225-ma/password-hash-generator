/**
 * Deep inspection of cryptographic password hashes
 * @param {string} hashString
 * @returns {Object} Detailed breakdown of parameters, security rating, and compatibility
 */
export function inspectHash(hashString) {
  if (typeof hashString !== 'string' || !hashString.trim()) {
    throw new TypeError('Invalid hash string: must be a non-empty string');
  }

  const trimmed = hashString.trim();

  // 1. Argon2 inspection ($argon2id$v=19$m=65536,t=3,p=1$salt$hash)
  if (trimmed.startsWith('$argon2')) {
    return inspectArgon2(trimmed);
  }

  // 2. Bcrypt inspection ($2b$12$... or $2y$12$...)
  if (/^\$2[abyx]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(trimmed)) {
    return inspectBcrypt(trimmed);
  }

  // 3. Scrypt inspection ($scrypt$ln=14,r=8,p=1$salt$hash)
  if (trimmed.startsWith('$scrypt$')) {
    return inspectScrypt(trimmed);
  }

  // 4. Fallback for raw / unformatted hashes
  return {
    recognized: false,
    algorithm: 'unknown',
    format: 'unrecognized',
    securityRating: 'insecure',
    recommendation: 'This hash does not match standard password hashing formats (Argon2, Bcrypt, Scrypt). It may be a raw unsalted digest (MD5/SHA) or an unrecognized format. Upgrade immediately to Argon2id or Bcrypt.',
    raw: trimmed,
  };
}

function inspectArgon2(hashStr) {
  const parts = hashStr.split('$').filter(Boolean);
  const variant = parts[0]; // argon2id, argon2i, argon2d

  let version = 19;
  let paramsStr = '';
  let saltB64 = '';
  let hashB64 = '';

  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith('v=')) {
      version = parseInt(parts[i].replace('v=', ''), 10);
    } else if (parts[i].includes('m=') && parts[i].includes('t=')) {
      paramsStr = parts[i];
    } else if (!saltB64) {
      saltB64 = parts[i];
    } else if (!hashB64) {
      hashB64 = parts[i];
    }
  }

  const params = {};
  if (paramsStr) {
    paramsStr.split(',').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k && v) params[k] = parseInt(v, 10);
    });
  }

  const memoryKiB = params.m || 0;
  const memoryMiB = Math.round(memoryKiB / 1024);
  const timeCost = params.t || 0;
  const parallelism = params.p || 0;

  // Security rating
  let securityRating = 'secure';
  const recommendations = [];

  if (variant === 'argon2d') {
    securityRating = 'weak';
    recommendations.push('Argon2d is vulnerable to side-channel cache attacks. Use Argon2id for password hashing.');
  } else if (variant === 'argon2i') {
    securityRating = 'acceptable';
    recommendations.push('Argon2i provides side-channel resistance but lower GPU resistance than Argon2id. Argon2id is recommended.');
  }

  if (memoryKiB < 19456) { // OWASP minimum is 19 MiB
    if (securityRating === 'secure') securityRating = 'acceptable';
    recommendations.push(`Memory is set to ${memoryMiB} MiB. OWASP recommends at least 19 MiB (or 64 MiB).`);
  }
  if (timeCost < 2) {
    recommendations.push('Iteration count is low (less than 2).');
  }

  if (recommendations.length === 0) {
    recommendations.push('Meets high-security standards (OWASP & Password Hashing Competition winner). Highly resistant to GPU/ASIC cracking.');
  }

  return {
    recognized: true,
    algorithm: variant,
    format: 'Modular Crypt Format (PHC standard)',
    variant,
    version,
    parameters: {
      memoryCostKiB: memoryKiB,
      memoryCostMiB: memoryMiB,
      timeCost,
      parallelism,
    },
    salt: saltB64,
    hash: hashB64,
    securityRating,
    recommendations,
    compatibility: {
      php: 'Supported natively in PHP >= 7.3 via password_hash($p, PASSWORD_ARGON2ID)',
      python: 'Supported via argon2-cffi package',
      nodejs: 'Supported natively via coffrepass / @node-rs/argon2',
    },
  };
}

function inspectBcrypt(hashStr) {
  const parts = hashStr.split('$').filter(Boolean);
  const prefix = parts[0]; // 2a, 2b, 2y, 2x
  const cost = parseInt(parts[1], 10);
  const payload = parts[2] || '';
  const salt = payload.slice(0, 22);
  const checksum = payload.slice(22);

  const iterations = Math.pow(2, cost);

  let securityRating = 'secure';
  const recommendations = [];

  if (cost < 10) {
    securityRating = 'weak';
    recommendations.push(`Bcrypt cost factor ${cost} (2^${cost} = ${iterations} rounds) is too low against modern GPU clusters. Minimum recommended is 12.`);
  } else if (cost < 12) {
    securityRating = 'acceptable';
    recommendations.push(`Bcrypt cost factor ${cost} is acceptable, but 12 (4096 rounds) is recommended.`);
  } else {
    recommendations.push(`Bcrypt cost factor ${cost} (${iterations.toLocaleString()} rounds) provides strong protection against offline brute-force.`);
  }

  let prefixNotes = '';
  if (prefix === '2y') {
    prefixNotes = 'Standard PHP crypt prefix ($2y$), fixes CVE-2011-2483 8-bit character bug.';
  } else if (prefix === '2b') {
    prefixNotes = 'Standard modern OpenBSD/Node/Python prefix ($2b$), standardizes wrap-around handling.';
  } else if (prefix === '2a') {
    prefixNotes = 'Original standard Bcrypt prefix ($2a$).';
  }

  return {
    recognized: true,
    algorithm: 'bcrypt',
    format: 'Modular Crypt Format (Bcrypt standard)',
    variant: `$${prefix}$`,
    parameters: {
      cost,
      iterations,
      prefixNote: prefixNotes,
    },
    salt,
    hash: checksum,
    securityRating,
    recommendations,
    compatibility: {
      php: 'Supported natively in all modern PHP versions via password_hash($p, PASSWORD_BCRYPT)',
      python: 'Supported natively via bcrypt package',
      nodejs: 'Supported natively via coffrepass / @node-rs/bcrypt',
    },
  };
}

function inspectScrypt(hashStr) {
  const parts = hashStr.split('$').filter(Boolean);
  const paramsStr = parts[1] || '';
  const salt = parts[2] || '';
  const hash = parts[3] || '';

  const params = {};
  paramsStr.split(',').forEach((pair) => {
    const [k, v] = pair.split('=');
    if (k && v) params[k] = parseInt(v, 10);
  });

  const logN = params.ln || 14;
  const N = Math.pow(2, logN);
  const r = params.r || 8;
  const p = params.p || 1;

  let securityRating = 'secure';
  const recommendations = [];

  if (N < 16384) {
    securityRating = 'acceptable';
    recommendations.push(`Scrypt cost N=${N} is low. Recommended N >= 16384 (2^14) or 32768.`);
  } else {
    recommendations.push('Strong memory-hard key derivation function, highly resistant to FPGA and ASIC attacks.');
  }

  return {
    recognized: true,
    algorithm: 'scrypt',
    format: 'PHC Modular Crypt Format',
    parameters: {
      costN: N,
      logN,
      blockSizeR: r,
      parallelizationP: p,
    },
    salt,
    hash,
    securityRating,
    recommendations,
    compatibility: {
      php: 'Supported in PHP via sodium_crypto_pwhash_scryptsalsa208sha256 or custom extensions',
      python: 'Supported natively via standard library hashlib.scrypt',
      nodejs: 'Supported natively via node:crypto scrypt',
    },
  };
}

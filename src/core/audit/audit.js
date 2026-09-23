import fs from 'node:fs';
import readline from 'node:readline';
import { detectAlgorithm } from '../inspect/detect.js';
import { inspectHash } from '../inspect/inspect.js';
import { analyzeStrength, calculateEntropy } from '../password/strength.js';
import { validatePolicy } from '../password/policy.js';

/**
 * Heuristically detect whether sample lines contain hashes or plain secrets
 * @param {string[]} sampleLines
 * @returns {'hashes'|'passwords'}
 */
export function detectContentType(sampleLines) {
  if (!Array.isArray(sampleLines) || sampleLines.length === 0) {
    return 'hashes';
  }

  let hashCount = 0;
  let totalChecked = 0;

  for (const rawLine of sampleLines) {
    const line = extractPayload(rawLine);
    if (!line) continue;
    totalChecked++;

    // Check if line matches MCF/PHC format ($argon2, $2, $scrypt, $1$, etc.) or fixed hex digests
    if (
      line.startsWith('$') ||
      /^[a-fA-F0-9]{32}$/.test(line) ||
      /^[a-fA-F0-9]{40}$/.test(line) ||
      /^[a-fA-F0-9]{64}$/.test(line) ||
      /^[a-fA-F0-9]{128}$/.test(line)
    ) {
      hashCount++;
    }
  }

  if (totalChecked === 0) return 'hashes';
  return hashCount / totalChecked >= 0.5 ? 'hashes' : 'passwords';
}

/**
 * Extract hash or secret from lines formatted as "user:hash", "user,hash" or raw value
 * @param {string} line
 * @returns {string}
 */
export function extractPayload(line) {
  if (typeof line !== 'string') return '';
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return '';
  }

  // If CSV or passwd/shadow format (user:hash or email,hash)
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    // For shadow file: username:hash:...
    if (parts[1] && (parts[1].startsWith('$') || parts[1].length >= 10)) {
      return parts[1].trim();
    }
  } else if (trimmed.includes(',')) {
    const parts = trimmed.split(',');
    // Second column is likely the hash/secret
    if (parts[1] && (parts[1].startsWith('$') || parts[1].length >= 8)) {
      return parts[1].trim();
    }
  }

  return trimmed;
}

/**
 * Audit a collection of password hash strings
 *
 * @param {string[]} lines - Raw lines or hash strings
 * @param {Object} [options={}]
 * @returns {Object} Comprehensive cryptographic health audit report
 */
export function auditHashes(lines, options = {}) {
  const items = [];
  const freqMap = new Map();
  const distribution = {};
  const vulnerabilities = [];

  let secureCount = 0;
  let acceptableCount = 0;
  let vulnerableCount = 0;

  const maxItems = options.maxItems ?? 1000;

  for (const rawLine of lines) {
    const hashStr = extractPayload(rawLine);
    if (!hashStr) continue;

    // Track duplicates
    const count = (freqMap.get(hashStr) || 0) + 1;
    freqMap.set(hashStr, count);

    const detection = detectAlgorithm(hashStr);
    let algoName = 'Unknown';
    let isSecure = false;
    let rating = 'unknown';

    if (detection.identified && detection.primaryCandidate) {
      algoName = detection.primaryCandidate.algorithm;
      isSecure = detection.primaryCandidate.secure;
    }

    if (hashStr.startsWith('$argon2id')) {
      rating = 'secure';
      secureCount++;
    } else if (hashStr.startsWith('$2')) {
      // Check Bcrypt cost factor
      const match = hashStr.match(/^\$2[abyx]\$(\d{2})\$/);
      const cost = match ? parseInt(match[1], 10) : 10;
      if (cost >= 12) {
        rating = 'secure';
        secureCount++;
      } else if (cost >= 10) {
        rating = 'acceptable';
        acceptableCount++;
      } else {
        rating = 'vulnerable';
        vulnerableCount++;
        vulnerabilities.push({
          type: 'WEAK_BCRYPT_COST',
          severity: 'HIGH',
          message: `Bcrypt cost factor ${cost} is too low (minimum recommended is 12).`,
          sample: hashStr.slice(0, 28) + '...',
        });
      }
    } else if (hashStr.startsWith('$scrypt')) {
      rating = 'secure';
      secureCount++;
    } else if (hashStr.startsWith('$argon2i')) {
      rating = 'acceptable';
      acceptableCount++;
    } else if (/^[a-fA-F0-9]{32}$/.test(hashStr)) {
      rating = 'vulnerable';
      vulnerableCount++;
      vulnerabilities.push({
        type: 'OBSOLETE_HASH_MD5_NTLM',
        severity: 'CRITICAL',
        message: 'Raw 32-character hex digest detected (MD5 or NTLM). Collision broken and crackable in seconds.',
        sample: hashStr,
      });
    } else if (/^[a-fA-F0-9]{40}$/.test(hashStr)) {
      rating = 'vulnerable';
      vulnerableCount++;
      vulnerabilities.push({
        type: 'OBSOLETE_HASH_SHA1',
        severity: 'CRITICAL',
        message: 'Raw 40-character hex digest detected (SHA-1). Cryptographically broken and vulnerable to GPU rainbow tables.',
        sample: hashStr,
      });
    } else if (/^[a-fA-F0-9]{64}$/.test(hashStr)) {
      rating = 'acceptable';
      acceptableCount++;
      vulnerabilities.push({
        type: 'FAST_DIGEST_SHA256',
        severity: 'MEDIUM',
        message: 'Unsalted or fast SHA-256 digest. Prone to GPU-accelerated brute force without slow KDF (Argon2id/Bcrypt).',
        sample: hashStr.slice(0, 20) + '...',
      });
    } else {
      rating = isSecure ? 'secure' : 'acceptable';
      if (isSecure) secureCount++;
      else acceptableCount++;
    }

    // Distribution stats
    if (!distribution[algoName]) {
      distribution[algoName] = { count: 0, percentage: 0, secure: isSecure };
    }
    distribution[algoName].count++;

    if (items.length < maxItems) {
      items.push({
        hash: hashStr.length > 50 ? hashStr.slice(0, 47) + '...' : hashStr,
        algorithm: algoName,
        rating,
        secure: isSecure,
      });
    }
  }

  const total = freqMap.size === 0 ? 0 : Array.from(freqMap.values()).reduce((a, b) => a + b, 0);
  const uniqueCount = freqMap.size;
  const duplicateCount = total - uniqueCount;

  // Calculate percentages
  for (const k of Object.keys(distribution)) {
    distribution[k].percentage = total > 0 ? Number(((distribution[k].count / total) * 100).toFixed(1)) : 0;
  }

  // Calculate overall cryptographic score (0 to 100)
  let score = 100;
  if (total > 0) {
    const vulnRatio = vulnerableCount / total;
    const acceptRatio = acceptableCount / total;
    // Deduct heavily for vulnerable hashes, slightly for acceptable
    score = Math.max(0, Math.round(100 - vulnRatio * 85 - acceptRatio * 20));
  } else {
    score = 0;
  }

  let grade = 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';

  const recommendations = [];
  if (vulnerableCount > 0) {
    recommendations.push(`CRITICAL: ${vulnerableCount} obsolete or weak hash(es) detected (MD5/SHA-1/low cost). Migrate immediately to Argon2id.`);
  }
  if (duplicateCount > 0) {
    recommendations.push(`INFO: ${duplicateCount} duplicate hash(es) identified. Verify that unique random salts are enforced.`);
  }
  if (score >= 90) {
    recommendations.push('EXCELLENT: The cryptographic posture complies with modern OWASP and ANSSI guidelines.');
  }

  return {
    type: 'hashes',
    total,
    uniqueCount,
    duplicateCount,
    score,
    grade,
    summary: {
      secure: secureCount,
      acceptable: acceptableCount,
      vulnerable: vulnerableCount,
    },
    distribution,
    vulnerabilities: vulnerabilities.slice(0, 50),
    recommendations,
    sampleItems: items,
  };
}

/**
 * Audit a collection of plaintext passwords
 *
 * @param {string[]} lines - Raw lines or secret strings
 * @param {Object} [options={}]
 * @returns {Object} Password health and entropy audit report
 */
export function auditPasswords(lines, options = {}) {
  const items = [];
  const freqMap = new Map();
  const scoreDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  const weaknessFreq = {};
  let totalEntropy = 0;
  let totalLength = 0;
  let compliantCount = 0;

  const policy = options.policy || { minLength: 12, minEntropy: 50 };
  const maxItems = options.maxItems ?? 1000;

  for (const rawLine of lines) {
    const entryVal = extractPayload(rawLine);
    if (!entryVal) continue;

    const count = (freqMap.get(entryVal) || 0) + 1;
    freqMap.set(entryVal, count);

    const entropy = calculateEntropy(entryVal);
    const strength = analyzeStrength(entryVal);
    const polResult = validatePolicy(entryVal, policy);

    totalEntropy += entropy;
    totalLength += entryVal.length;
    scoreDistribution[strength.score] = (scoreDistribution[strength.score] || 0) + 1;

    if (polResult.compliant) {
      compliantCount++;
    }

    strength.weaknesses.forEach((w) => {
      weaknessFreq[w] = (weaknessFreq[w] || 0) + 1;
    });

    if (items.length < maxItems) {
      items.push({
        masked: entryVal.length > 2 ? entryVal[0] + '*'.repeat(entryVal.length - 2) + entryVal.slice(-1) : '***',
        length: entryVal.length,
        entropyBits: entropy,
        score: strength.score,
        label: strength.label,
        compliant: polResult.compliant,
      });
    }
  }

  const total = Array.from(freqMap.values()).reduce((a, b) => a + b, 0);
  const uniqueCount = freqMap.size;
  const duplicateCount = total - uniqueCount;

  const avgEntropy = total > 0 ? Number((totalEntropy / total).toFixed(1)) : 0;
  const avgLength = total > 0 ? Number((totalLength / total).toFixed(1)) : 0;
  const compliancePct = total > 0 ? Number(((compliantCount / total) * 100).toFixed(1)) : 0;

  // Calculate overall score (0 to 100)
  let score = 0;
  if (total > 0) {
    const strongRatio = ((scoreDistribution[3] || 0) + (scoreDistribution[4] || 0)) / total;
    const weakRatio = ((scoreDistribution[0] || 0) + (scoreDistribution[1] || 0)) / total;
    score = Math.max(0, Math.min(100, Math.round(strongRatio * 100 - weakRatio * 40 + (compliancePct * 0.2))));
  }

  let grade = 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';

  const sortedWeaknesses = Object.entries(weaknessFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([weakness, occurrences]) => ({ weakness, occurrences }));

  const recommendations = [];
  if (compliancePct < 80) {
    recommendations.push(`Only ${compliancePct}% of entries meet the security policy. Enforce stronger password requirements.`);
  }
  if (duplicateCount > 0) {
    recommendations.push(`${duplicateCount} reused password(s) found across entries. Disallow password reuse.`);
  }
  if (avgLength < 12) {
    recommendations.push(`Average length is ${avgLength} characters. Modern security standards (ANSSI/NIST) recommend at least 12 characters.`);
  }

  return {
    type: 'passwords',
    total,
    uniqueCount,
    duplicateCount,
    score,
    grade,
    metrics: {
      averageEntropy: avgEntropy,
      averageLength: avgLength,
      compliancePercentage: compliancePct,
      compliantCount,
      nonCompliantCount: total - compliantCount,
    },
    scoreDistribution: {
      veryWeak: scoreDistribution[0] || 0,
      weak: scoreDistribution[1] || 0,
      medium: scoreDistribution[2] || 0,
      strong: scoreDistribution[3] || 0,
      veryStrong: scoreDistribution[4] || 0,
    },
    topWeaknesses: sortedWeaknesses.slice(0, 10),
    recommendations,
    sampleItems: items,
  };
}

/**
 * Audit a file on disk (streaming support)
 *
 * @param {string} filePath - Absolute or relative file path
 * @param {Object} [options={}]
 * @returns {Promise<Object>}
 */
export async function auditFile(filePath, options = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const lines = [];
  const sampleLines = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    lines.push(trimmed);
    if (sampleLines.length < 20) {
      sampleLines.push(trimmed);
    }
  }

  const forcedType = options.type;
  const determinedType = forcedType || detectContentType(sampleLines);

  if (determinedType === 'passwords') {
    return auditPasswords(lines, options);
  }
  return auditHashes(lines, options);
}

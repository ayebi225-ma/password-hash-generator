/**
 * coffrepass - Cryptographic Password & Security Suite
 * High-performance password hashing, verification, inspection, strength analysis and CSPRNG generation.
 * Compatible with PHP >= 8.2 and Python.
 */

export { hash, hashArgon2, hashBcrypt, hashScrypt } from './hash/index.js';
export { verify, verifyDetailed, detectHashAlgorithm } from './verify/index.js';
export { inspectHash } from './inspect/inspect.js';
export { detectAlgorithm } from './inspect/detect.js';
export { generatePassword, generatePassphrase } from './password/generate.js';
export { calculateEntropy, formatDuration, analyzeStrength } from './password/strength.js';
export { validatePolicy } from './password/policy.js';
export { generateSecret } from './secret/generate.js';
export { runBenchmark } from './benchmark/benchmark.js';

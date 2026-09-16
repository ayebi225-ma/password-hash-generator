import { describe, it, expect } from 'vitest';
import { inspectHash } from '../../src/core/inspect/inspect.js';
import { detectAlgorithm } from '../../src/core/inspect/detect.js';

describe('Inspect & Detect Modules', () => {
  it('inspects Argon2id hashes with detailed parameter breakdown', () => {
    const hash = '$argon2id$v=19$m=65536,t=3,p=1$eE1xcWQ0Y0poWlF4akhqWA$W+58+7UpBQJcgRFW5+fo4jKqDw94YC3+cvwOv1myEbY';
    const report = inspectHash(hash);

    expect(report.recognized).toBe(true);
    expect(report.algorithm).toBe('argon2id');
    expect(report.parameters.memoryCostKiB).toBe(65536);
    expect(report.parameters.memoryCostMiB).toBe(64);
    expect(report.parameters.timeCost).toBe(3);
    expect(report.parameters.parallelism).toBe(1);
    expect(report.securityRating).toBe('secure');
    expect(report.compatibility.php).toBeDefined();
    expect(report.compatibility.python).toBeDefined();
  });

  it('inspects Bcrypt hashes with PHP $2y$ prefix awareness', () => {
    const hash = '$2y$12$D4G5f1A8J7h6G5F4D3S2A1Q9W8E7R6T5Y4U3I2O1P0Z9X8C7V6B5N';
    const report = inspectHash(hash);

    expect(report.recognized).toBe(true);
    expect(report.algorithm).toBe('bcrypt');
    expect(report.variant).toBe('$2y$');
    expect(report.parameters.cost).toBe(12);
    expect(report.parameters.iterations).toBe(4096);
    expect(report.securityRating).toBe('secure');
  });

  it('detects various hash types and formats heuristically', () => {
    const md5Hex = '5d41402abc4b2a76b9719d911017c592';
    const dMd5 = detectAlgorithm(md5Hex);
    expect(dMd5.identified).toBe(true);
    expect(dMd5.primaryCandidate.algorithm).toContain('MD5');
    expect(dMd5.primaryCandidate.secure).toBe(false);

    const sha256Hex = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const dSha = detectAlgorithm(sha256Hex);
    expect(dSha.identified).toBe(true);
    expect(dSha.primaryCandidate.algorithm).toContain('SHA-256');

    const bcrypt = '$2b$12$D4G5f1A8J7h6G5F4D3S2A1Q9W8E7R6T5Y4U3I2O1P0Z9X8C7V6B5N';
    const dBcrypt = detectAlgorithm(bcrypt);
    expect(dBcrypt.identified).toBe(true);
    expect(dBcrypt.primaryCandidate.algorithm).toContain('Bcrypt');
    expect(dBcrypt.primaryCandidate.secure).toBe(true);
  });
});

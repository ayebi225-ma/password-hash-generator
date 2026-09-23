import { describe, it, expect } from 'vitest';
import { auditHashes, auditPasswords, detectContentType, auditFile } from '../../src/core/audit/audit.js';
import fs from 'node:fs';
import path from 'node:path';

describe('Batch Audit Core Module', () => {
  const sampleHashes = [
    '$argon2id$v=19$m=65536,t=3,p=1$eE1xcWQ0Y0poWlF4akhqWA$W+58+7UpBQJcgRFW5+fo4jKqDw94YC3+cvwOv1myEbY',
    '$2b$12$D4G5f1A8J7h6G5F4D3S2A1Q9W8E7R6T5Y4U3I2O1P0Z9X8C7V6B5N',
    '$2y$12$D4G5f1A8J7h6G5F4D3S2A1Q9W8E7R6T5Y4U3I2O1P0Z9X8C7V6B5N',
    '$2b$08$D4G5f1A8J7h6G5F4D3S2A1Q9W8E7R6T5Y4U3I2O1P0Z9X8C7V6B5N', // weak cost 8
    '5d41402abc4b2a76b9719d911017c592', // MD5
    '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12', // SHA-1
    'admin:$argon2id$v=19$m=65536,t=3,p=1$eE1xcWQ0Y0poWlF4akhqWA$W+58+7UpBQJcgRFW5+fo4jKqDw94YC3+cvwOv1myEbY', // passwd format
  ];

  const samplePasswords = [
    'CorrectHorseBatteryStaple2026!',
    '123456',
    'password',
    'Admin#2026Secured!',
    'qwerty',
    'admin,123456', // CSV format
  ];

  it('detects content type accurately', () => {
    expect(detectContentType(sampleHashes)).toBe('hashes');
    expect(detectContentType(samplePasswords)).toBe('passwords');
  });

  it('audits a collection of hashes and detects vulnerabilities', () => {
    const report = auditHashes(sampleHashes);
    expect(report.type).toBe('hashes');
    expect(report.total).toBe(7);
    expect(report.duplicateCount).toBeGreaterThan(0); // Argon2 duplicate
    expect(report.summary.vulnerable).toBeGreaterThanOrEqual(3); // MD5, SHA1, Bcrypt cost 8
    expect(report.distribution['Argon2id']).toBeDefined();
    expect(report.distribution['Argon2id'].count).toBe(2);
    expect(report.vulnerabilities.length).toBeGreaterThan(0);
    expect(report.score).toBeLessThan(90);
    expect(report.grade).toBeDefined();
  });

  it('audits a collection of passwords and calculates entropy and policy metrics', () => {
    const report = auditPasswords(samplePasswords, {
      policy: { minLength: 12, minEntropy: 50 },
    });
    expect(report.type).toBe('passwords');
    expect(report.total).toBe(6);
    expect(report.metrics.averageEntropy).toBeGreaterThan(0);
    expect(report.metrics.averageLength).toBeGreaterThan(0);
    expect(report.metrics.compliantCount).toBe(2); // 2 strong ones
    expect(report.scoreDistribution.veryWeak).toBeGreaterThanOrEqual(2);
    expect(report.topWeaknesses.length).toBeGreaterThan(0);
  });

  it('audits a file directly from filesystem', async () => {
    const tmpFile = path.resolve('scratch_audit_test.txt');
    fs.writeFileSync(tmpFile, sampleHashes.join('\n'));

    try {
      const report = await auditFile(tmpFile);
      expect(report.type).toBe('hashes');
      expect(report.total).toBe(7);
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  });
});

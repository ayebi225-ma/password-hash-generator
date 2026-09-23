import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';

const execFileAsync = promisify(execFile);
const BIN_PATH = path.resolve('bin/coffrepass.js');

describe('Coffrepass CLI Batch Audit Tests', () => {
  const testFilePath = path.resolve('tests/cli/sample_audit_file.txt');

  beforeAll(() => {
    const lines = [
      '$argon2id$v=19$m=65536,t=3,p=1$eE1xcWQ0Y0poWlF4akhqWA$W+58+7UpBQJcgRFW5+fo4jKqDw94YC3+cvwOv1myEbY',
      '$2y$12$D4G5f1A8J7h6G5F4D3S2A1Q9W8E7R6T5Y4U3I2O1P0Z9X8C7V6B5N',
      '$scrypt$ln=14,r=8,p=1$eE1xcWQ0Y0poWlF4akhqWA$W+58+7UpBQJcgRFW5+fo4jKqDw94YC3+cvwOv1myEbY',
      '5d41402abc4b2a76b9719d911017c592', // MD5
    ];
    fs.writeFileSync(testFilePath, lines.join('\n'));
  });

  afterAll(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('runs audit on a file and outputs JSON', async () => {
    try {
      const { stdout } = await execFileAsync('node', [BIN_PATH, 'audit', testFilePath, '--json']);
      const json = JSON.parse(stdout);
      expect(json.type).toBe('hashes');
      expect(json.total).toBe(4);
      expect(json.summary.vulnerable).toBe(1);
    } catch (err) {
      // Exit code 1 is expected because of the vulnerable MD5 hash
      expect(err.code).toBe(1);
      const json = JSON.parse(err.stdout);
      expect(json.type).toBe('hashes');
      expect(json.total).toBe(4);
      expect(json.summary.vulnerable).toBe(1);
    }
  });

  it('exports report to JSON file via --report flag', async () => {
    const reportOut = path.resolve('tests/cli/audit_report.json');
    try {
      await execFileAsync('node', [BIN_PATH, 'audit', testFilePath, '--report', reportOut]);
    } catch {
      // Expect exit code 1 due to MD5
    }

    expect(fs.existsSync(reportOut)).toBe(true);
    const content = JSON.parse(fs.readFileSync(reportOut, 'utf-8'));
    expect(content.total).toBe(4);
    expect(content.distribution['Argon2id']).toBeDefined();

    if (fs.existsSync(reportOut)) {
      fs.unlinkSync(reportOut);
    }
  });
});

import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const BIN_PATH = path.resolve('bin/coffrepass.js');

describe('Coffrepass CLI End-to-End Tests', () => {
  it('outputs help and returns exit code 0', async () => {
    const { stdout } = await execFileAsync('node', [BIN_PATH, '--help']);
    expect(stdout).toContain('coffrepass [options] [command]');
    expect(stdout).toContain('hash');
    expect(stdout).toContain('verify');
    expect(stdout).toContain('generate');
  });

  it('hashes secret with argon2id and outputs JSON', async () => {
    const { stdout } = await execFileAsync('node', [
      BIN_PATH,
      'hash',
      'UnitTestSecret123!',
      '--algo',
      'argon2id',
      '--json',
    ]);
    const json = JSON.parse(stdout);
    expect(json.algorithm).toBe('argon2id');
    expect(json.hash).toMatch(/^\$argon2id\$/);
    expect(json.executionTimeMs).toBeGreaterThan(0);
  });

  it('hashes and verifies a secret via CLI', async () => {
    const { stdout: hashOut } = await execFileAsync('node', [
      BIN_PATH,
      'hash',
      'KeyToVerify987#',
      '--algo',
      'bcrypt',
      '--cost',
      '10',
      '--json',
    ]);
    const { hash } = JSON.parse(hashOut);

    const { stdout: verifyOut } = await execFileAsync('node', [
      BIN_PATH,
      'verify',
      'KeyToVerify987#',
      hash,
      '--json',
    ]);
    const verifyJson = JSON.parse(verifyOut);
    expect(verifyJson.valid).toBe(true);
  });

  it('exits with code 3 on verification mismatch', async () => {
    const dummyHash = '$2y$10$eA09y6f75Rj69V/u6E0hROb0qA5F.G4L71aC4j45gA96G0Z1bZJ9q';
    try {
      await execFileAsync('node', [BIN_PATH, 'verify', 'WrongSecret', dummyHash]);
      expect.unreachable('Should have failed with exit code 3');
    } catch (err) {
      expect(err.code).toBe(3);
    }
  });

  it('generates a Diceware passphrase in JSON format', async () => {
    const { stdout } = await execFileAsync('node', [
      BIN_PATH,
      'gen',
      '--passphrase',
      '--words',
      '5',
      '--separator',
      '_',
      '--json',
    ]);
    const json = JSON.parse(stdout);
    expect(json.type).toBe('passphrase');
    expect(json.value.split('_').length).toBe(5);
    expect(json.entropyBits).toBeGreaterThan(0);
  });

  it('inspects an Argon2 hash and outputs JSON', async () => {
    const hash = '$argon2id$v=19$m=65536,t=3,p=1$py7izh+4gG1+Qn2fY0mc+w$XtHNhmwc22cnK+uboF+MgzlhlsXWCbKv1JYadfsUEBQ';
    const { stdout } = await execFileAsync('node', [BIN_PATH, 'inspect', hash, '--json']);
    const json = JSON.parse(stdout);
    expect(json.algorithm).toBe('argon2id');
    expect(json.parameters.memoryCostMiB).toBe(64);
    expect(json.securityRating).toBe('secure');
  });

  it('analyzes password strength in JSON format', async () => {
    const { stdout } = await execFileAsync('node', [BIN_PATH, 'strength', 'CorrectHorseBatteryStaple!', '--json']);
    const json = JSON.parse(stdout);
    expect(json.score).toBeGreaterThanOrEqual(3);
    expect(json.entropyBits).toBeGreaterThan(60);
  });

  it('exits with code 4 on policy violation', async () => {
    try {
      await execFileAsync('node', [BIN_PATH, 'policy', 'short', '--min-length', '12']);
      expect.unreachable('Should have failed with exit code 4');
    } catch (err) {
      expect(err.code).toBe(4);
    }
  });
});

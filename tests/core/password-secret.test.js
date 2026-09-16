import { describe, it, expect } from 'vitest';
import { generatePassword, generatePassphrase } from '../../src/core/password/generate.js';
import { calculateEntropy, analyzeStrength } from '../../src/core/password/strength.js';
import { validatePolicy } from '../../src/core/password/policy.js';
import { generateSecret } from '../../src/core/secret/generate.js';

describe('Password, Passphrase, Strength, Policy & Secret Generation', () => {
  it('generates a random CSPRNG password with custom constraints', () => {
    const pwd = generatePassword({ length: 24, avoidAmbiguous: true });
    expect(pwd.length).toBe(24);
    expect(pwd).toMatch(/[A-Z]/);
    expect(pwd).toMatch(/[a-z]/);
    expect(pwd).toMatch(/[0-9]/);
    expect(pwd).toMatch(/[^A-Za-z0-9]/);
    // Ambiguous chars should not be present
    expect(pwd).not.toMatch(/[0O1lI]/);
  });

  it('generates a Diceware passphrase in French', () => {
    const pass = generatePassphrase({ words: 5, separator: '-', capitalize: true, includeNumber: true });
    const parts = pass.split('-');
    expect(parts.length).toBe(5);
    expect(parts[0][0]).toBe(parts[0][0].toUpperCase());
    expect(pass).toMatch(/\d/);
  });

  it('calculates entropy and analyzes password strength', () => {
    const weak = analyzeStrength('123456');
    expect(weak.score).toBeLessThanOrEqual(1);
    expect(weak.weaknesses.length).toBeGreaterThan(0);

    const strong = analyzeStrength('K9#mX2$vL8!pQ5*wZ1');
    expect(strong.score).toBeGreaterThanOrEqual(3);
    expect(strong.entropyBits).toBeGreaterThan(60);
    expect(strong.crackTimes.offlineSlowKdf).toBeDefined();
  });

  it('validates password policy compliance', () => {
    const bad = validatePolicy('short', { minLength: 12 });
    expect(bad.compliant).toBe(false);
    expect(bad.violations.length).toBeGreaterThan(0);

    const good = validatePolicy('CoffrePass!2026SecureKey', {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
    });
    expect(good.compliant).toBe(true);
    expect(good.violations.length).toBe(0);
  });

  it('generates cryptographic secrets in various formats', () => {
    const hex = generateSecret({ bytes: 32, format: 'hex' });
    expect(hex.length).toBe(64);

    const b64 = generateSecret({ bytes: 32, format: 'base64' });
    expect(b64).toBeDefined();

    const uuid = generateSecret({ format: 'uuid' });
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});

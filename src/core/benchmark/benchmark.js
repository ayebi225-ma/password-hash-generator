import { hashArgon2 } from '../hash/argon2.js';
import { hashBcrypt } from '../hash/bcrypt.js';
import { hashScrypt } from '../hash/scrypt.js';
import { performance } from 'node:perf_hooks';

/**
 * Benchmark password hashing algorithms on current hardware
 *
 * @param {Object} [options={}]
 * @param {number} [options.rounds=3] Number of iterations per benchmark test
 * @returns {Promise<Object>} Benchmark results and recommendations
 */
export async function runBenchmark(options = {}) {
  const rounds = Math.max(1, Math.min(10, Number(options.rounds ?? 3)));
  const dummyText = 'CoffrePassBenchmarkSecret99#';

  const results = [];

  // Helper to run N rounds
  const measure = async (name, fn) => {
    // Warm-up run
    await fn();

    const times = [];
    for (let i = 0; i < rounds; i++) {
      const t0 = performance.now();
      await fn();
      times.push(performance.now() - t0);
    }
    const avgMs = times.reduce((a, b) => a + b, 0) / rounds;
    const hashesPerSec = (1000 / avgMs).toFixed(1);

    return {
      name,
      avgMs: Number(avgMs.toFixed(1)),
      hashesPerSec: Number(hashesPerSec),
    };
  };

  // 1. Bcrypt tests
  results.push(await measure('Bcrypt (cost 10)', () => hashBcrypt(dummyText, { cost: 10 })));
  results.push(await measure('Bcrypt (cost 12 - recommended)', () => hashBcrypt(dummyText, { cost: 12 })));

  // 2. Argon2id tests
  results.push(await measure('Argon2id (m=19MiB, t=2, p=1 - OWASP min)', () =>
    hashArgon2(dummyText, { memoryCost: 19456, timeCost: 2, parallelism: 1 })
  ));
  results.push(await measure('Argon2id (m=64MiB, t=3, p=1 - Recommended)', () =>
    hashArgon2(dummyText, { memoryCost: 65536, timeCost: 3, parallelism: 1 })
  ));

  // 3. Scrypt test
  results.push(await measure('Scrypt (N=16384, r=8, p=1)', () =>
    hashScrypt(dummyText, { cost: 16384, blockSize: 8, parallelization: 1 })
  ));

  // Hardware assessment
  const bcrypt12Time = results.find((r) => r.name.includes('cost 12'))?.avgMs || 250;
  const argon2RecTime = results.find((r) => r.name.includes('64MiB'))?.avgMs || 100;

  let recommendation = '';
  if (argon2RecTime < 500) {
    recommendation = `Optimal configuration: Argon2id (m=64MiB, t=3) takes ${argon2RecTime}ms on your machine. Excellent defense against GPUs with zero perceptible auth lag.`;
  } else {
    recommendation = `Argon2id took ${argon2RecTime}ms. For high-traffic applications, consider Argon2id (m=19MiB, t=2) or Bcrypt (cost 11).`;
  }

  return {
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    rounds,
    benchmarks: results,
    recommendation,
  };
}

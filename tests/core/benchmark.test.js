import { describe, it, expect } from 'vitest';
import { runBenchmark } from '../../src/core/benchmark/benchmark.js';

describe('Benchmark Module', () => {
  it('executes hardware benchmarks and returns performance statistics', async () => {
    const res = await runBenchmark({ rounds: 1 });
    expect(res.system).toBeDefined();
    expect(res.benchmarks).toBeInstanceOf(Array);
    expect(res.benchmarks.length).toBeGreaterThan(0);
    expect(res.benchmarks[0].avgMs).toBeGreaterThan(0);
    expect(res.recommendation).toBeDefined();
  }, 10000);
});

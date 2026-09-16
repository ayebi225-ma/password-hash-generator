import pc from 'picocolors';
import { runBenchmark } from '../../core/benchmark/benchmark.js';
import { outputResult, printSuccess, printError, printInfo, createTable, handleCommandError } from '../ui/formatters.js';
import { EXIT_CODES } from '../ui/exit-codes.js';

export async function benchmarkCommand(options) {
  try {
    if (!options.json) {
      console.log();
      printInfo('Benchmarking local cryptographic performance (warming up and running)...');
    }

    const rounds = options.rounds ? Number(options.rounds) : 3;
    const report = await runBenchmark({ rounds });

    outputResult(report, options.json, () => {
      console.log();
      printSuccess(`Hardware Cryptographic Benchmark Results:`);
      console.log(`  ${pc.dim('System:')} ${report.system.platform} (${report.system.arch}) on Node ${report.system.nodeVersion}`);
      console.log(`  ${pc.dim('Averaged over:')} ${report.rounds} rounds per test`);
      console.log();

      const rows = report.benchmarks.map((b) => [
        pc.bold(b.name),
        `${b.avgMs} ms`,
        `${b.hashesPerSec} hashes/sec`,
      ]);

      console.log(createTable(['Algorithm & Parameters', 'Average Latency', 'Throughput'], rows));
      console.log();
      console.log(pc.bold('Local Tuning Recommendation:'));
      console.log(`  ${pc.green('✔')} ${report.recommendation}`);
      console.log();
    });

    process.exit(EXIT_CODES.SUCCESS);
  } catch (err) {
    handleCommandError(err, options.json);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

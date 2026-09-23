import { select, password as promptPassword, input, number } from '@inquirer/prompts';
import pc from 'picocolors';
import { printBanner, printSuccess, printError, printInfo, createTable } from '../ui/formatters.js';
import { hash } from '../../core/hash/index.js';
import { verifyDetailed } from '../../core/verify/index.js';
import { generatePassword, generatePassphrase } from '../../core/password/generate.js';
import { generateSecret } from '../../core/secret/generate.js';
import { inspectHash } from '../../core/inspect/inspect.js';
import { detectAlgorithm } from '../../core/inspect/detect.js';
import { analyzeStrength } from '../../core/password/strength.js';
import { validatePolicy } from '../../core/password/policy.js';
import { runBenchmark } from '../../core/benchmark/benchmark.js';

export async function interactiveCommand() {
  printBanner();

  let keepRunning = true;
  while (keepRunning) {
    console.log();
    const action = await select({
      message: 'Choose an operation:',
      choices: [
        { name: '1. 🔒 Hash a password (Argon2id, Bcrypt, Scrypt)', value: 'hash' },
        { name: '2. 🔍 Verify password against a hash', value: 'verify' },
        { name: '3. 🎲 Generate strong password (CSPRNG)', value: 'gen-pwd' },
        { name: '4. 📚 Generate Diceware passphrase (French XKCD)', value: 'gen-phrase' },
        { name: '5. 🔑 Generate API / Token Secret (Hex, Base64, UUID)', value: 'gen-secret' },
        { name: '6. 🔬 Inspect hash parameters & security rating', value: 'inspect' },
        { name: '7. 🕵️ Detect unknown hash format', value: 'detect' },
        { name: '8. ⚡ Test password strength & cracking estimation', value: 'strength' },
        { name: '9. 📋 Validate password against security policy', value: 'policy' },
        { name: '10. 📊 Audit batch file (hashes or passwords)', value: 'audit' },
        { name: '11. ⏱️ Run local cryptographic benchmark', value: 'benchmark' },
        { name: '12. 🚪 Exit', value: 'exit' },
      ],
    });

    try {
      switch (action) {
        case 'hash': {
          const secret = await promptPassword({ message: 'Enter secret to hash:', mask: '*' });
          if (!secret) {
            printError('Secret cannot be empty');
            break;
          }
          const algo = await select({
            message: 'Select algorithm:',
            choices: [
              { name: 'Argon2id (Recommended modern standard, PHP 8.2+ & Python compatible)', value: 'argon2id' },
              { name: 'Bcrypt ($2b$ / $2y$ standard, PHP 8.2+ & Python compatible)', value: 'bcrypt' },
              { name: 'Scrypt (Memory-hard key derivation)', value: 'scrypt' },
              { name: 'Argon2i (Side-channel resistant)', value: 'argon2i' },
            ],
          });

          let options = { algorithm: algo };
          if (algo === 'bcrypt') {
            const cost = await number({ message: 'Bcrypt cost factor (4 - 16):', default: 12 });
            const prefix = await select({
              message: 'Bcrypt prefix:',
              choices: [
                { name: '$2b$ (Standard modern OpenBSD, Node, Python)', value: '2b' },
                { name: '$2y$ (PHP password_hash compatibility)', value: '2y' },
              ],
            });
            options.cost = cost;
            options.prefix = prefix;
          }

          const res = await hash(secret, options);
          console.log();
          printSuccess(`Hash generated with ${pc.bold(algo)}:`);
          console.log(`  ${pc.bold(pc.green(res.hash))}`);
          console.log(`  ${pc.dim('Execution time:')} ${res.executionTimeMs} ms`);
          break;
        }

        case 'verify': {
          const hashString = await input({ message: 'Enter hash string to verify:' });
          if (!hashString.trim()) {
            printError('Hash cannot be empty');
            break;
          }
          const secret = await promptPassword({ message: 'Enter candidate secret:', mask: '*' });
          const res = await verifyDetailed(secret, hashString.trim());
          console.log();
          if (res.valid) {
            printSuccess(`MATCH! Password is valid for this hash (${pc.cyan(res.algorithm)})`);
            console.log(`  ${pc.dim('Verification latency:')} ${res.executionTimeMs} ms`);
          } else {
            printError(`MISMATCH! Password does not match.`);
          }
          break;
        }

        case 'gen-pwd': {
          const length = await number({ message: 'Password length (8 - 128):', default: 16 });
          const pwd = generatePassword({ length });
          console.log();
          printSuccess('Generated CSPRNG password:');
          console.log(`  ${pc.bold(pc.green(pwd))}`);
          break;
        }

        case 'gen-phrase': {
          const words = await number({ message: 'Number of words (3 - 10):', default: 4 });
          const sep = await input({ message: 'Separator character:', default: '-' });
          const phrase = generatePassphrase({ words, separator: sep, capitalize: true, includeNumber: true });
          console.log();
          printSuccess('Generated Diceware Passphrase:');
          console.log(`  ${pc.bold(pc.green(phrase))}`);
          break;
        }

        case 'gen-secret': {
          const format = await select({
            message: 'Secret format:',
            choices: [
              { name: 'Hexadecimal (64 hex characters = 256 bits)', value: 'hex' },
              { name: 'Base64 (URL safe)', value: 'base64url' },
              { name: 'Standard Base64', value: 'base64' },
              { name: 'UUID v4', value: 'uuid' },
            ],
          });
          const generatedVal = generateSecret({ format, bytes: 32 });
          console.log();
          printSuccess(`Generated output (${format}):`);
          process.stdout.write(`  ${pc.bold(pc.green(generatedVal))}\n`);
          break;
        }

        case 'inspect': {
          const hashString = await input({ message: 'Enter hash to inspect:' });
          if (!hashString.trim()) break;
          const report = inspectHash(hashString.trim());
          console.log();
          printSuccess(`Inspection Report for ${pc.bold(report.algorithm)}:`);
          const rows = [
            ['Algorithm', report.algorithm],
            ['Format', report.format],
            ['Security', report.securityRating],
          ];
          if (report.parameters) {
            Object.entries(report.parameters).forEach(([k, v]) => rows.push([k, String(v)]));
          }
          console.log(createTable(['Property', 'Value'], rows));
          if (report.recommendations?.length) {
            console.log(pc.bold('\nRecommendations:'));
            report.recommendations.forEach((r) => console.log(`  ${pc.cyan('•')} ${r}`));
          }
          break;
        }

        case 'detect': {
          const str = await input({ message: 'Enter arbitrary hash or digest:' });
          if (!str.trim()) break;
          const report = detectAlgorithm(str.trim());
          console.log();
          if (!report.identified) {
            printError('Unrecognized format.');
          } else {
            printSuccess(`Found ${report.matches.length} candidate(s):`);
            const rows = report.matches.map((m) => [m.algorithm, m.category, m.secure ? 'YES' : 'NO', m.recommendation]);
            console.log(createTable(['Algorithm', 'Category', 'Safe', 'Assessment'], rows));
          }
          break;
        }

        case 'strength': {
          const secret = await promptPassword({ message: 'Enter password to evaluate:', mask: '*' });
          if (!secret) break;
          const report = analyzeStrength(secret);
          console.log();
          printSuccess(`Strength Score: ${report.score}/4 (${report.label}) | Entropy: ${report.entropyBits} bits`);
          const crackRows = [
            ['Online (100/hr)', report.crackTimes.onlineThrottled],
            ['Offline Slow KDF', pc.green(pc.bold(report.crackTimes.offlineSlowKdf))],
            ['Offline Fast Hash', pc.yellow(report.crackTimes.offlineFastHash)],
          ];
          console.log(createTable(['Scenario', 'Estimated Time'], crackRows));
          break;
        }

        case 'policy': {
          const secret = await promptPassword({ message: 'Enter password to test against policy:', mask: '*' });
          if (!secret) break;
          const res = validatePolicy(secret, { minLength: 12, minEntropy: 50 });
          console.log();
          if (res.compliant) {
            printSuccess('Compliant with standard security policy (length >= 12, mixed classes, entropy >= 50)!');
          } else {
            printError('Violations:');
            res.violations.forEach((v) => console.log(`  ${pc.red('✖')} ${v}`));
          }
          break;
        }

        case 'audit': {
          const filePath = await input({ message: 'Enter file path to audit (e.g. hashes.txt or passwords.csv):' });
          if (!filePath.trim()) break;
          const { auditFile } = await import('../../core/audit/audit.js');
          const report = await auditFile(filePath.trim());
          console.log();
          printSuccess(`Audit complete for ${report.type.toUpperCase()}: Score ${report.score}/100 (Grade ${report.grade})`);
          console.log(`  Total: ${report.total} entries (${report.uniqueCount} unique, ${report.duplicateCount} duplicates)`);
          if (report.type === 'hashes') {
            const rows = Object.entries(report.distribution).map(([a, d]) => [
              pc.bold(a),
              String(d.count),
              `${d.percentage}%`,
              d.secure ? pc.green('SECURE') : pc.red('VULNERABLE'),
            ]);
            console.log(createTable(['Algorithm', 'Count', 'Share', 'Rating'], rows));
          } else {
            console.log(`  Average Entropy: ${report.metrics.averageEntropy} bits | Compliance: ${report.metrics.compliancePercentage}%`);
          }
          break;
        }

        case 'benchmark': {
          printInfo('Running benchmark...');
          const bench = await runBenchmark({ rounds: 2 });
          console.log();
          printSuccess('Benchmark Results:');
          const rows = bench.benchmarks.map((b) => [b.name, `${b.avgMs} ms`, `${b.hashesPerSec} hashes/s`]);
          console.log(createTable(['Algorithm', 'Latency', 'Throughput'], rows));
          console.log(`\n  ${pc.green('✔')} ${bench.recommendation}`);
          break;
        }

        case 'exit':
          keepRunning = false;
          printInfo('Goodbye!');
          break;
      }
    } catch (err) {
      printError(err.message);
    }
  }
}

import { Command } from 'commander';
import { hashCommand } from './commands/hash.js';
import { verifyCommand } from './commands/verify.js';
import { generateCommand } from './commands/generate.js';
import { inspectCommand } from './commands/inspect.js';
import { detectCommand } from './commands/detect.js';
import { strengthCommand } from './commands/strength.js';
import { policyCommand } from './commands/policy.js';
import { benchmarkCommand } from './commands/benchmark.js';
import { interactiveCommand } from './commands/interactive.js';

export function createCli() {
  const program = new Command();

  program
    .name('coffrepass')
    .description('Professional cryptographic password hashing, verification, inspection and CSPRNG security suite. Compatible with PHP >= 8.2 & Python.')
    .version('1.0.0');

  // 1. Hash command
  program
    .command('hash [secret]')
    .description('Hash a secret using Argon2id, Argon2i, Bcrypt, or Scrypt')
    .option('-a, --algo <algorithm>', 'Cryptographic algorithm (argon2id, argon2i, bcrypt, scrypt)', 'argon2id')
    .option('-c, --cost <cost>', 'Bcrypt cost factor (4-16)', '12')
    .option('-m, --memory <kib>', 'Argon2 memory cost in KiB (default: 65536 = 64 MiB)')
    .option('-t, --time <iterations>', 'Argon2 iteration count (timeCost)')
    .option('-p, --threads <threads>', 'Argon2 parallelism / lanes')
    .option('--prefix <prefix>', 'Bcrypt prefix: 2b (standard) or 2y (PHP compatibility)', '2b')
    .option('--json', 'Output results in JSON format')
    .action(hashCommand);

  // 2. Verify command
  program
    .command('verify [arg1] [arg2]')
    .description('Verify a secret against a hash (Argon2, Bcrypt $2y/$2b, Scrypt)')
    .option('--json', 'Output results in JSON format')
    .action(verifyCommand);


  // 3. Generate command
  program
    .command('generate')
    .alias('gen')
    .description('Generate strong CSPRNG passwords, Diceware passphrases, or API secrets')
    .option('-l, --length <len>', 'Password length (8-256)', '16')
    .option('-w, --words <words>', 'Passphrase word count (3-12)', '4')
    .option('--passphrase', 'Generate Diceware passphrase instead of random password')
    .option('-s, --separator <sep>', 'Passphrase separator character', '-')
    .option('--capitalize', 'Capitalize each word in passphrase')
    .option('--number', 'Include a number in passphrase')
    .option('--avoid-ambiguous', 'Omit ambiguous characters (0, O, 1, l, I)')
    .option('--secret', 'Generate cryptographic API/HMAC secret token')
    .option('--format <format>', 'Secret format: hex, base64, base64url, uuid', 'hex')
    .option('--bytes <bytes>', 'Secret length in bytes (default: 32 = 256 bits)', '32')
    .option('--json', 'Output results in JSON format')
    .action(generateCommand);

  // 4. Inspect command
  program
    .command('inspect <hash>')
    .description('Deeply inspect a hash string to extract parameters and security rating')
    .option('--json', 'Output results in JSON format')
    .action(inspectCommand);

  // 5. Detect command
  program
    .command('detect <hash>')
    .description('Heuristically detect the algorithm of an unknown hash or digest')
    .option('--json', 'Output results in JSON format')
    .action(detectCommand);

  // 6. Strength command
  program
    .command('strength [secret]')
    .description('Analyze password entropy and estimate brute-force cracking times')
    .option('--json', 'Output results in JSON format')
    .action(strengthCommand);

  // 7. Policy command
  program
    .command('policy [secret]')
    .description('Validate a password against security policy rules')
    .option('--min-length <n>', 'Minimum password length', '12')
    .option('--max-length <n>', 'Maximum password length', '128')
    .option('--no-upper', 'Do not require uppercase letters')
    .option('--no-lower', 'Do not require lowercase letters')
    .option('--no-digits', 'Do not require numbers')
    .option('--no-symbols', 'Do not require special symbols')
    .option('--min-entropy <n>', 'Minimum Shannon entropy in bits', '50')
    .option('--forbidden <words>', 'Comma-separated forbidden words')
    .option('--json', 'Output results in JSON format')
    .action(policyCommand);

  // 8. Benchmark command
  program
    .command('benchmark')
    .description('Benchmark cryptographic hashing performance on current hardware')
    .option('-r, --rounds <n>', 'Rounds per benchmark test', '3')
    .option('--json', 'Output results in JSON format')
    .action(benchmarkCommand);

  // 9. Interactive command
  program
    .command('interactive')
    .alias('i')
    .description('Launch interactive menu mode')
    .action(interactiveCommand);

  return program;
}

export async function runCli(argv = process.argv) {
  const normalizedArgv = [...argv];

  // If user calls with flag syntax like coffrepass --verify ..., normalize to subcommand
  if (normalizedArgv[2]?.startsWith('--') && normalizedArgv[2] !== '--help' && normalizedArgv[2] !== '--version') {
    const flag = normalizedArgv[2].slice(2);
    const aliases = {
      verify: 'verify',
      hash: 'hash',
      generate: 'generate',
      gen: 'generate',
      inspect: 'inspect',
      detect: 'detect',
      strength: 'strength',
      policy: 'policy',
      benchmark: 'benchmark',
      interactive: 'interactive',
    };
    if (aliases[flag]) {
      normalizedArgv[2] = aliases[flag];
    }
  }

  const program = createCli();

  // If no arguments provided in interactive TTY terminal, launch interactive mode
  if (normalizedArgv.length <= 2) {
    if (process.stdin.isTTY && process.stdout.isTTY) {
      return interactiveCommand();
    }
    return program.help();
  }

  return program.parseAsync(normalizedArgv);
}

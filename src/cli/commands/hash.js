import pc from 'picocolors';
import { hash } from '../../core/hash/index.js';
import { getSecretInput } from '../ui/prompts.js';
import { outputResult, printSuccess, printError, handleCommandError } from '../ui/formatters.js';
import { EXIT_CODES } from '../ui/exit-codes.js';

export async function hashCommand(secretArg, options) {
  try {
    const secret = await getSecretInput(secretArg, {
      message: 'Enter secret to hash (masked):',
    });

    if (!secret) {
      printError('Cannot hash an empty secret');
      process.exit(EXIT_CODES.INVALID_USAGE);
    }

    const algo = (options.algo || 'argon2id').toLowerCase();
    const hashOpts = {
      algorithm: algo,
      cost: options.cost ? Number(options.cost) : undefined,
      memoryCost: options.memory ? Number(options.memory) : undefined,
      timeCost: options.time ? Number(options.time) : undefined,
      parallelism: options.threads ? Number(options.threads) : undefined,
      prefix: options.prefix,
    };

    const result = await hash(secret, hashOpts);

    outputResult(result, options.json, () => {
      console.log();
      printSuccess(`Hashed with ${pc.bold(pc.cyan(result.algorithm))}:`);
      console.log(`  ${pc.bold(pc.green(result.hash))}`);
      console.log();
      console.log(`  ${pc.dim('Execution time:')} ${result.executionTimeMs} ms`);
      if (result.parameters) {
        console.log(`  ${pc.dim('Parameters:')}     ${JSON.stringify(result.parameters)}`);
      }
      if (result.algorithm === 'argon2id') {
        console.log(`  ${pc.dim('Compatibility:')}  PHP 8.2+ ($argon2id$), Python argon2-cffi, Node.js`);
      } else if (result.algorithm === 'bcrypt') {
        console.log(`  ${pc.dim('Compatibility:')}  PHP 8.2+ ($2y$/$2b$), Python bcrypt, Node.js`);
      }
      console.log();
    });

    process.exit(EXIT_CODES.SUCCESS);
  } catch (err) {
    handleCommandError(err, options.json);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

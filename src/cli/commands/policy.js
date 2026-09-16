import pc from 'picocolors';
import { validatePolicy } from '../../core/password/policy.js';
import { getSecretInput } from '../ui/prompts.js';
import { outputResult, printSuccess, printError, printWarning, handleCommandError } from '../ui/formatters.js';
import { EXIT_CODES } from '../ui/exit-codes.js';

export async function policyCommand(secretArg, options) {
  try {
    const secret = await getSecretInput(secretArg, {
      message: 'Enter candidate text to check policy (masked):',
    });

    const policy = {
      minLength: options.minLength ? Number(options.minLength) : 12,
      maxLength: options.maxLength ? Number(options.maxLength) : 128,
      requireUppercase: options.upper !== false,
      requireLowercase: options.lower !== false,
      requireNumbers: options.digits !== false,
      requireSymbols: options.symbols !== false,
      minEntropy: options.minEntropy ? Number(options.minEntropy) : 50,
      forbiddenWords: options.forbidden ? options.forbidden.split(',') : [],
    };

    const result = validatePolicy(secret, policy);

    outputResult(result, options.json, () => {
      console.log();
      if (result.compliant) {
        printSuccess('Input is COMPLIANT with security policy!');
        console.log(`  Length: ${result.details.length} chars | Entropy: ${result.details.entropyBits} bits`);
      } else {
        printWarning('Input VIOLATES security policy:');
        result.violations.forEach((v) => {
          console.log(`  ${pc.red('✖')} ${v}`);
        });
      }
      console.log();
    });

    process.exit(result.compliant ? EXIT_CODES.SUCCESS : EXIT_CODES.POLICY_VIOLATION);
  } catch (err) {
    handleCommandError(err, options.json);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

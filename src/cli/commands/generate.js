import pc from 'picocolors';
import { generatePassword, generatePassphrase } from '../../core/password/generate.js';
import { generateSecret } from '../../core/secret/generate.js';
import { calculateEntropy } from '../../core/password/strength.js';
import { outputResult, printSuccess, printError, handleCommandError } from '../ui/formatters.js';
import { EXIT_CODES } from '../ui/exit-codes.js';

export async function generateCommand(options) {
  try {
    let result = {};

    if (options.secret) {
      const generatedToken = generateSecret({
        bytes: options.bytes ? Number(options.bytes) : 32,
        format: options.format || 'hex',
      });
      result = {
        type: 'secret',
        format: options.format || 'hex',
        value: generatedToken,
      };

      outputResult(result, options.json, () => {
        console.log();
        printSuccess(`Generated Cryptographic Secret (${pc.cyan(result.format)}):`);
        process.stdout.write(`  ${pc.bold(pc.green(result.value))}\n`);
        console.log();
      });
    } else if (options.passphrase) {
      const phrase = generatePassphrase({
        words: options.words ? Number(options.words) : 4,
        separator: options.separator ?? '-',
        capitalize: Boolean(options.capitalize),
        includeNumber: Boolean(options.number),
      });
      const entropy = calculateEntropy(phrase);
      result = {
        type: 'passphrase',
        value: phrase,
        words: options.words ? Number(options.words) : 4,
        entropyBits: entropy,
      };

      outputResult(result, options.json, () => {
        console.log();
        printSuccess(`Generated Diceware Passphrase:`);
        process.stdout.write(`  ${pc.bold(pc.green(result.value))}\n`);
        console.log(`  ${pc.dim('Estimated Entropy:')} ${result.entropyBits} bits`);
        console.log();
      });
    } else {
      const generatedText = generatePassword({
        length: options.length ? Number(options.length) : 16,
        avoidAmbiguous: Boolean(options.avoidAmbiguous),
      });
      const entropy = calculateEntropy(generatedText);
      result = {
        type: 'password',
        value: generatedText,
        length: generatedText.length,
        entropyBits: entropy,
      };

      outputResult(result, options.json, () => {
        console.log();
        printSuccess(`Generated CSPRNG String:`);
        process.stdout.write(`  ${pc.bold(pc.green(result.value))}\n`);
        console.log(`  ${pc.dim('Length:')} ${result.length} characters | ${pc.dim('Entropy:')} ${result.entropyBits} bits`);
        console.log();
      });
    }

    process.exit(EXIT_CODES.SUCCESS);
  } catch (err) {
    handleCommandError(err, options.json);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

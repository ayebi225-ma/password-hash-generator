import pc from 'picocolors';
import { input, password as promptPassword } from '@inquirer/prompts';
import { verifyDetailed } from '../../core/verify/index.js';
import { outputResult, printSuccess, printError, handleCommandError } from '../ui/formatters.js';
import { EXIT_CODES } from '../ui/exit-codes.js';

/**
 * Step-by-step verification command:
 * 1. Prompt for hash (paste directly without worrying about bash quotes)
 * 2. Prompt for password (masked input)
 * 3. Verify in constant time and display result
 */
export async function verifyCommand(arg1, arg2, options = {}) {
  try {
    let secretArg;
    let hashString;

    if (arg1 && arg2) {
      // Both arguments provided directly via CLI
      if (arg1.startsWith('$') && !arg2.startsWith('$')) {
        hashString = arg1;
        secretArg = arg2;
      } else {
        secretArg = arg1;
        hashString = arg2;
      }
    } else if (arg1) {
      // Single argument provided via CLI
      if (arg1.startsWith('$') || /^[a-fA-F0-9]{32,128}$/.test(arg1)) {
        hashString = arg1;
      } else {
        secretArg = arg1;
      }
    }

    // Step 1: Request hash if missing
    if (!hashString) {
      if (process.stdin.isTTY) {
        hashString = await input({
          message: 'Étape 1/2 • Collez le hash à vérifier (ex: $argon2id$... ou $2y$...) :',
          validate: (val) => (val && val.trim().length > 0 ? true : 'Veuillez coller un hash non vide.'),
        });
      } else {
        printError('Le hash est requis : coffrepass verify [secret] <hash>');
        process.exit(EXIT_CODES.INVALID_USAGE);
      }
    }

    const cleanHash = hashString ? hashString.trim() : '';
    if (!cleanHash) {
      printError('Le hash ne peut pas être vide');
      process.exit(EXIT_CODES.INVALID_USAGE);
    }

    // Step 2: Request secret if missing
    let secret = secretArg;
    if (secret === undefined || secret === null || secret === '') {
      if (process.stdin.isTTY) {
        secret = await promptPassword({
          message: 'Étape 2/2 • Entrez le mot de passe en clair (masqué) :',
          mask: '*',
        });
      } else {
        // Read piped stdin if available
        const chunks = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        secret = Buffer.concat(chunks).toString('utf-8').replace(/\r?\n$/, '');
      }
    }

    if (secret === undefined || secret === null) {
      printError('Le mot de passe ne peut pas être vide');
      process.exit(EXIT_CODES.INVALID_USAGE);
    }

    // Step 3: Constant-time verification
    const result = await verifyDetailed(secret, cleanHash);

    outputResult(result, options.json, () => {
      console.log();
      if (result.valid) {
        printSuccess(pc.bold(pc.green(`CORRESPONDANCE CONFIRMÉE !`)) + ` Le mot de passe correspond au hash (${pc.cyan(result.algorithm)}).`);
        console.log(`  ${pc.dim('Temps de vérification :')} ${result.executionTimeMs} ms`);
        console.log(`  ${pc.dim('Protection :')} Temps constant (timingSafeEqual) validé.`);
      } else {
        printError(pc.bold(pc.red(`ÉCHEC DE CORRESPONDANCE !`)) + ` Le mot de passe ne correspond PAS à ce hash.`);
        if (result.algorithm !== 'unknown') {
          console.log(`  ${pc.dim('Algorithme détecté :')} ${result.algorithm}`);
        }
      }
      console.log();
    });

    process.exit(result.valid ? EXIT_CODES.SUCCESS : EXIT_CODES.VERIFY_MISMATCH);
  } catch (err) {
    handleCommandError(err, options.json);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

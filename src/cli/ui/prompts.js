import { password as promptPassword } from '@inquirer/prompts';

/**
 * Safely acquire a secret from argument, stdin pipe, or masked interactive prompt
 *
 * @param {string|undefined} secretArg - Argument passed on CLI (if any)
 * @param {Object} [options={}]
 * @param {string} [options.message='Enter secret (masked):'] - Interactive prompt message
 * @param {boolean} [options.allowEmpty=false] - Whether empty inputs are allowed
 * @returns {Promise<string>}
 */
export async function getSecretInput(secretArg, options = {}) {
  // 1. Direct argument provided
  if (secretArg !== undefined && secretArg !== null && secretArg !== '') {
    return String(secretArg);
  }

  // 2. Piped stdin (e.g. echo "secret" | coffrepass hash)
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const piped = Buffer.concat(chunks).toString('utf-8').replace(/\r?\n$/, '');
    if (piped.length > 0 || options.allowEmpty) {
      return piped;
    }
  }

  // 3. Interactive TTY masked prompt
  const message = options.message || 'Enter secret (masked):';
  const secret = await promptPassword({
    message,
    mask: '*',
  });

  return secret;
}

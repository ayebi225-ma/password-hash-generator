import pc from 'picocolors';
import Table from 'cli-table3';

export const BANNER = `
  ${pc.cyan('╔═══════════════════════════════════════════════════════════╗')}
  ${pc.cyan('║')}   ${pc.bold(pc.green('COFFREPASS'))} ${pc.gray('•')} ${pc.white('Cryptographic Security & Password Suite')}    ${pc.cyan('║')}
  ${pc.cyan('║')}   ${pc.dim('Cross-compatible with PHP >= 8.2 & Python (Argon2/Bcrypt)')}  ${pc.cyan('║')}
  ${pc.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

export function printBanner() {
  console.log(BANNER);
}

export function printSuccess(message) {
  console.log(`${pc.green('✔')} ${message}`);
}

export function printError(message) {
  console.error(`${pc.red('✖')} ${message}`);
}

export function printWarning(message) {
  console.warn(`${pc.yellow('⚠')} ${message}`);
}

export function printInfo(message) {
  console.log(`${pc.blue('ℹ')} ${message}`);
}

/**
 * Render a formatted CLI table
 * @param {string[]} headers
 * @param {Array<Array<string>>} rows
 * @returns {string}
 */
export function createTable(headers, rows) {
  const table = new Table({
    head: headers.map((h) => pc.cyan(pc.bold(h))),
    style: { head: [], border: ['grey'] },
  });

  rows.forEach((row) => table.push(row));
  return table.toString();
}

export function outputResult(data, isJson, humanRenderer) {
  if (isJson) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else {
    humanRenderer();
  }
}

export function handleCommandError(err, isJson) {
  const errMsg = err?.message || 'Operation failed';
  if (isJson) {
    process.stdout.write(JSON.stringify({ status: 'error', message: errMsg }) + '\n');
  } else {
    printError(errMsg);
  }
}



import pc from 'picocolors';
import { analyzeStrength } from '../../core/password/strength.js';
import { getSecretInput } from '../ui/prompts.js';
import { outputResult, printSuccess, printError, createTable, handleCommandError } from '../ui/formatters.js';
import { EXIT_CODES } from '../ui/exit-codes.js';

export async function strengthCommand(secretArg, options) {
  try {
    const secret = await getSecretInput(secretArg, {
      message: 'Enter input text to test strength (masked):',
    });

    if (!secret) {
      printError('Cannot analyze empty input');
      process.exit(EXIT_CODES.INVALID_USAGE);
    }

    const report = analyzeStrength(secret);

    outputResult(report, options.json, () => {
      console.log();
      printSuccess(`Cryptographic Strength Analysis:`);
      console.log();

      const scoreColors = [
        pc.red('0/4 (Very Weak)'),
        pc.red('1/4 (Weak)'),
        pc.yellow('2/4 (Medium)'),
        pc.green('3/4 (Strong)'),
        pc.green(pc.bold('4/4 (Very Strong)')),
      ];

      const scoreDisplay = scoreColors[report.score] || `${report.score}/4`;

      console.log(`  ${pc.bold('Overall Score:')}   ${scoreDisplay}`);
      console.log(`  ${pc.bold('Entropy:')}         ${pc.cyan(report.entropyBits)} bits`);
      console.log(`  ${pc.bold('Length:')}          ${report.length} characters`);
      console.log();

      const crackRows = [
        ['Online Throttled (100 tries/hr)', report.crackTimes.onlineThrottled],
        ['Online Unthrottled (1k tries/sec)', report.crackTimes.onlineUnthrottled],
        ['Offline Slow KDF (Argon2id/Bcrypt 12)', pc.green(pc.bold(report.crackTimes.offlineSlowKdf))],
        ['Offline Fast Hash (MD5/SHA GPU cluster)', pc.yellow(report.crackTimes.offlineFastHash)],
      ];

      console.log(pc.bold('Estimated Brute-Force Crack Times:'));
      console.log(createTable(['Attack Vector Scenario', 'Estimated Time to Crack'], crackRows));

      if (report.weaknesses.length > 0) {
        console.log();
        console.log(pc.bold(pc.yellow('Identified Weaknesses:')));
        report.weaknesses.forEach((w) => {
          console.log(`  ${pc.yellow('•')} ${w}`);
        });
      }

      console.log();
      console.log(`  ${pc.dim('Recommendation:')} ${report.recommendation}`);
      console.log();
    });

    process.exit(EXIT_CODES.SUCCESS);
  } catch (err) {
    handleCommandError(err, options.json);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

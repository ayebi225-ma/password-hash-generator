import pc from 'picocolors';
import { inspectHash } from '../../core/inspect/inspect.js';
import { outputResult, printSuccess, printError, createTable, handleCommandError } from '../ui/formatters.js';
import { EXIT_CODES } from '../ui/exit-codes.js';

export async function inspectCommand(hashString, options) {
  try {
    if (!hashString || !hashString.trim()) {
      printError('A hash string is required: coffrepass inspect <hash>');
      process.exit(EXIT_CODES.INVALID_USAGE);
    }

    const report = inspectHash(hashString);

    outputResult(report, options.json, () => {
      console.log();
      printSuccess(`Cryptographic Inspection Report:`);
      console.log();

      const ratingColors = {
        secure: pc.green(pc.bold('SECURE')),
        acceptable: pc.yellow(pc.bold('ACCEPTABLE')),
        weak: pc.red(pc.bold('WEAK')),
        insecure: pc.red(pc.bold('INSECURE / DANGEROUS')),
      };

      const tableRows = [
        ['Algorithm', pc.bold(report.algorithm.toUpperCase())],
        ['Format', report.format],
        ['Security Rating', ratingColors[report.securityRating] || report.securityRating],
      ];

      if (report.parameters) {
        Object.entries(report.parameters).forEach(([k, v]) => {
          tableRows.push([`Param: ${k}`, String(v)]);
        });
      }

      if (report.salt) {
        tableRows.push(['Salt (extracted)', report.salt]);
      }

      console.log(createTable(['Property', 'Value'], tableRows));

      if (report.recommendations && report.recommendations.length > 0) {
        console.log();
        console.log(pc.bold('Recommendations:'));
        report.recommendations.forEach((rec) => {
          console.log(`  ${pc.cyan('•')} ${rec}`);
        });
      }

      if (report.compatibility) {
        console.log();
        console.log(pc.bold('Interoperability:'));
        Object.entries(report.compatibility).forEach(([env, note]) => {
          console.log(`  ${pc.magenta(env.toUpperCase())}: ${pc.dim(note)}`);
        });
      }
      console.log();
    });

    process.exit(EXIT_CODES.SUCCESS);
  } catch (err) {
    handleCommandError(err, options.json);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

import pc from 'picocolors';
import { detectAlgorithm } from '../../core/inspect/detect.js';
import { outputResult, printSuccess, printError, createTable, handleCommandError } from '../ui/formatters.js';
import { EXIT_CODES } from '../ui/exit-codes.js';

export async function detectCommand(hashString, options) {
  try {
    if (!hashString || !hashString.trim()) {
      printError('A hash string or digest is required: coffrepass detect <hash>');
      process.exit(EXIT_CODES.INVALID_USAGE);
    }

    const report = detectAlgorithm(hashString);

    outputResult(report, options.json, () => {
      console.log();
      if (!report.identified) {
        printError('Could not identify hash algorithm signature.');
        console.log(`  Input length: ${hashString.length} characters`);
        console.log();
        return;
      }

      printSuccess(`Identified ${report.matches.length} candidate algorithm(s):`);
      console.log();

      const rows = report.matches.map((m) => [
        pc.bold(m.algorithm),
        m.category,
        m.secure ? pc.green('YES') : pc.red('NO (Vulnerable)'),
        m.recommendation,
      ]);

      console.log(createTable(['Algorithm Candidate', 'Category', 'Secure', 'Assessment'], rows));
      console.log();
    });

    process.exit(EXIT_CODES.SUCCESS);
  } catch (err) {
    handleCommandError(err, options.json);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { input } from '@inquirer/prompts';
import { auditFile, auditHashes, auditPasswords, detectContentType } from '../../core/audit/audit.js';
import { outputResult, printSuccess, printError, printWarning, printInfo, createTable, handleCommandError } from '../ui/formatters.js';
import { EXIT_CODES } from '../ui/exit-codes.js';

export async function auditCommand(fileArg, options = {}) {
  try {
    let filePath = fileArg;

    // Handle piped stdin vs file path
    let report;
    if (!filePath && !process.stdin.isTTY) {
      // Read lines from piped stdin
      const chunks = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      const rawText = Buffer.concat(chunks).toString('utf-8');
      const lines = rawText.split(/\r?\n/).filter(Boolean);

      const forcedType = options.hashes ? 'hashes' : options.passwords ? 'passwords' : undefined;
      const contentType = forcedType || detectContentType(lines.slice(0, 20));

      if (contentType === 'passwords') {
        report = auditPasswords(lines, options);
      } else {
        report = auditHashes(lines, options);
      }
    } else {
      if (!filePath) {
        if (process.stdin.isTTY) {
          filePath = await input({
            message: 'Entrez le chemin du fichier à auditer (txt, csv, json) :',
            validate: (val) => (val && val.trim().length > 0 ? true : 'Chemin requis.'),
          });
        } else {
          printError('Chemin de fichier requis : coffrepass audit <fichier>');
          process.exit(EXIT_CODES.INVALID_USAGE);
        }
      }

      const resolvedPath = path.resolve(filePath.trim());
      const forcedType = options.hashes ? 'hashes' : options.passwords ? 'passwords' : undefined;
      report = await auditFile(resolvedPath, { ...options, type: forcedType });
    }

    // Export report if --report was provided
    if (options.report) {
      const outPath = path.resolve(options.report);
      const ext = path.extname(outPath).toLowerCase();
      if (ext === '.csv') {
        let csvContent = '';
        if (report.type === 'hashes') {
          csvContent = 'Item,Algorithm,Rating,Secure\n';
          report.sampleItems.forEach((it) => {
            csvContent += `"${it.hash}","${it.algorithm}","${it.rating}",${it.secure}\n`;
          });
        } else {
          csvContent = 'Entry,Length,EntropyBits,Score,Compliant\n';
          report.sampleItems.forEach((it) => {
            csvContent += `"${it.masked}",${it.length},${it.entropyBits},${it.score},${it.compliant}\n`;
          });
        }
        fs.writeFileSync(outPath, csvContent, 'utf-8');
      } else {
        fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
      }
    }

    outputResult(report, options.json, () => {
      console.log();
      printSuccess(pc.bold(`Rapport d'Audit de Sécurité (${report.type.toUpperCase()}) :`));
      console.log();

      const gradeColors = {
        A: pc.green(pc.bold('A (Excellent)')),
        B: pc.cyan(pc.bold('B (Bon)')),
        C: pc.yellow(pc.bold('C (Moyen)')),
        D: pc.red(pc.bold('D (Insuffisant)')),
        F: pc.red(pc.bold('F (Critique)')),
      };

      console.log(`  ${pc.bold('Score Global :')}     ${gradeColors[report.grade] || report.grade} (${report.score}/100)`);
      console.log(`  ${pc.bold('Total Analysé :')}    ${report.total} entrées (${report.uniqueCount} uniques, ${report.duplicateCount} doublons)`);
      console.log();

      if (report.type === 'hashes') {
        const distRows = Object.entries(report.distribution).map(([algo, data]) => [
          pc.bold(algo),
          String(data.count),
          `${data.percentage}%`,
          data.secure ? pc.green('SÉCURISÉ') : pc.red('VULNÉRABLE'),
        ]);

        console.log(pc.bold('Répartition des Algorithmes :'));
        console.log(createTable(['Algorithme', 'Nombre', 'Part', 'Niveau'], distRows));
        console.log();

        if (report.vulnerabilities.length > 0) {
          console.log(pc.bold(pc.red(`Vulnérabilités Détectées (${report.vulnerabilities.length}) :`)));
          report.vulnerabilities.slice(0, 5).forEach((v) => {
            console.log(`  ${pc.red('✖')} [${pc.bold(v.severity)}] ${v.message}`);
          });
          if (report.vulnerabilities.length > 5) {
            console.log(`  ${pc.dim(`... et ${report.vulnerabilities.length - 5} autre(s) vulnérabilité(s).`)}`);
          }
          console.log();
        }
      } else {
        const metricsRows = [
          ['Entropie Moyenne', `${report.metrics.averageEntropy} bits`],
          ['Longueur Moyenne', `${report.metrics.averageLength} caractères`],
          ['Conformité Politique', `${report.metrics.compliancePercentage}% (${report.metrics.compliantCount}/${report.total})`],
        ];

        console.log(pc.bold('Métriques de Robustesse :'));
        console.log(createTable(['Critère', 'Valeur'], metricsRows));
        console.log();
      }

      if (report.recommendations.length > 0) {
        console.log(pc.bold('Recommandations :'));
        report.recommendations.forEach((r) => console.log(`  ${pc.cyan('•')} ${r}`));
        console.log();
      }

      if (options.report) {
        printInfo(`Rapport complet exporté avec succès vers : ${pc.bold(options.report)}`);
        console.log();
      }
    });

    // Exit code 0 if healthy, 1 if critical vulnerabilities were found
    const hasCritical = report.type === 'hashes' ? report.summary.vulnerable > 0 : report.metrics.compliancePercentage < 50;
    process.exit(hasCritical ? EXIT_CODES.GENERAL_ERROR : EXIT_CODES.SUCCESS);
  } catch (err) {
    handleCommandError(err, options.json);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

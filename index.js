#!/usr/bin/env node
const stableStringify = require('json-stable-stringify');
const { logger } = require('lognographer');
const program = require('commander');
const JSON5 = require('json5');
const path = require('path');
const fs = require('fs');

const { generateReport } = require('./src/js/report');
const { asyncExec } = require('./src/js/exec');
const { version } = require('./package.json');

// Parse options and provide helper text
program
  .version(version)
  .option('-v, --verbose', 'Show debug output')
  .option('-w, --overwrite', 'Overwrite the existing package.json')
  .option('-s, --silent', 'Silence all logging')
  .option('-r --report', 'Generate a log of which modules were updated')
  .option('-u --upgrade', 'Run npm install after updating the package.json')
  .option('-a --runAudit', 'Generate an audit report')
  .option('-f --saveReportToFile', 'Save the report to file: updatedModules.html')
  .option('-x --fixAudit', 'Run fix audit')
  .parse(process.argv);

const {
  verbose, silent, report: reportFlag, saveReportToFile,
  overwrite: overwriteFlag, upgrade, runAudit: runAuditFlag, fixAudit,
} = program;

// We can't upgrade of fixAudit unless overwrite is selected
const overwrite = upgrade || fixAudit || overwriteFlag;

// If we're gonna fix the audit, we've got to run the audit
const runAudit = runAuditFlag || fixAudit;

// If the save to file flag is on, we've got to generate a report
const report = reportFlag || saveReportToFile || runAuditFlag;

if (verbose && !silent) {
  logger.debug(`Settings
       • verbose:                  ${verbose ? 'yes' : 'nope'}
       • overwrite:                ${overwrite ? 'yes' : 'nope'}
       • install new modules:      ${overwrite && upgrade ? 'yes' : 'nope'}
       • run audit:                ${runAudit ? 'yes' : 'nope'}
       • fix audit:                ${runAudit && fixAudit ? 'yes' : 'nope'}
       • generate report:          ${report ? 'yes' : 'nope'}
       • do what with report:      ${saveReportToFile ? 'save it' : 'print it'}
  `);
}

/**
 *  Command-line utility to upgrade all modules not explicitly versioned in the
 *  companion fixedModules.json file
 */

const parentDir = process.cwd(); // gets the directory where command was executed
let fixedModules = { dependencies: {}, devDependencies: {} };

const currentPackage = JSON.parse(fs.readFileSync(path.join(parentDir, 'package.json'), 'utf8'));
const fixedModulePath = path.join(parentDir, 'fixedModules');
if (fs.existsSync(`${fixedModulePath}.json`) || fs.existsSync(`${fixedModulePath}.json5`)) {
  const isJSON5 = !!fs.existsSync(`${fixedModulePath}.json5`);
  fixedModules = isJSON5
    ? JSON5.parse(fs.readFileSync(`${fixedModulePath}.json5`, 'utf8'))
    : JSON.parse(fs.readFileSync(`${fixedModulePath}.json`, 'utf8'));
}

const filterIgnoredModules = (deps) => {
  const newDeps = {};
  Object.keys(deps).forEach((moduleName) => {
    const value = deps[moduleName];
    if (value !== '*') {
      newDeps[moduleName] = value;
    }
  });
  return newDeps;
};

const getAuditResults = async (when) => {
  let audit = '{}';
  try {
    logger.info(`running '${when}' security review`);
    const auditResults = await asyncExec('npm audit --json');
    audit = auditResults.stdout;
  } catch (error) {
    if (error && error.stdout && error.stdout.length) {
      logger.info(`Vulnerabilities found in '${when}'`);
      audit = error.stdout;
    } else {
      logger.info(`Unable to generate audit '${when}':`, error);
    }
  }
  return audit;
};

const getLatest = async (dependencies, fixedDependencies) => {
  const newDependencies = {};
  await Promise.all(Object.keys(dependencies).map(async (dependencyName) => {
    let response = null;
    if (fixedDependencies[dependencyName] === '*') {
      logger.debug(`Updating of ${dependencyName} is set to skip.`);
      newDependencies[dependencyName] = dependencies[dependencyName];
      return;
    }
    try {
      response = await asyncExec(`npm view ${dependencyName} version`);
    } catch (err) {
      if (verbose && !silent) {
        logger.debug(`Unable to find version for package: ${dependencyName}`);
      }
    }
    if (response && response.stdout && response.stdout.length) {
      if (verbose && !silent) {
        logger.debug(`Setting package to latest stable version: { ${dependencyName}: "${response.stdout.replace('\n', '')}" }`);
      }
      newDependencies[dependencyName] = response.stdout.replace('\n', '');
    } else {
      if (verbose && !silent) {
        logger.debug(`Setting to existing package version:
       { ${dependencyName}: "${dependencies[dependencyName]}" }`);
      }
      newDependencies[dependencyName] = dependencies[dependencyName];
    }
  }));
  return newDependencies;
};

const printReport = (text) => {
  logger.info(`\n\n${text}`);
};

const saveReport = (html) => {
  const filePath = path.join(parentDir, 'updatedModules.html');
  fs.writeFileSync(filePath, html);
};

const upgradePackage = async () => {
  if (!silent) {
    logger.info('Retrieving Primary and Dev Dependencies...');
  }

  let latestDevDeps = {};
  let latestDeps = {};
  let auditBefore;

  // retrieve dependencies in parrallel
  await Promise.all(
    [auditBefore = runAudit ? await getAuditResults('before') : '{}'],
    [latestDevDeps = await getLatest(currentPackage.devDependencies, fixedModules.devDependencies)],
    [latestDeps = await getLatest(currentPackage.dependencies, fixedModules.dependencies)],
  );

  const newFixedDevDeps = filterIgnoredModules(fixedModules.devDependencies);
  const newFixedDeps = filterIgnoredModules(fixedModules.dependencies);

  const devDependencies = { ...latestDevDeps, ...newFixedDevDeps };
  const dependencies = { ...latestDeps, ...newFixedDeps };

  // decide wether or not to overwrite the current package or create a package.json.new
  const fileName = `package.json${overwrite ? '' : '.new'}`;
  const newPackagePath = path.join(parentDir, fileName);

  const newPackage = stableStringify({
    ...currentPackage,
    devDependencies,
    dependencies,
  }, { space: 2 });

  fs.writeFile(newPackagePath, newPackage, async (err) => {
    if (err) {
      logger.error(`Problem writing new ${fileName} to:\n      ${newPackagePath}`, err);
      process.exit(1);
    } else {
      if (!silent) {
        logger.info(`New ${fileName} saved to:\n      ${newPackagePath}\n`);
      }

      let auditAfter = '{}';
      let fixReport = '';

      if (overwrite) {
        if (!silent) {
          logger.info('installing new modules');
        }
        if (upgrade) {
          try {
            await asyncExec('npm install');
          } catch (error) {
            logger.error('Failed to install new modules, aborting upgrade.', error);
            process.exit(1);
          }
        }

        if (runAudit) {
          if (fixAudit) {
            if (!silent) {
              logger.info('checking module security');
            }
            try {
              fixReport = (await asyncExec('npm audit fix')).stdout;
            } catch (error) {
              logger.error('Failed to fix node modules, aborting upgrade.', error);
              process.exit(1);
            }
            if (verbose && !silent) {
              logger.info('audit fix result:', fixReport);
            }
          }
          auditAfter = await getAuditResults('after');
        }
      }

      const { html, txt } = report
        ? generateReport(
          currentPackage,
          dependencies,
          devDependencies,
          latestDeps,
          latestDevDeps,
          auditBefore,
          fixReport,
          auditAfter,
        )
        : {};

      if (saveReportToFile) {
        saveReport(html);
      } else if (report) {
        printReport(txt);
      }
    }
  });
};

try {
  upgradePackage();
} catch (err) {
  logger.error('There was a problem upgrading your node modules:', err);
  process.exit(1);
}

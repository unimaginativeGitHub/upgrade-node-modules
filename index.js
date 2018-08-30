#!/usr/bin/env node
const stableStringify = require('json-stable-stringify');
const program = require('commander');
const path = require('path');
const fs = require('fs');

const { generateReport } = require('./src/js/report');
const { logger } = require('./src/js/simpleLogger');
const { asyncExec } = require('./src/js/exec');
const { version } = require('./package.json');

// Parse options and provide helper text
program
  .version(version)
  .option('-v, --verbose', 'Show debug output')
  .option('-w, --overwrite', 'Overwrite the existing package.json')
  .option('-s, --silent', 'Silence all logging')
  .option('-r --report', 'Generate a log of which modules were updated')
  .option('-f --saveReportToFile', 'Save the report to file: updatedModules.html')
  .parse(process.argv);

const {
  verbose, overwrite, silent, report, saveReportToFile,
} = program;

if (verbose && !silent) {
  logger.debug(`Settings
       • verbose:                  ${verbose ? 'yes' : 'nope'}
       • overwrite:                ${overwrite ? 'yes' : 'nope'}
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
const fixedModulePath = path.join(parentDir, 'fixedModules.json');
if (fs.existsSync(fixedModulePath)) {
  fixedModules = JSON.parse(fs.readFileSync(fixedModulePath, 'utf8'));
}

const getLatest = async (dependencies) => {
  const newDependencies = {};
  await Promise.all(Object.keys(dependencies).map(async (dependencyName) => {
    let response = null;
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

  // retrieve dependencies in parrallel
  await Promise.all(
    [latestDevDeps = await getLatest(currentPackage.devDependencies)],
    [latestDeps = await getLatest(currentPackage.dependencies)],
  );

  const devDependencies = { ...latestDevDeps, ...fixedModules.devDependencies };
  const dependencies = { ...latestDeps, ...fixedModules.dependencies };

  // decide wether or not to overwrite the current package or create a package.json.new
  const fileName = `package.json${overwrite ? '' : '.new'}`;
  const newPackagePath = path.join(parentDir, fileName);

  const newPackage = stableStringify({
    ...currentPackage,
    devDependencies,
    dependencies,
  }, { space: 2 });

  fs.writeFile(newPackagePath, newPackage, (err) => {
    if (err) {
      logger.error(`Problem writing new ${fileName} to:\n      ${newPackagePath}`, err);
    } else if (!silent) {
      logger.info(`New ${fileName} saved to:\n      ${newPackagePath}\n`);
      const reportText = report
        ? generateReport(currentPackage, dependencies, devDependencies, latestDeps, latestDevDeps)
        : {};
      if (report && saveReportToFile) {
        saveReport(reportText.html);
      } else if (report) {
        printReport(reportText.txt);
      }
    }
  });
};

try {
  upgradePackage();
} catch (err) {
  logger.error('There was a problem upgrading your node modules:', err);
}

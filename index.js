#!/usr/bin/env node
const stableStringify = require('json-stable-stringify');
const Convert = require('ansi-to-html');
const strings = require('node-strings');
const program = require('commander');
const Table = require('easy-table');
const path = require('path');
const fs = require('fs');
const {
  green, yellow, red, magenta,
} = require('chalk');

const convert = new Convert();

const { logger } = require('./src/js/simpleLogger');
const { asyncExec } = require('./src/js/exec');
const { version } = require('./package.json');

const formatHTML = (str) => {
  const fixedText = str.replace(/(?:\r\n|\r|\n)/g, '<br/>');
  const html = convert.toHtml(fixedText).replace(/(?:color:#FFF)/g, 'color:rgb(175,173,36)');
  return `<html><head><style>body a, span, tr, td { white-space: pre; }</style></head><body><font face='courier'><div>${html}</div></font></body></html>`;
};

// Parse options and provide helper text
program
  .version(version)
  .option('-v, --verbose', 'Show debug output')
  .option('-w, --overwrite', 'Overwrite the existing package.json rather then creating a pacakge.json.new file')
  .option('-s, --silent', 'Silence all logging')
  .option('-r --report', 'Generate a log of which modules were updated')
  .option('-f --saveReportToFile', 'Save the report to a file: updatedModules.html (default is to print to command line)')
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

/* eslint-disable import/no-dynamic-require, global-require */
const currentPackage = require(path.join(parentDir, 'package.json'));
try {
  fixedModules = require(path.join(parentDir, 'fixedModules.json'));
} catch (err) {
  if (verbose && !silent) {
    logger.debug('Couldn\'t find a fixedModules file - assuming latest modules desired.');
  }
}
/* eslint-enable import/no-dynamic-require, global-require */

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

const generateReportData = (type, desired, latest) => {
  const data = [];
  Object.keys(currentPackage[type]).forEach((dep) => {
    const currentDependency = currentPackage[type][dep];
    const desiredDependency = desired[dep];
    const latestDependency = latest[dep];
    if (currentDependency !== latestDependency) {
      data.push({
        module: dep,
        current: currentDependency,
        wanted: desiredDependency,
        latest: latestDependency,
        type,
      });
    }
  });
  return data;
};

const prepareReport = (dependencies, devDependencies, latestDeps, latestDevDeps) => {
  const depSummary = generateReportData('dependencies', dependencies, latestDeps);
  const devDepSummary = generateReportData('devDependencies', devDependencies, latestDevDeps);

  const summary = [...depSummary, ...devDepSummary];
  const t = new Table();
  summary.forEach((pkg) => {
    const fixed = pkg.wanted !== pkg.latest;
    t.cell('Package'.underline(), fixed ? yellow(pkg.module) : red(pkg.module));
    t.cell('Current'.underline(), fixed ? yellow(pkg.current) : pkg.current);
    t.cell('Wanted'.underline(), fixed ? yellow(pkg.wanted) : green(pkg.wanted));
    t.cell('Latest'.underline(), magenta(pkg.latest));
    t.cell('Type'.underline(), fixed ? yellow(pkg.type) : pkg.type);
    t.newRow();
  });

  const date = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateString = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`.underline();
  return `${dateString}\n${summary.length ? t : '- no new dependencies -\n'}`;
};

const printReport = (text) => {
  logger.info(`\n\n${text}`);
};

const saveReport = (text) => {
  const filePath = path.join(parentDir, 'updatedModules.html');
  fs.writeFileSync(filePath, formatHTML(text));
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

  const fileName = `package.json${overwrite ? '' : '.new'}`;
  const newPackagePath = path.join(parentDir, fileName);

  const newPackage = stableStringify({
    ...currentPackage,
    devDependencies,
    dependencies,
  }, { space: 2 });

  fs.writeFile(newPackagePath, newPackage, (err) => {
    if (err) {
      logger.error(`Problem writing new ${fileName} to ${newPackagePath}`, err);
    } else if (!silent) {
      logger.info(`New ${fileName} saved to ${newPackagePath}\n`);
      const reportText = report ? prepareReport(dependencies, devDependencies, latestDeps, latestDevDeps) : '';
      if (report && saveReportToFile) {
        saveReport(reportText);
      } else if (report) {
        printReport(reportText);
      }
    }
  });
};

try {
  upgradePackage();
} catch (err) {
  logger.error('There was a problem upgrading your node modules:', err);
}

#!/usr/bin/env node
const stableStringify = require('json-stable-stringify');
const program = require('commander');
const path = require('path');
const fs = require('fs');
const Table = require('easy-table');

const { logger } = require('./src/js/simpleLogger');
const { asyncExec } = require('./src/js/exec');
const { version } = require('./package.json');

// Parse options and provide helper text
program
  .version(version)
  .option('-v, --verbose', 'Show debug output')
  .option('-w, --overwrite', 'Overwrite the existing package.json rather then creating a pacakge.json.new file')
  .option('-s, --silent', 'Silence all logging')
  .option('-r --report', 'Provide a log of which modules were updated')
  .parse(process.argv);

const {
  verbose, overwrite, silent, report,
} = program;

if (verbose && !silent) {
  logger.debug(`Settings
       • verbose:    ${verbose ? 'yes' : 'nope'}
       • overwrite:  ${overwrite ? 'yes' : 'nope'}
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

const reportData = (type, latest) => {
  const data = [];
  Object.keys(currentPackage[type]).forEach((dep) => {
    const currentDependency = currentPackage[type][dep];
    const latestDependency = latest[dep];
    if (currentDependency !== latestDependency) {
      data.push({
        package: dep,
        current: currentDependency,
        latest: latestDependency,
        type,
      });
    }
  });
  return data;
};

const upgradePackage = async () => {
  if (!silent) {
    logger.info('Retrieving Dev Dependencies...');
  }
  const devDependencies = {
    ...(await getLatest(currentPackage.devDependencies)),
    ...fixedModules.devDependencies,
  };

  if (!silent) {
    logger.info('Retrieving Primary Dependencies...');
  }
  const dependencies = {
    ...(await getLatest(currentPackage.dependencies)),
    ...fixedModules.dependencies,
  };

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

      if (report) {
        logger.info('You want to see the report, thank you.');

        const depSummary = reportData('dependencies', dependencies);
        const devDepSummary = reportData('devDependencies', devDependencies);

        const data = [].concat(depSummary, devDepSummary);
        const t = new Table();

        data.forEach((pkg) => {
          t.cell('Package', pkg.package);
          t.cell('Current', pkg.current);
          t.cell('Latest', pkg.latest);
          t.cell('Type', pkg.type);
          t.newRow();
        });

        logger.info(`current ${Object.keys(currentPackage.dependencies)}`);
        logger.info(`\n${t.toString()}`);
      }
    }
  });
};

try {
  upgradePackage();
} catch (err) {
  logger.error('There was a problem upgrading your node modules:', err);
}


/*
const data = [
 { package: name, current: version, latest: version, type: dependencies },
];
*/

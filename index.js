#!/usr/bin/env node
const stableStringify = require('json-stable-stringify');
const program = require('commander');
const path = require('path');
const fs = require('fs');

const { logger } = require('./src/js/simpleLogger');
const { asyncExec } = require('./src/js/exec');
const { version } = require('./package.json');

// Parse options and provide helper text
program
  .version(version)
  .option('-v, --verbose', 'Show debug output')
  .option('-w, --overwrite', 'Overwrite the existing package.json rather then creating a pacakge.json.new file')
  .option('-s, --silent', 'Silence all logging')
  .parse(process.argv);

const { verbose, overwrite, silent } = program;

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
    }
  });
};

try {
  upgradePackage();
} catch (err) {
  logger.error('There was a problem upgrading your node modules:', err);
}

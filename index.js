#!/usr/bin/env node
const stableStringify = require('json-stable-stringify');
const program = require('commander');
const path = require('path');
const fs = require('fs');

const { logger } = require('./simpleLogger');
const { asyncExec } = require('./exec');

program
  .version('0.9.0')
  .option('-w, --overwrite', 'Overwrite the existing package.json rather then creating a pacakge.json.new file')
  .option('-o, --open', 'Open the package.json (and package.json.new if -w option selected)')
  .parse(process.argv);

logger.debug(`overwrite: ${program.overwrite ? 'yes' : 'nope'}, open: ${program.open ? 'yes' : 'nope'}`);

/**
 *  Command-line utility to upgrade all modules not explicitly versioned in the
 *  companion fixedModules.json file
 */

const currentPackage = require('./package.json');
const fixedModules = require('./fixedModules.json');

logger.info('currentPackage', currentPackage);

const getLatest = async (dependencies) => {
  const newDependencies = {};
  await Promise.all(Object.keys(dependencies).map(async (dependencyName) => {
    const response = await asyncExec(`npm view ${dependencyName} version`);
    if (response.stdout && response.stdout.length) {
      logger.debug(`Setting package to latest stable version: { ${dependencyName}: "${response.stdout.replace('\n', '')}"}`);
      newDependencies[dependencyName] = response.stdout.replace('\n', '');
    } else {
      logger.warn(`There was a problem retrieving the latest stable version of ${dependencyName}:`, response.stderr);
      logger.warn(`Setting to existing package version: { ${dependencyName}: "${dependencies[dependencyName]}"}`);
      newDependencies[dependencyName] = dependencies[dependencyName];
    }
  }));
  return newDependencies;
};

const upgradePackage = async () => {
  logger.info('Retrieving Dev Dependencies...');
  const devDependencies = {
    ...(await getLatest(currentPackage.devDependencies)),
    ...fixedModules.devDependencies,
  };

  logger.info('Retrieving Primary Dependencies...');
  const dependencies = {
    ...(await getLatest(currentPackage.dependencies)),
    ...fixedModules.dependencies,
  };

  const newPackagePath = './package.json.new';
  const newPackage = stableStringify({
    ...currentPackage,
    devDependencies,
    dependencies,
  }, { space: 2 });

  fs.writeFile(newPackagePath, newPackage, (err) => {
    if (err) {
      logger.info('Problem writing new package.json', err);
    }
    logger.info('New package.json saved to package.json.new');
  });
};

try {
  upgradePackage();
} catch (err) {
  logger.error('There was a problem upgrading your node modules:', err);
}

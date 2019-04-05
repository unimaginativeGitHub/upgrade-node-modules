const { generateHTML } = require('./html');
const { generateText } = require('./text');

const organizeData = (currentPackage, type, desired, latest) => {
  const data = [];
  Object.keys(currentPackage[type]).forEach((dep) => {
    const currentDependency = currentPackage[type][dep];
    const desiredDependency = desired[dep];
    const latestDependency = latest[dep];
    if (currentDependency !== latestDependency) {
      data.push({
        package: dep,
        current: currentDependency,
        wanted: desiredDependency,
        latest: latestDependency,
        type,
      });
    }
  });
  return data;
};

const generateReport = (
  currentPkg,
  dependencies,
  devDependencies,
  latestDeps,
  latestDevDeps,
  auditBefore,
  fixReport,
  auditAfter,
) => {
  const depSummary = organizeData(currentPkg, 'dependencies', dependencies, latestDeps);
  const devDepSummary = organizeData(currentPkg, 'devDependencies', devDependencies, latestDevDeps);
  const summary = [...depSummary, ...devDepSummary];
  const date = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dateString = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  return {
    txt: generateText(summary, dateString, auditBefore, fixReport, auditAfter),
    html: generateHTML(summary, dateString, auditBefore, fixReport, auditAfter),
  };
};

module.exports = {
  generateReport,
};

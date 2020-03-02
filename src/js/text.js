const {
  green, yellow, red, magenta, underline, blue,
} = require('chalk');

const getColumnWidths = (columns, summary) => {
  const dataKeys = Object.keys(columns);
  const newColumns = { ...columns };
  dataKeys.forEach((next) => {
    newColumns[next].width = next.length;
  });
  summary.forEach((next) => {
    dataKeys.forEach((column) => {
      newColumns[column].width = next[column].length > newColumns[column].width
        ? next[column].length
        : newColumns[column].width;
    });
  });
  dataKeys.forEach((column) => {
    newColumns[column].width += 2; // adding padding
  });
  return newColumns;
};

const extraSpaces = (entry, columnWidth) => ' '.repeat(columnWidth - entry.length);
const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

const formatEntry = ({ respectFixed, color }, entry, isFixed) => {
  switch (respectFixed && isFixed ? 'yellow' : color) {
    case 'yellow': return yellow(entry);
    case 'magenta': return magenta(entry);
    case 'red': return red(entry);
    case 'green': return green(entry);
    default: return entry; // black
  }
};

const formatAuditText = (audit, when) => {
  const rWidth = 12;

  const colorKey = {
    info: (i) => blue(i),
    low: (i) => green(i),
    moderate: (i) => yellow(i),
    high: (i) => magenta(i),
    critical: (i) => red(i),
  };

  const auditText = [];

  auditText.push(underline(when ? `Audit Report: ${when}` : 'Audit Report'));
  auditText.push(underline('Risk') + extraSpaces('Risk', rWidth) + underline('Vulnerabilities'));

  const parsedAudit = JSON.parse(audit);

  if (parsedAudit && parsedAudit.metadata && parsedAudit.metadata.vulnerabilities) {
    const { vulnerabilities } = parsedAudit.metadata;
    Object.keys(vulnerabilities).forEach((r) => {
      const row = colorKey[r](capitalize(r) + extraSpaces(r, rWidth) + vulnerabilities[r]);
      const indicator = vulnerabilities[r] ? ' ⇦' : '';
      auditText.push(row + indicator);
    });
  }

  return auditText.length > 2
    ? `\n${auditText.join('\n')}\n`
    : '';
};

const generateText = (summary, date, auditB, auditFixReport, auditA) => {
  // set header, fixed val respect and color settings
  let columnsProps = {
    package: { header: 'Package', respectFixed: true, color: 'red' },
    current: { header: 'Current', respectFixed: false, color: 'black' },
    wanted: { header: 'Wanted', respectFixed: true, color: 'green' },
    latest: { header: 'Latest', respectFixed: false, color: 'magenta' },
    type: { header: 'Type', respectFixed: true, color: 'black' },
  };
  // parse all the package values and find the longest string in each column - then add a margin
  columnsProps = getColumnWidths(columnsProps, summary);

  let headerRow = '';
  Object.keys(columnsProps).forEach((next) => {
    const { header, width } = columnsProps[next];
    headerRow += underline(header);
    headerRow += extraSpaces(header, width);
  });

  const tableBody = summary.map((pkg) => {
    const isFixed = pkg.wanted !== pkg.latest;
    let entryRow = '';
    Object.keys(columnsProps).forEach((key) => {
      entryRow += formatEntry(columnsProps[key], pkg[key], isFixed);
      entryRow += extraSpaces(pkg[key], columnsProps[key].width);
    });
    return entryRow;
  });

  const reportText = summary.length
    ? `${underline(date)}\n${headerRow}\n${tableBody.join('\n')}\n`
    : `${underline(date)}\n- no new dependencies -\n`;

  const fix = auditFixReport.length ? `\n${underline('Securing modules...')}\n${auditFixReport}` : '';

  if ((auditB && Object.keys(auditB).length) || (auditA && Object.keys(auditA).length)) {
    return `${reportText}${formatAuditText(auditB, 'Before')}${fix}${formatAuditText(auditA, 'After')}`;
  }

  return reportText;
};

module.exports = {
  generateText,
};

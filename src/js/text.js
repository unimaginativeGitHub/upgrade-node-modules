const {
  green, yellow, red, magenta, underline,
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

const formatEntry = ({ respectFixed, color }, entry, isFixed) => {
  switch (respectFixed && isFixed ? 'yellow' : color) {
    case 'yellow': return yellow(entry);
    case 'magenta': return magenta(entry);
    case 'red': return red(entry);
    case 'green': return green(entry);
    default: return entry; // black
  }
};

const generateText = (summary, date) => {
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

  if (summary.length) {
    return `${underline(date)}\n${headerRow}\n${tableBody.join('\n')}\n`;
  }
  return `${underline(date)}\n- no new dependencies -\n`;
};

module.exports = {
  generateText,
};

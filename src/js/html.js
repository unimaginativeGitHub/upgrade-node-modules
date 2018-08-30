const html = contents => `
<!DOCTYPE html>
<html>
  ${contents}
</html>`;

// Header is preset with `code` styling, left justificiation and some simple table styling
const head = () => (`
  <head>
    <style>
      body a, span, td, tr, th {
        white-space: pre;
        text-align: left;
      }
      tr, td, th {
        border-style:hidden;
        padding: 0 20px 0 0;
      }
      table {
        border-style:hidden;
      }
    </style>
  </head>`);

const body = contents => `
  <body>
    <font face='menlo'>
      ${contents}
    </font>
  </body>
`;

// Wraps the supplied contents in a span with the desired color
const color = (contents, colorCode) => `<span style="color:${colorCode}">${contents}</span>`;

// Wraps the supplied contents in a span with underline text decoration
const under = contents => `<span style="text-decoration: underline">${contents}</span>`;

// Table utility methods
const table = contents => `
      <table>
        ${contents}
      </table>`;
const row = contents => `<tr>${contents}</tr>`;
const header = contents => `<th>${under(contents)}</th>`;
const entry = contents => `<td>${contents}</td>`;


const outputHeaderRow = (columnsProps) => {
  let entries = '';
  Object.keys(columnsProps).forEach((next) => {
    entries += header(columnsProps[next].header);
  });
  return row(entries);
};

const formatEntry = ({ respectFixed, color: setColor }, text, isFixed) => {
  const colorToApply = respectFixed && isFixed ? '#F7DC6F' : setColor;
  return entry(color(text, colorToApply));
};

const generateHTML = (summary, date) => {
  // could add an extra check here to see if there are any module changes - build array of not fixed
  const columnsProps = {
    package: { header: 'Package', respectFixed: true, color: '#FF1B1B' },
    current: { header: 'Current', respectFixed: false, color: 'black' },
    wanted: { header: 'Wanted', respectFixed: true, color: '#FF00E4' },
    latest: { header: 'Latest', respectFixed: false, color: '#56CA00' },
    type: { header: 'Type', respectFixed: true, color: 'black' },
  };

  const tableRows = summary.map((pkg) => {
    const isFixed = pkg.wanted !== pkg.latest;
    let entryRow = '';
    Object.keys(columnsProps).forEach((key) => {
      entryRow += formatEntry(columnsProps[key], pkg[key], isFixed);
    });
    return row(entryRow);
  });

  const summaryRows = summary.length ? tableRows.join('\n') : row(entry('- no new dependencies -'));
  const tableBody = table(`
        ${row(header(date))}
        ${outputHeaderRow(columnsProps)}
        ${summaryRows}`);

  return html(`
  ${head()}
  ${body(tableBody)}`);
};

module.exports = {
  generateHTML,
};

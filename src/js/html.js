const html = (contents) => `
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

const body = (contents) => `
  <body>
    <font face='menlo'>
      ${contents}
    </font>
  </body>
`;

// Wraps the supplied contents in a span with the desired color
const color = (contents, colorCode) => `<span style="color:${colorCode}">${contents}</span>`;

// Wraps the supplied contents in a span with underline text decoration
const under = (contents) => `<span style="text-decoration: underline">${contents}</span>`;

// Table utility methods
const table = (contents) => `
      <table>
        ${contents}
      </table>`;
const row = (contents) => `<tr>${contents}</tr>`;
const header = (contents) => `<th>${under(contents)}</th>`;
const entry = (contents) => `<td>${contents}</td>`;


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

const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

const formatAuditHTML = (audit, when) => {
  const colorKey = {
    info: '#56CA00',
    low: '#0000FF',
    moderate: '#F7DC6F',
    high: '#FF00E4',
    critical: '#FF1B1B',
  };

  const parsedAudit = JSON.parse(audit);
  const vulnerabilityRows = [];
  if (parsedAudit && parsedAudit.metadata && parsedAudit.metadata.vulnerabilities) {
    const { vulnerabilities } = parsedAudit.metadata;
    Object.keys(vulnerabilities).forEach((r) => {
      const indicator = vulnerabilities[r] ? ' &#8678;' : '';
      const firstCol = entry(color(capitalize(r), colorKey[r]));
      const secondCol = entry(color(`${vulnerabilities[r]}${indicator}`, colorKey[r]));
      vulnerabilityRows.push(row(firstCol + secondCol));
    });
  }
  return vulnerabilityRows.length
    ? `<br />${table(`
      ${row('')}
      ${row(header(when ? `Audit Report: ${when}` : 'Audit Report'))}
      ${row(header('Risk') + header('Vulnerabilities'))}
      ${vulnerabilityRows.join('\n')}
    `)}`
    : '';
};

const generateHTML = (summary, date, auditB, auditFixReport, auditA) => {
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

  const fix = auditFixReport.length ? `<br /><b>${under('Securing modules...')}</b><br />${auditFixReport.replace('\n', '<br />')}<br />` : '';

  const htmlBody = (auditB.length) || (auditA.length)
    ? `${tableBody}${formatAuditHTML(auditB, 'Before')}${fix}${formatAuditHTML(auditA, 'After&nbsp;')}`
    : tableBody;

  return html(`
  ${head()}
  ${body(htmlBody)}`);
};

module.exports = {
  generateHTML,
};

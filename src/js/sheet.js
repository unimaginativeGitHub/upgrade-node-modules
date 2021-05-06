#!/usr/bin/env node

/**
 * sheet.js
 * this script POSTs the report results to a Google Sheets spreadsheet
 * you must set the following environment variables:
 * SPREADSHEET_ID
 * GOOGLE_SERVICE_ACCOUNT_EMAIL
 * GOOGLE_PRIVATE_KEY
 * you must also generate an HTML report BEFORE running this script (--saveReportToFile)
 * as this script parses the HTML table to generate data for the sheet rows
 */

const { GoogleSpreadsheet } = require('google-spreadsheet');
const moment = require('moment');
const { logger } = require('lognographer');
const { version } = require('../../package.json');


async function addFailuresToSheet() {
  const SPREADSHEET_ID = '1AJOl0xPSTysz2XMsF4W51hxN0ch7jYzJY6LBx0ARn34';
  const today = moment().format('M/D/YYYY');

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

  try {
    const creds = {
      client_email: process.env.TRUQC_WEBTEST_GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.TRUQC_WEBTEST_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();

    const sheetIndex = process.env.GOOGLE_SHEET_INDEX;
    const sheet = doc.sheetsByIndex[sheetIndex];

    const newRows = []
    fileNames.forEach((fileName) => {
      newRows.push([
        today, // date
        fileName, // test file name
        version, // current webtest version
      ]);
    });
    await sheet.addRows(newRows);
    logger.debug('Successfully "addFailuresToSheet". Total rows:', newRows.length);
  } catch (e) {
    logger.debug('Failed to "addFailuresToSheet"', e);
  }
}

if (fileNames.length > 0) {
  addFailuresToSheet();
}

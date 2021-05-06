#!/usr/bin/env node

/**
 * sheet.js
 * this script POSTs the report results to a Google Sheets spreadsheet
 * you must set the following environment variables:
 * GOOGLE_SPREADSHEET_ID
 * GOOGLE_SERVICE_ACCOUNT_EMAIL
 * GOOGLE_PRIVATE_KEY
 * you must also generate an HTML report BEFORE running this script (--saveReportToFile)
 * as this script parses the HTML table to generate data for the sheet rows
 */

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { logger } = require('lognographer');

/*
 * parseHTMLForUpdatedModuleData
 * parse the HTML Report for the first <table>, then treat each <tr> as a new row for the sheet.
 * this will include the following rows:
 * - Date Report was generated
 * - Row headers ("Package", "Current", "Wanted", etc.)
 * - Updated module entry
 */
const parseHTMLForUpdatedModuleData = (htmlReport) => {
  return [];
};

async function addReportToSheet(htmlReport) {

  try {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
    const creds = {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();

    const sheetIndex = process.env.GOOGLE_SHEET_INDEX;
    const sheet = doc.sheetsByIndex[sheetIndex];

    // parse htmlReport for <table> of updated node_modules
    const newRows = parseHTMLForUpdatedModuleData(htmlReport);

    const options = {
      insert: true, // insert to preserve empty rows for spacing
    };
    await sheet.addRows(newRows, options);
    logger.debug('Successfully Added Report to Sheet.');
  } catch (e) {
    logger.error('Failed to Add Report to Sheet', e);
    process.exit(1);
  }
}

module.exports = {
  addReportToSheet,
};

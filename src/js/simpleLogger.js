const colorize = require('json-colorizer');
const {
  blue, green, gray, yellow, red,
} = require('chalk');

const logLevels = ['debug', 'warn', 'info', 'error', 'off'];

// debug by default
let logLevel = 0;

const setLogLevel = (nextLogLevel = 'debug') => {
  const level = logLevels.findIndex(level => nextLogLevel === level);

  logLevel = level === -1 ? 0 : level;
}

const colorObj = (txt) => {
  let newTxt = ''; // this means I'm not showing undefineds :/
  if (typeof txt === 'string') {
    newTxt = txt;
  } else if (txt === null) {
    newTxt = gray(txt);
  } else if (typeof txt === 'object') {
    newTxt = `\n${colorize(JSON.stringify(txt, null, 2))}`;
  }
  return newTxt;
};

/* eslint-disable no-console */
exports.logger = {
  setLogLevel,
  error: (txt, msg) => logLevel <= 3 && console.log(`${red('error: ')}${colorObj(txt)}${colorObj(msg)}`),
  info: (txt, msg) => logLevel <= 2 && console.log(`${green('info: ')}${colorObj(txt)}${colorObj(msg)}`),
  warn: (txt, msg) => logLevel <= 1 && console.log(`${yellow('warn: ')}${colorObj(txt)}${colorObj(msg)}`),
  debug: (txt, msg) => logLevel <= 0 && console.log(`${blue('debug: ')}${colorObj(txt)}${colorObj(msg)}`),
};
/* eslint-enable no-console */

const colorize = require('json-colorizer');
const {
  blue, green, gray, yellow, red,
} = require('chalk');

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
  error: (txt, msg) => console.log(`${red('error: ')}${colorObj(txt)}${colorObj(msg)}`),
  info: (txt, msg) => console.log(`${green('info: ')}${colorObj(txt)}${colorObj(msg)}`),
  warn: (txt, msg) => console.log(`${yellow('warn: ')}${colorObj(txt)}${colorObj(msg)}`),
  debug: (txt, msg) => console.log(`${blue('debug: ')}${colorObj(txt)}${colorObj(msg)}`),
};
/* eslint-enable no-console */

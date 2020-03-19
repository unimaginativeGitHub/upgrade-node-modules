const cp = require('child_process');
const { logger } = require('lognographer');

exports.asyncExec = (command, options = { log: false, cwd: process.cwd() }) => {
  if (options.log) {
    logger.debug(command);
  }

  return new Promise((done, failed) => {
    cp.exec(command, { ...options }, (err, stdout, stderr) => {
      if (err) {
        const newError = new Error(err);
        newError.stdout = stdout;
        newError.stderr = stderr;
        failed(newError);
      }
      done({ stdout, stderr });
    });
  });
};

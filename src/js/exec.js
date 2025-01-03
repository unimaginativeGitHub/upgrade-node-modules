import cp from 'child_process';
import logger from 'lognographer';

const asyncExec = (command, options = { log: false, cwd: process.cwd() }) => {
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

export default asyncExec;

# upgrade-node-modules
Simple script to parse your package.json and upgrade each package version to latest stable.

---

## Install globally

**Via npm**
```bash
npm install --global upgrade-node-modules
```

Then cd into the root level of any node project and run:
```
upgrade-node-modules
```

By default, the script will walk your package.json and query npm for the latest stable versions of each package. Once found, the script will create a new clone of your package.json with the latest stable versions of each devDependency and dependency. The file is saved as new file `package.json.new`.

---

## Options

### Lock down module versions

The `upgrade-node-modules` script has the option of locking down any number of **dependencies** or **devDependencies**. All you need to do is add a file to your project's root directory name `fixedModules.json`. List dependencies and devDependencies in the same way you would in `package.json`

**Example:**
```json
{
  "dependencies": {
    "commander": "2.14.0",
    "chalk": "1.9.3"
  },
  "devDependencies": {
    "mocha": "5.0.1"
  }
}
```

### Help
Display help.
```
upgrade-node-modules -h
```

### Verbose
Display all console output.
```
upgrade-node-modules -v
```

### Silent
Suppress all console output.
```
upgrade-node-modules -s
```

### Overwrite
Overwrite your existing `package.json` with the new module versions (instead of creating a `package.json.new`).
```
upgrade-node-modules -w
```

### Report
Print a log to stdout that shows a table of out-of-date packages with the currently installed version, the desired version (as defined in package.json), and the latest version (per npm).
```
upgrade-node-modules -r
```
or add an f flag to save the report to a file:
```
upgrade-node-modules -rf
```

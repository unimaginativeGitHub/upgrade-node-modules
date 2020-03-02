# upgrade-node-modules
Simple script to parse your package.json and upgrade each package version to latest stable.

---

## New Features!
• You can now `ignore` modules entirely in fixedModules by specifying the module and `"*"` for the version.

ex:
```
"dependencies": {
  "cool-module-name": "*"
}
```


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

**Example (json5):**
```json5
{
  "dependencies": {
    // some comment here - these are filtered out on fixedModule load and JSON5 parsing
    "commander": "2.14.0",
    "chalk": "1.9.3"
  },
  "devDependencies": {
    // some other comment here"
    "mocha": "5.0.1"
  }
}
```

Standard json parsing is still fully supported.

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

### File
Write the report to file (html). Super handy for uploading or emailing via automation.
```
upgrade-node-modules -f
```

### Upgrade
Automatically upgrades your node modules after running the dependency review.
Note: selecting upgrade will automatically overwrite your package.json, essentially adding `-w` to the upgrade call.

### Security Audit
Runs `npm audit` under the hood and will provide a before and after report when writing to file or console.
Note: selecting audit will automatically produce a report (console if `-f` is not selected)

### Fix Audit
Runs `npm audit` before and after upgrade and also runs `npm audit --fix`. If you have report output selected, a before and after audit report will be added. Additionally, if vulnerabilities were reported, a brief security progress report will be included in the report.
Note: selecting fix audit will automatically overwrite your package.json, essentially adding `-w` to the fix audit call.

---

Thank you for taking a look at the project. Open an Issue if you find bugs, have an improvement, or caught a typo. Cheers!

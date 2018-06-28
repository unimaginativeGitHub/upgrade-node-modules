# upgrade-node-modules
Simple script to parse your package.json and upgrade each package version to latest stable.

---

## Include it in your project
**Directly**

Add:
```json
"upgrade-node-modules": "git@github.com:unimaginativeGitHub/upgrade-node-modules.git#v1.0.0"
```
To your devDependencies, then run:
```bash
npm install
```

**Via npm**
```bash
npm install --save upgrade-node-modules
```

---

## Usage
Invoke the upgrade script directly from your project's node_modules directory:
```bash
./node_modules/upgrade-node-modules/bin/upgrade-node-modules.js
```

Optionally - add this script to your package.json:
```json
  "scripts": {
    "upgrade-node-modules": "./node_modules/upgrade-node-modules/bin/upgrade-node-modules.js",
  },
```

Then you can run:
```
npm run upgrade-node-modules
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
npm run upgrade-node-modules -- -h
```
or
```
./node_modules/upgrade-node-modules/bin/upgrade-node-modules.js -h
```

### Verbose
Display all console output.
```
npm run upgrade-node-modules -- -v
```
or
```
./node_modules/upgrade-node-modules/bin/upgrade-node-modules.js -v
```

### Silent
Suppress all console output.
```
npm run upgrade-node-modules -- -s
```
or
```
./node_modules/upgrade-node-modules/bin/upgrade-node-modules.js -s
```

### Overwrite
Overwrite your existing `package.json` with the new module versions (instead of creating a `package.json.new`).
```
npm run upgrade-node-modules -- -w
```
or
```
./node_modules/upgrade-node-modules/bin/upgrade-node-modules.js -w
```

### Test
Test uses `upgrade-node-modules`'s own package.json as a test. Look for changes in the `node_modules/upgrade-node-modules` dir.
```
npm run upgrade-node-modules -- -t
```
or
```
./node_modules/upgrade-node-modules/bin/upgrade-node-modules.js -t
```

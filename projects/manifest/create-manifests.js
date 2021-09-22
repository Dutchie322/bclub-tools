const fs = require('fs');

// Make sure output directories exist.
ensureDirectoryExists(__dirname + '/../../dist/bclub-tools');
ensureDirectoryExists(__dirname + '/../../dist/manifests');

const baseManifest = readJsonFile('base-manifest.json');
const chromeManifestAdditions = readJsonFile('chrome-additions.json');
const firefoxManifestAdditions = readJsonFile('firefox-additions.json');

const chromeManifest = mergeDeep(baseManifest, chromeManifestAdditions);
const firefoxManifest = mergeDeep(baseManifest, firefoxManifestAdditions);

// Output Chrome manifest to dist directory for easy debugging.
writeJsonFile('bclub-tools/manifest.json', chromeManifest);

// Write all versions of the manifests to a different directory to add them to store packages as needed later.
writeJsonFile('manifests/manifest-chrome.json', chromeManifest);
writeJsonFile('manifests/manifest-firefox.json', firefoxManifest);

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true
    });
  }
}

function readJsonFile(fileName) {
  return JSON.parse(fs.readFileSync(__dirname + '/' + fileName, {
    encoding: 'utf8',
    flag: 'r'
  }));
}

function writeJsonFile(fileName, object) {
  fs.writeFileSync(__dirname + '/../../dist/' + fileName, JSON.stringify(object, undefined, 2), {
    encoding: 'utf8',
    flag: 'w'
  });
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
  if (!sources.length) {
    return target;
  }

  const source = sources.shift();
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return mergeDeep(output, ...sources);
}

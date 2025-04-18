import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

// Make sure output directories exist.
ensureDirectoryExists(import.meta.dirname + '/../../dist/manifests');

const baseManifest = readJsonFile('base-manifest.json');
const chromeManifestAdditions = readJsonFile('chrome-additions.json');
const privChromeManifestAdditions = readJsonFile('private-chrome-additions.json', true);
const firefoxManifestAdditions = readJsonFile('firefox-additions.json');
const privFirefoxManifestAdditions = readJsonFile('private-firefox-additions.json', true);

const chromeManifest = mergeDeep(baseManifest, chromeManifestAdditions, privChromeManifestAdditions);
const firefoxManifest = mergeDeep(baseManifest, firefoxManifestAdditions, privFirefoxManifestAdditions);

// Output Chrome manifest to dist directory for easy debugging.
writeJsonFile('manifest.json', chromeManifest);

// Write all versions of the manifests to a different directory to add them to store packages as needed later.
writeJsonFile('manifests/manifest-chrome.json', chromeManifest);
writeJsonFile('manifests/manifest-firefox.json', firefoxManifest);

function ensureDirectoryExists(directory) {
  if (!existsSync(directory)) {
    mkdirSync(directory, {
      recursive: true
    });
  }
}

function readJsonFile(fileName, optional = false) {
  const path = import.meta.dirname + '/' + fileName;
  if (!existsSync(path)) {
    if (optional) {
      return;
    }

    throw new Error(`File ${path} does not exist`);
  }

  return JSON.parse(readFileSync(path, {
    encoding: 'utf8',
    flag: 'r'
  }));
}

function writeJsonFile(fileName, object) {
  writeFileSync(import.meta.dirname + '/../../dist/' + fileName, JSON.stringify(object, undefined, 2), {
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

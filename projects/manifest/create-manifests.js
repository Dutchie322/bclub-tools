import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const releaseNotesDirectory = import.meta.dirname + '/../../release/notes';

// Make sure output directories exist.
ensureDirectoryExists(import.meta.dirname + '/../../dist/manifests');

const baseManifest = readJsonFile('base-manifest.json');
const chromeManifestAdditions = readJsonFile('chrome-additions.json');
const privChromeManifestAdditions = readJsonFile('private-chrome-additions.json', true);
const firefoxManifestAdditions = readJsonFile('firefox-additions.json');
const privFirefoxManifestAdditions = readJsonFile('private-firefox-additions.json', true);

// Releases get their version from the git tag (see .github/workflows/release.yml), local builds use the placeholder
// from the base manifest.
const isRelease = !!process.env.BCT_VERSION;
const version = process.env.BCT_VERSION || baseManifest.version;
if (isRelease && !/^\d+(\.\d+){0,3}$/.test(version)) {
  throw new Error(`BCT_VERSION "${version}" is not a valid extension version (expected e.g. 1.2.3)`);
}

const chromeManifest = mergeDeep(baseManifest, chromeManifestAdditions, privChromeManifestAdditions, { version });
const firefoxManifest = mergeDeep(baseManifest, firefoxManifestAdditions, privFirefoxManifestAdditions, { version });

// Output Chrome manifest to dist directory for easy debugging.
writeJsonFile('manifest.json', chromeManifest);

// Write all versions of the manifests to a different directory to add them to store packages as needed later.
writeJsonFile('manifests/manifest-chrome.json', chromeManifest);
writeJsonFile('manifests/manifest-firefox.json', firefoxManifest);

// The popup shows the first line of the release notes when the extension was updated.
writeJsonFile('release-notes.json', {
  version,
  summary: readReleaseNotesSummary(version)
});

function readReleaseNotesSummary(version) {
  const path = `${releaseNotesDirectory}/${version}.md`;
  if (!existsSync(path)) {
    if (isRelease) {
      throw new Error(`Release notes ${path} do not exist, write them before releasing version ${version}`);
    }

    return null;
  }

  const firstLine = readFileSync(path, { encoding: 'utf8' })
    .split(/\r?\n/)
    .map(line => line.replace(/^#+/, '').trim())
    .find(line => line.length > 0);
  if (!firstLine) {
    throw new Error(`Release notes ${path} are empty`);
  }

  return firstLine;
}

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

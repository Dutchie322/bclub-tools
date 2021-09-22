const fs = require('fs');

const baseManifest = readJsonFile('base-manifest.json');
const chromeManifestAdditions = readJsonFile('chrome-additions.json');
const firefoxManifestAdditions = readJsonFile('firefox-additions.json');

const chromeManifest = JSON.stringify(mergeDeep(baseManifest, chromeManifestAdditions), undefined, 2);
const firefoxManifest = JSON.stringify(mergeDeep(baseManifest, firefoxManifestAdditions), undefined, 2);

fs.writeFileSync(__dirname + '/../../dist/bclub-tools/manifest.json', chromeManifest, {
  encoding: 'utf8',
  flag: 'w'
});
fs.writeFileSync(__dirname + '/../../dist/bclub-tools/manifest-fx.json', firefoxManifest, {
  encoding: 'utf8',
  flag: 'w'
});

function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(__dirname + '/' + file, {
    encoding: 'utf8',
    flag: 'r'
  }));
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

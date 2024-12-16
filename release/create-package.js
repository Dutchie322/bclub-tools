const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

['chrome', 'firefox'].forEach(browser => {
  const package = createBasePackage();
  package.file('manifest.json', fs.readFileSync(`${__dirname}/../dist/manifests/manifest-${browser}.json`));
  finalizePackage(package, browser);
});

function createBasePackage() {
  const package = new JSZip();
  addAllFilesToArchive(package, 'background', __dirname + '/../dist/background/');
  addAllFilesToArchive(package, 'content-script', __dirname + '/../dist/content-script/');
  addAllFilesToArchive(package, 'log-viewer', __dirname + '/../dist/log-viewer/');
  addAllFilesToArchive(package, 'options', __dirname + '/../dist/options/');
  addAllFilesToArchive(package, 'popup', __dirname + '/../dist/popup/');
  return package;
}

function finalizePackage(package, nameSuffix) {
  package.generateNodeStream({
    type: 'nodebuffer',
    streamFiles: true,
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  })
    .pipe(fs.createWriteStream(`${__dirname}/../dist/bclub-tools-${nameSuffix}.zip`))
    .on('error', err => {
      console.error(err);
      throw err;
    })
    .on('finish', () => {
      console.log(`${nameSuffix} package created.`);
    });
}

// Thanks to https://github.com/Stuk/jszip/issues/386#issuecomment-508217874
function addAllFilesToArchive(zip, basePath, dir) {
  const allPaths = getFilePathsRecursiveSync(dir);

  for (const filePath of allPaths) {
    const addPath = path.join(basePath, path.relative(dir, filePath));

    let data = fs.readFileSync(filePath);
    zip.file(addPath, data);
  }
}

// returns a flat array of absolute paths of all files recursively contained in the dir
function getFilePathsRecursiveSync(dir) {
  let results = [];
  list = fs.readdirSync(dir);
  let pending = list.length;
  if (!pending) {
    return results;
  }

  for (let file of list) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      res = getFilePathsRecursiveSync(file);
      results = results.concat(res);
    } else {
      results.push(file);
    }
    if (!--pending) {
      return results;
    }
  }

  return results;
}

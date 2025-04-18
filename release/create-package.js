import { readFileSync, createWriteStream, readdirSync, statSync } from 'fs';
import { parse, join, relative, resolve } from 'path';
import JSZip from 'jszip';

['chrome', 'firefox'].forEach(browser => {
  const archive = createBasePackage();
  archive.file('manifest.json', readFileSync(`${import.meta.dirname}/../dist/manifests/manifest-${browser}.json`));
  finalizePackage(archive, browser);
});

function createBasePackage() {
  const archive = new JSZip();
  addAllFilesToArchive(archive, 'background', import.meta.dirname + '/../dist/background/');
  addAllFilesToArchive(archive, 'content-script', import.meta.dirname + '/../dist/content-script/');
  addAllFilesToArchive(archive, 'log-viewer', import.meta.dirname + '/../dist/log-viewer/');
  addAllFilesToArchive(archive, 'options', import.meta.dirname + '/../dist/options/');
  addAllFilesToArchive(archive, 'popup', import.meta.dirname + '/../dist/popup/');
  addFilesToArchiveRoot(archive, [import.meta.dirname + '/../dist/index.html', import.meta.dirname + '/../dist/main.js']);
  return archive;
}

function finalizePackage(archive, nameSuffix) {
  archive.generateNodeStream({
    type: 'nodebuffer',
    streamFiles: true,
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  })
    .pipe(createWriteStream(`${import.meta.dirname}/../dist/bclub-tools-${nameSuffix}.zip`))
    .on('error', err => {
      console.error(err);
      throw err;
    })
    .on('finish', () => {
      console.log(`${nameSuffix} package created.`);
    });
}

function addFilesToArchiveRoot(zip, files) {
  for (const filePath of files) {
    let base = parse(filePath).base;
    let data = readFileSync(filePath);
    zip.file(base, data);
  }
}

// Thanks to https://github.com/Stuk/jszip/issues/386#issuecomment-508217874
function addAllFilesToArchive(zip, basePath, dir) {
  const allPaths = getFilePathsRecursiveSync(dir);

  for (const filePath of allPaths) {
    const addPath = join(basePath, relative(dir, filePath));

    let data = readFileSync(filePath);
    zip.file(addPath, data);
  }
}

// returns a flat array of absolute paths of all files recursively contained in the dir
function getFilePathsRecursiveSync(dir) {
  let results = [];
  const list = readdirSync(dir);
  let pending = list.length;
  if (!pending) {
    return results;
  }

  for (let file of list) {
    file = resolve(dir, file);
    const stat = statSync(file);
    if (stat && stat.isDirectory()) {
      const res = getFilePathsRecursiveSync(file);
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

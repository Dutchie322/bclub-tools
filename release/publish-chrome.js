import { readFileSync } from 'fs';

// Uploads dist/bclub-tools-chrome.zip to the Chrome Web Store and submits it for review.
// See https://developer.chrome.com/docs/webstore/api for the API used.
//
// Environment:
// - CWS_ACCESS_TOKEN: OAuth access token of the service account, with scope https://www.googleapis.com/auth/chromewebstore
// - CWS_PUBLISHER_ID: publisher ID from the Developer Dashboard (Publisher > Settings)
// - CWS_EXTENSION_ID: optional, defaults to the published extension
//
// Pass --upload-only to only upload the package, without submitting it for review.

const accessToken = requireEnv('CWS_ACCESS_TOKEN');
const publisherId = requireEnv('CWS_PUBLISHER_ID');
const extensionId = process.env.CWS_EXTENSION_ID || 'pgigbkbcecbpgijnfhmpmkipgondpnpc';
const uploadOnly = process.argv.includes('--upload-only');

const itemName = `publishers/${publisherId}/items/${extensionId}`;
const packagePath = `${import.meta.dirname}/../dist/bclub-tools-chrome.zip`;

const upload = await request(`https://chromewebstore.googleapis.com/upload/v2/${itemName}:upload`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/zip' },
  body: readFileSync(packagePath)
});
console.log('Upload:', upload);

let uploadState = upload.uploadState;
for (let attempt = 0; uploadState === 'IN_PROGRESS' && attempt < 30; attempt++) {
  await new Promise(resolve => setTimeout(resolve, 10_000));
  const status = await request(`https://chromewebstore.googleapis.com/v2/${itemName}:fetchStatus`);
  uploadState = status.lastAsyncUploadState;
  console.log('Upload state:', uploadState);
}

if (uploadState !== 'SUCCEEDED') {
  throw new Error(`Upload did not succeed, state is ${uploadState}`);
}

if (uploadOnly) {
  console.log('Upload only, not submitting for review.');
} else {
  const publish = await request(`https://chromewebstore.googleapis.com/v2/${itemName}:publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publishType: 'DEFAULT_PUBLISH' })
  });
  console.log('Publish:', publish);
}

async function request(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${url} failed with ${response.status}: ${body}`);
  }

  return JSON.parse(body);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }

  return value;
}

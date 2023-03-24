const fs = require('fs');
const request = require('https').request;
const EOL = require('os').EOL;
const basename = require('path').basename;
const argv = require('process').argv;

const args = argv.slice(2);

if (args.length === 0) {
  errorHandler('Missing revision argument');
}

const revision = args[0];

function errorHandler(error) {
  if (error) {
    console.error(error);
    throw error;
  }
}

function downloadFile(file, destination) {
  const options = {
    hostname: 'gitgud.io',
    port: 443,
    path: `/BondageProjects/Bondage-College/-/raw/${revision}/BondageClub/${file}`,
    method: 'GET'
  };

  console.log(`Downloading ${file} to ${destination}...`);

  const clientRequest = request(options, incomingMessage => {
    let data = '';
    incomingMessage.on('data', chunk => {
      data += chunk;
    });
    incomingMessage.on('end', () => {
      fs.writeFile(destination, data.toString().replace(/\r?\n/g, EOL), errorHandler);
      console.log(`Done ${destination}.`);
    });
  });
  clientRequest.on('error', errorHandler);
  clientRequest.end();
}

const assets = [
  'Assets/Female3DCG/Female3DCG.csv',
  'Screens/Character/Preference/ActivityDictionary.csv',
  'Screens/Character/Player/Dialog_Player.csv'
];

const scripts = [
  'Scripts/Typedef.d.ts'
];

for (const file of assets) {
  downloadFile(file, `src/assets/${basename(file)}`);
}

for (const file of scripts) {
  downloadFile(file, `models/game/${basename(file)}`);
}

const fs = require('fs');
const request = require('https').request;
const EOL = require('os').EOL;
const basename = require('path').basename;
const argv = require('process').argv;

function errorHandler(error) {
  if (error) {
    console.error(error);
    throw error;
  }
}

const args = argv.slice(2);

if (args.length === 0) {
  errorHandler('Missing revision argument');
}

let revision = args[0];
const files = [
  'Assets/Female3DCG/Female3DCG.csv',
  'Screens/Character/Preference/ActivityDictionary.csv',
  'Screens/Character/Player/Dialog_Player.csv',
];

for (let file of files) {
  const options = {
    hostname: 'gitgud.io',
    port: 443,
    path: `/BondageProjects/Bondage-College/-/raw/${revision}/BondageClub/${file}`,
    method: 'GET'
  };

  console.log(options);

  const clientRequest = request(options, incomingMessage => {
    let data = '';
    incomingMessage.on('data', chunk => {
      data += chunk;
    });
    incomingMessage.on('end', () => {
      fs.writeFile(`src/assets/${basename(file)}`, data.toString().replace(/\r?\n/g, EOL), errorHandler);
    });
  });
  clientRequest.on('error', errorHandler);
  clientRequest.end();
}

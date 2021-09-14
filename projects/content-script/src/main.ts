import browser from 'webextension-polyfill';
import { injectScript } from './inject-script';

async function loadExtension() {
  console.log('Loading Bondage Club Tools...');

  const response = await browser.runtime.sendMessage({
    type: 'client',
    event: 'Bootstrap'
  });

  console.log('response: ', response);
  if (response.canConnectFromPage) {
    injectScript(response.handshake);
  } else {
    console.error('Could not start extension');
  }
}

loadExtension();

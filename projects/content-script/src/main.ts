import { injectScript } from './inject-script';

console.log('Loading Bondage Club Tools...');

chrome.runtime.sendMessage({
  type: 'client',
  event: 'Bootstrap'
}, response => {
  injectScript(response.handshake);
});

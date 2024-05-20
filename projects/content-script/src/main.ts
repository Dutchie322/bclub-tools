/// <reference types="@types/chrome"/>

import { log } from '../../../models';

function delay(milliseconds: number) {
  return new Promise((resolve => {
    setTimeout(resolve, milliseconds);
  }));
}

function checkForGame() {
  if (!document.getElementById('MainCanvas')) {
    return false;
  }
  const scriptTags = document.getElementsByTagName('script');
  for (let i = 0; i < scriptTags.length; i++) {
    if (scriptTags.item(i).src.endsWith('Screens/Online/ChatRoom/ChatRoom.js')) {
      return true;
    }
  }

  return false;
}

async function waitForGameToLoad() {
  let count = 0;
  const limit = 10;
  while (count < limit) {
    if (checkForGame()) {
      return true;
    }

    count++;
    await delay(1000);
  }

  return false;
}

async function main() {
  // Check if we're on a page with the game, else we do nothing.
  if (await waitForGameToLoad()) {
    log('Injecting scripts...');

    let handshake: string;

    const listener = ({ data }) => {
      if (!data || !data.handshake || !data.type) {
        return;
      }

      if (data.handshake !== handshake) {
        console.log('Incorrect handshake');
        return;
      }

      console.log('Received plausible message, forwarding...', data);
      try {
        chrome.runtime.sendMessage(data);
      } catch (e) {
        window.removeEventListener('message', listener);
      }
    }
    window.addEventListener('message', listener);

    chrome.runtime.sendMessage({
      type: 'content-script',
      event: 'GameLoaded'
    }, response => {
      console.log('Received response:', response);
      handshake = response.handshake;
    });
  }
}

main().catch(err => {
  console.error('[Bondage Club Tools] Error while starting.', err);
});

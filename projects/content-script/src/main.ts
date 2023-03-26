/// <reference types="@types/chrome"/>

import { generateOneTimeScript, generatePersistentScriptWithWait, generatePersistentScript } from './script-generators';
import { listenToServerEvents } from './server-event-listeners';
import { listenForUserSentEvents } from './user-input-listener';
import { retrieveGlobal, log } from '../../../models';
import { checkForLoggedInState } from './check-for-logged-in-state';
import { characterAppearance } from './draw-listeners';
import { requestOnlineFriends } from './update-friends';
import { generateFireAndForgetScript } from './script-generators/fire-and-forget';

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

    retrieveGlobal('settings').then(settings => {
      generateOneTimeScript(checkForLoggedInState);
      generatePersistentScriptWithWait('ServerSocket', listenForUserSentEvents, settings.tools.chatRoomRefreshInterval);
      generatePersistentScriptWithWait('ServerSocket', listenToServerEvents);
      generatePersistentScript(characterAppearance);
      log('Done injecting scripts.');
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request && request.type === 'popup' && request.event === 'UpdateFriends') {
        generateFireAndForgetScript(requestOnlineFriends);
      }
    });
  }
}

main().catch(err => {
  console.error('[Bondage Club Tools] Error while starting.', err);
});

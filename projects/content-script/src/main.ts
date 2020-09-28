/// <reference types="@types/chrome"/>

import { frameCounter } from './performance-counter';
import { generateOneTimeScript, generatePersistentScriptWithWait, generatePersistentScript } from './script-generators';
import { chatRoomRefresh, listenToServerEvents, pollOnlineFriends, pollVariables } from './server-event-listeners';
import { listenForUserSentEvents } from './user-input-listener';
import { retrieveGlobal, log } from '../../../models';
import { checkForLoggedInState } from './check-for-logged-in-state';

log('Injecting scripts...');

retrieveGlobal('settings').then(settings => {
  if (settings.tools.fpsCounter) {
    generatePersistentScriptWithWait('ServerSocket', frameCounter);
  }
  if (settings.tools.chatRoomRefresh) {
    generatePersistentScriptWithWait('ServerSocket', chatRoomRefresh);
  }
  generateOneTimeScript(checkForLoggedInState);
  generatePersistentScriptWithWait('ServerSocket', listenForUserSentEvents);
  generatePersistentScriptWithWait('ServerSocket', listenToServerEvents);
  generatePersistentScriptWithWait('ServerSocket', pollOnlineFriends);
  generatePersistentScript(pollVariables);
  log('Done injecting scripts.');
});

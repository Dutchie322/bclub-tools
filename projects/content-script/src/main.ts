/// <reference types="@types/chrome"/>

import { frameCounter } from './performance-counter';
import { generatePersistentScriptWithWait, generatePersistentScript } from './script-generators';
import { chatRoomRefresh, listenToServerEvents, pollOnlineFriends, pollVariables } from './server-event-listeners';
import { listenForUserSentEvents } from './user-input-listener';
import { retrieveGlobal, log } from '../../../models';

log('Injecting scripts...');

retrieveGlobal('settings').then(settings => {
  if (settings.tools.fpsCounter) {
    generatePersistentScriptWithWait('ServerSocket', frameCounter);
  }
  if (settings.tools.chatRoomRefresh) {
    generatePersistentScriptWithWait('ServerSocket', chatRoomRefresh);
  }
  generatePersistentScriptWithWait('ServerSocket', listenForUserSentEvents);
  generatePersistentScriptWithWait('ServerSocket', listenToServerEvents);
  generatePersistentScriptWithWait('ServerSocket', pollOnlineFriends);
  generatePersistentScript(pollVariables);
  log('Done injecting scripts.');
});

/// <reference types="@types/chrome"/>

import { generateOneTimeScript, generatePersistentScriptWithWait, generatePersistentScript } from './script-generators';
import { listenToServerEvents } from './server-event-listeners';
import { listenForUserSentEvents } from './user-input-listener';
import { retrieveGlobal, log } from '../../../models';
import { checkForLoggedInState } from './check-for-logged-in-state';
import { characterAppearance } from './draw-listeners';

log('Injecting scripts...');

retrieveGlobal('settings').then(settings => {
  generateOneTimeScript(checkForLoggedInState);
  generatePersistentScriptWithWait('ServerSocket', listenForUserSentEvents, settings.tools.chatRoomRefreshInterval);
  generatePersistentScriptWithWait('ServerSocket', listenToServerEvents);
  generatePersistentScript(characterAppearance);
  log('Done injecting scripts.');
});

/// <reference types="@types/chrome"/>

import { frameCounter } from './performance-counter';
import { generatePersistentScriptWithWait, generatePersistentScript } from './script-generators';
import { listenToServerEvents, pollOnlineFriends, pollVariables } from './server-event-listeners';
import { listenForUserSentEvents } from './user-input-listener';

console.log('Injecting scripts...');
generatePersistentScriptWithWait('ServerSocket', frameCounter);
generatePersistentScriptWithWait('ServerSocket', listenForUserSentEvents);
generatePersistentScriptWithWait('ServerSocket', listenToServerEvents);
generatePersistentScriptWithWait('ServerSocket', pollOnlineFriends);
generatePersistentScript(pollVariables);
console.log('Done injecting scripts.');

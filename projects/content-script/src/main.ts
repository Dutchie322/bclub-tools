/// <reference types="@types/chrome"/>

import { generatePersistentScriptWithWait, generatePersistentScript } from './script-generators';
import { listenToServerEvents, pollOnlineFriends, pollVariables } from './server-event-listeners';
import { listenForUserSentEvents } from './user-input-listener';

generatePersistentScriptWithWait('ServerSocket', listenForUserSentEvents);
generatePersistentScriptWithWait('ServerSocket', listenToServerEvents);
generatePersistentScriptWithWait('ServerSocket', pollOnlineFriends);
generatePersistentScript(pollVariables);

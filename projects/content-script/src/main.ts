/// <reference types="@types/chrome"/>

import { generatePersistentScriptWithWait, generatePersistentScript } from './script-generators';
import { listenToServerEvents, pollOnlineFriends, pollVariables } from './server-event-listeners';
import { listenForUserSentEvents } from './user-input-listener';

const cleanUpFns = [];

cleanUpFns.push(generatePersistentScriptWithWait('ServerSocket', listenForUserSentEvents));
cleanUpFns.push(generatePersistentScriptWithWait('ServerSocket', listenToServerEvents));
cleanUpFns.push(generatePersistentScriptWithWait('ServerSocket', pollOnlineFriends));
cleanUpFns.push(generatePersistentScript(pollVariables));

// TODO Come up with some way to detect that the connection with the extension has been lost and then clean up everything.

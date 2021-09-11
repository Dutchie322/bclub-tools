import { ISettings } from 'models';
import { frameCounter } from './performance-counter';
import { chatRoomRefresh, pollOnlineFriends, pollVariables } from './timed-listeners';
import { checkForLoggedInState } from './check-for-logged-in-state';
import { listenForUserSentEvents } from './user-input-listener';
import { listenToServerEvents } from './server-event-listeners';
import { characterAppearance } from './draw-listeners';

export function isClubPage() {
  return typeof LoginValidCollar !== 'undefined';
}

export function connect(extensionId: string, handshake: string) {
  if (!isClubPage()) {
    // Don't do anything if we didn't detect the game.
    return;
  }

  if (typeof chrome === 'undefined') {
    // TODO This is Firefox... build some sort of fallback with postMessage or dispatchEvent to a content script?
    console.error('Browser not supported');
    return;
  }

  console.log(`Attempting connect with extensionId ${extensionId}, handshake ${handshake}`);
  const port = chrome.runtime.connect(extensionId, {
    name: 'bondage-club-tools-injectable-script'
  });

  let isDisconnected = false;
  let disconnectFn: () => void;
  function postMessage(type: 'client' | 'server', event: string, data: object) {
    if (isDisconnected) {
      throw new Error(`Can't send message to a disconnected port`);
    }

    // TODO Revise typing for messaging
    const message = {
      type,
      event,
      handshake,
      data
    } as { type: 'client' | 'server', event: string, handshake: string, data: object, inFocus?: boolean };

    if (type === 'server') {
      message.inFocus = document.hasFocus();
    }

    port.postMessage(message);
  }

  port.onDisconnect.addListener(() => {
    console.log('Port disconnected in injected script');
    isDisconnected = true;
    if (disconnectFn) {
      disconnectFn();
    }
  });
  port.onMessage.addListener(message => {
    console.log('Received message in injected script:', message);
    if (message.event === 'UpdateSettings') {
      // TODO gracefully handle updating settings without injecting scripts again
      disconnectFn = start(postMessage, message.data.settings);
    }
  });

  port.postMessage({
    type: 'client',
    event: 'Connect',
    data: {
      handshake
    }
  });
}

function start(postMessage: PostMessageCallback, settings: ISettings) {
  console.log('Started with settings', settings);

  const stopFunctions = [];
  if (settings.tools.fpsCounter) {
    stopFunctions.push(frameCounter());
  }
  if (settings.tools.chatRoomRefresh) {
    stopFunctions.push(chatRoomRefresh());
  }

  checkForLoggedInState(postMessage);
  listenForUserSentEvents(postMessage);
  listenToServerEvents(postMessage);
  stopFunctions.push(pollOnlineFriends());
  stopFunctions.push(characterAppearance(postMessage));
  stopFunctions.push(pollVariables(postMessage));

  return () => {
    stopFunctions.forEach(fn => fn());
  };
}

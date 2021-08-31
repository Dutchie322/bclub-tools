import { ISettings } from 'models';
import { frameCounter } from './performance-counter';
import { chatRoomRefresh, pollOnlineFriends, pollVariables } from './timed-listeners';
import { checkForLoggedInState } from './check-for-logged-in-state';
import { listenForUserSentEvents } from './user-input-listener';
import { listenToServerEvents } from './server-event-listeners';
import { characterAppearance } from './draw-listeners';

export class Bootstrapper {
  private readonly isClubPage: boolean = false;

  public constructor() {
    this.isClubPage = typeof LoginValidCollar !== 'undefined';
  }

  public connect(extensionId: string, handshake: string) {
    console.log(`Attempting connect with extensionId ${extensionId}, handshake ${handshake}, isClubPage: ${this.isClubPage}`);
    if (!this.isClubPage) {
      // Don't do anything if we didn't detect the game.
      return;
    }

    const port = chrome.runtime.connect(extensionId, {
      name: 'bondage-club-tools-injectable-script'
    });

    let isDisconnected = false;
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
    });
    port.onMessage.addListener(message => {
      console.log('Received message in injected script:', message);
      if (message.event === 'UpdateSettings') {
        this.start(postMessage, message.data.settings);
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

  private start(postMessage: PostMessageCallback, settings: ISettings) {
    console.log('Started with settings', settings);

    if (settings.tools.fpsCounter) {
      frameCounter();
    }
    if (settings.tools.chatRoomRefresh) {
      chatRoomRefresh();
    }

    checkForLoggedInState(postMessage);
    listenForUserSentEvents(postMessage);
    listenToServerEvents(postMessage);
    pollOnlineFriends();
    characterAppearance(postMessage);
    pollVariables(postMessage);
  }
}

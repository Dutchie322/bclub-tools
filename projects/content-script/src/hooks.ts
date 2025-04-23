import bcModSdk from 'bondage-club-mod-sdk';
import { sendCharacterAppearance } from './draw-listeners';
import { listenToServerEvents } from './server-event-listeners';
import { forwardUserSentEvent, getEvents } from './user-input-listener';

///////////////////////////////////////////////////////////////////////////////
// This file runs in the MAIN world. It's injected by the extension after
// receiving the GameStart message. The file is compiled through webpack, which
// means we can use imports like normal.
///////////////////////////////////////////////////////////////////////////////

/**
 * Registers the extension with the Mod SDK and hooks into the functions that
 * are of interest to us. This, sadly, also exposes the presence of the
 * extension to other mods, but seeing as there are so many of them these days,
 * conflicts with the old proxy-based approach started appearing more and more.
 * This SDK allows us to circumvent that by using the `hookFunction` calls.
 *
 * @param handshake The handshake needed to make calls to the extension.
 * @param searchInterval The configured refresh interval for the search page.
 */
export function registerHooks(handshake: string, searchInterval: number) {
  const mod = bcModSdk.registerMod({
    name: 'BCT',
    fullName: 'Bondage Club Tools',
    version: '0.7.0',
    repository: 'https://github.com/Dutchie322/bclub-tools'
  }, {
    // Update the callbacks if the extension gets updated
    allowReplace: true
  });

  // Allows us to store the appearance of people
  mod.hookFunction('CommonDrawAppearanceBuild', 0, (args, next) => {
    const character = args[0];
    sendCharacterAppearance(character, handshake);

    return next(args);
  });

  let unhookFromEmitMethod: ReturnType<typeof mod.hookFunction>;

  // Gets run when the player gets disconnected and the ServerSocket needs to
  // be reinitialised.
  mod.hookFunction('ServerInit', 0, (args, next) => {
    unhookFromEmitMethod();

    // Hooks get called BEFORE the actual function get executed. We need to
    // wait until after ServerInit() has created the new ServerSocket before we
    // update the listeners.
    setTimeout(() => {
      listenToServerEvents(handshake);
    });

    return next(args);
  });

  // After the player logs in, we start listening to any sent events. This also
  // prevents that the username and password gets forwarded to the extension.
  // The extension discards that anyway, but not having it in the first place
  // is just better.
  const events = getEvents(handshake, searchInterval);
  mod.hookFunction('LoginResponse', 0, (args, next) => {
    // Allows us to store sent messages, whispers, beeps and know when we left
    // the room.
    setTimeout(() => {
      // TODO For some reason this call only works the first time, seems to get
      // ignored after reconnecting
      unhookFromEmitMethod = mod.hookFunction('ServerSocket.emit', 0, (args, next) => {
        forwardUserSentEvent(events, args);

        return next(args);
      });
    });

    return next(args);
  });

  // Hook into ServerSocket on first run because ServerInit() has already been
  // called by the time this code runs.
  listenToServerEvents(handshake);
}

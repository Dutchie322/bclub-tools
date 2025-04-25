/// <reference types="@types/chrome"/>

///////////////////////////////////////////////////////////////////////////////
// This file runs in the ISOLATED world. It's injected through static
// declaration in the manifest. The file is compiled through webpack, which
// means we can use imports like normal.
///////////////////////////////////////////////////////////////////////////////

/** The handshake we need to use that makes sure we're using a valid session. */
let handshake: string;

/**
 * The handler that forwards messages from the MAIN world to the extension's
 * backend. It checks the format, skipping messages from other mods, extensions
 * and whatever else might use window.postMessage(), as well as checking the
 * handshake.
 *
 * The 'message' event listener automatically gets unregistered if an error
 * occurs when calling chrome.runtime.sendMessage() because that usually means
 * the extension has been updated, removed or... crashed.
 */
function pageToBackendListener({ data }: { data: any }) {
  if (!data || !data.handshake || !data.type || !data.event) {
    return;
  }

  if (data.handshake !== handshake) {
    return;
  }

  try {
    chrome.runtime.sendMessage(data);
  } catch (e) {
    window.removeEventListener('message', pageToBackendListener);
  }
}
window.addEventListener('message', pageToBackendListener);

// Signal the extension to inject the script that checks for the game's
// presence into the webpage (MAIN world). We can't do it here because
// this code runs in the ISOLATED world and we have no access to the game's
// variables.
//
// The response of the GameStart message contains the handshake we will need to
// use for the rest of the session, which prevents double data if the
// extension gets updated while we are logged into the game.
chrome.runtime.sendMessage({
  type: 'content-script',
  event: 'GameStart'
}, response => {
  handshake = response.handshake;
});

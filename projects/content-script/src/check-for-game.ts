/**
 * Checks to see if the current page is running the game and we are able to
 * hook into it. In order to give the game some time to load, the process is
 * repeated a few times before silently giving up. Doing it this way we can
 * support the so-called "cheater" and beta versions without knowing their
 * exact URLs as well, while not throwing errors on pages that do not serve the
 * game (homepage, college, teacher, etc). If the game is found, a GameLoaded
 * message is sent to the extension which will then continue with injecting the
 * code necessary in order to hook into the game and start listening to events.
 *
 * This function is injected into the page using `chrome.scripting.executeScript`,
 * which means that no imports can be used and all code must be inside the
 * function definition.
 *
 * @param handshake The handshake we need to use in the message.
 */
export function checkForGame(handshake: string) {
  function checkRequiredElements() {
    if (!document.getElementById('MainCanvas')) {
      return false;
    }
    const scriptTags = document.getElementsByTagName('script');
    let tagFound = false;
    for (let i = 0; i < scriptTags.length; i++) {
      if (scriptTags.item(i).src.endsWith('Screens/Online/ChatRoom/ChatRoom.js')) {
        tagFound = true;
        break;
      }
    }

    if (!tagFound) {
      return false;
    }

    if (!window.ServerSocket) {
      return false;
    }

    return true;
  }

  function waitForGameToLoad(callback: (result: boolean) => void, count: number = 0) {
    const limit = 10;
    if (count < limit) {
      if (checkRequiredElements()) {
        callback(true);
        return;
      }

      setTimeout(() => waitForGameToLoad(callback, count + 1), 1000);
      return;
    }

    callback(false);
  }

  waitForGameToLoad(result => {
    if (!result) {
      return;
    }

    window.postMessage({
      handshake,
      type: 'content-script',
      event: 'GameLoaded'
    });
  });
}

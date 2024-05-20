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

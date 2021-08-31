import { isDevelopmentMode } from '../../../models';

export function injectScript(handshake: string) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injectable-script/main.js');
  script.addEventListener('load', event => {
    if (!isDevelopmentMode()) {
      (event.target as HTMLScriptElement).remove();
    }

    injectBootstrapScript(handshake);
  });
  document.head.appendChild(script);
}

function injectBootstrapScript(handshake: string) {
  const script = document.createElement('script');
  script.appendChild(document.createTextNode(`(function() {
    BondageClubTools.connect('${chrome.runtime.id}','${handshake}');
  })();`));
  script.addEventListener('load', event => {
    if (!isDevelopmentMode()) {
      (event.target as HTMLScriptElement).remove();
    }
  });
  document.head.append(script);
}

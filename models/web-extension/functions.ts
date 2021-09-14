export function executeForAllGameTabs(action: (tab: chrome.tabs.Tab) => void) {
  [
    'http://bondageprojects.com/*',
    'https://bondageprojects.com/*',
    'http://www.bondageprojects.com/*',
    'https://www.bondageprojects.com/*',
    'http://bondageprojects.elementfx.com/*',
    'https://bondageprojects.elementfx.com/*',
    'http://www.bondageprojects.elementfx.com/*',
    'https://www.bondageprojects.elementfx.com/*',
    'http://bondage-europe.com/*',
    'https://bondage-europe.com/*',
    'http://www.bondage-europe.com/*',
    'https://www.bondage-europe.com/*'
  ].forEach(url => {
    chrome.tabs.query({
      url
    }, tabs => {
      tabs.forEach(action);
    });
  });
}

export function isDevelopmentMode() {
  return !('update_url' in chrome.runtime.getManifest());
}

export function log(...params: any[]) {
  if (isDevelopmentMode()) {
    params.unshift('[Bondage Club Tools]');
    console.log.apply(console, params);
  }
}

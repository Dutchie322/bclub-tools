export function executeForAllGameTabs(action: (tab: chrome.tabs.Tab) => void) {
  [
    '*://*.bondageprojects.com/*',
    '*://*.bondageprojects.elementfx.com/*',
    '*://*.bondage-europe.com/*'
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

import registry from './registry';

type Unregister = () => void;

export function generatePersistentScriptWithWait<K extends any>(
  variableName: string,
  executor: (handshake: string, ...args: K[]) => void | Unregister,
  ...args: K[]
) {
  const handshake = window.crypto.getRandomValues(new Uint32Array(5)).toString();

  const stringifiedArgs = args.map(value => JSON.stringify(value)).join(',');
  const stringifiedBody = `(${executor.toString()})('${handshake}',${stringifiedArgs})`;
  const wrapped = wrapWaitUntilWindowVariable.toString()
    .replace(/\${functionName}/g, executor.name)
    .replace('/** @preserve BODY */', stringifiedBody);

  const id = 'bclubDataPropagator' + window.crypto.getRandomValues(new Uint32Array(1));
  const scriptTag = document.createElement('script');
  const scriptBody = document.createTextNode(`(${wrapped})('${id}','${variableName}');`);
  scriptTag.id = id;
  scriptTag.appendChild(scriptBody);
  document.body.append(scriptTag);

  const listener = ({ data }) => {
    if (data.handshake !== handshake) {
      return;
    }
    delete data.handshake;

    try {
      chrome.runtime.sendMessage(data);
    } catch (e) {
      registry.deregisterAll();
    }
  };

  registry.add(id, () => {
    window.removeEventListener('message', listener);
    document.body.removeChild(scriptTag);
  });

  window.addEventListener('message', listener, false);
}

function wrapWaitUntilWindowVariable(scriptId: string, variableName: string) {
  new Promise((resolve, reject) => {
    const maxWaitTime = 3000;
    const startTime = new Date().getTime();

    function check() {
      const found = !!window[variableName];
      if (found) {
        // console.log('[Bondage Club Tools] Executing function "${functionName}" ' + scriptId);
        resolve(window[variableName]);
      } else if (new Date().getTime() - startTime >= maxWaitTime) {
        reject(`Variable '${variableName}' not found after ${maxWaitTime / 1000} seconds`);
      } else {
        setTimeout(() => { check(); }, 250);
      }
    }

    check();
  })
  .then(() => {
    return /** @preserve BODY */;
  })
  .then((possibleUnregisterFn: unknown) => {
    if (typeof possibleUnregisterFn === 'function') {
      // console.log('[Bondage Club Tools] Found unregister function');
      window.addEventListener('BondageClubTools.Deregister', (event: CustomEvent) => {
        if (event.detail.scriptId !== scriptId) {
          return;
        }
        // console.log('[Bondage Club Tools] Received deregister for "${functionName}" ' + scriptId);
        possibleUnregisterFn();
      });
    }
  })
  .catch(error => {
    console.error('[Bondage Club Tools] ', error);
  });
}

export function generatePersistentScriptWithWait<V extends keyof Window, K extends any>(
  variableName: V,
  executor: (handshake: string, ...args: K[]) => void,
  ...args: K[]
): () => void {
  const handshake = window.crypto.getRandomValues(new Uint32Array(5)).toString();

  const stringifiedArgs = args.map(value => JSON.stringify(value)).join(',');
  const stringifiedBody = `(${executor.toString()})('${handshake}',${stringifiedArgs});`;
  const wrapped = wrapWaitUntilWindowVariable.toString().replace('/** @preserve BODY */', stringifiedBody);

  const scriptTag = document.createElement('script');
  const scriptBody = document.createTextNode(`(${wrapped})('${variableName}');`);
  const id = 'bclubDataPropagator' + window.crypto.getRandomValues(new Uint32Array(1));
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
      // console.log('successfully sent');
      // console.log(data);
    } catch (e) {
      // console.warn('failed to send');
      // console.log(data);
      deregister();
    }
  };

  const deregister = () => {
    window.removeEventListener('message', listener);
    document.body.removeChild(scriptTag);
  };

  window.addEventListener('message', listener, false);

  return deregister;
}

function wrapWaitUntilWindowVariable<V extends keyof Window>(variableName: V) {
  const promise = new Promise((resolve, reject) => {
    const maxWaitTime = 3000;
    const startTime = new Date().getTime();

    function check() {
      const found = !!window[variableName];
      if (found) {
        resolve(window[variableName]);
      } else if (new Date().getTime() - startTime >= maxWaitTime) {
        reject(`variable '${variableName}' not found after ${maxWaitTime / 1000} seconds`);
      } else {
        setTimeout(() => { check(); }, 250);
      }
    }

    check();
  });

  promise.then(() => {
    /** @preserve BODY */
  })
  .catch(error => {
    console.error(error);
  });
}

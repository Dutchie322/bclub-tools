export function generatePersistentScript<K extends any>(
  executor: (handshake: string, ...args: K[]) => void,
  ...args: K[]
) {
  const handshake = window.crypto.getRandomValues(new Uint32Array(5)).toString();

  const stringifiedArgs = args.map(value => JSON.stringify(value)).join(',');
  const stringifiedBody = `(${executor.toString()})('${handshake}',${stringifiedArgs});`;

  const scriptTag = document.createElement('script');
  const scriptBody = document.createTextNode(stringifiedBody);
  const id = 'bclubDataPropagator' + window.crypto.getRandomValues(new Uint32Array(1));
  scriptTag.id = id;
  scriptTag.appendChild(scriptBody);
  document.body.append(scriptTag);

  window.addEventListener('message', ({ data }) => {
    if (data.handshake !== handshake) {
      return;
    }
    delete data.handshake;

    chrome.runtime.sendMessage(data);
  }, false);
}

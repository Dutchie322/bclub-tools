export function generateOneTimeScript<K extends any[], U extends { [key: string]: any }>(
  executor: (args: K) => U,
  ...args: K[]
): Promise<U> {
const { handshake, id } = generateScript<K, U>(executor, args);

return new Promise<U>(resolve => {
  window.addEventListener('message', ({ data }) => {
    if (data.handshake !== handshake) {
      return;
    }
    delete data.handshake;
    resolve(data);
  }, false);
}).finally(() => {
  document.querySelector('#' + id).remove();
});
}

function generateScript<K extends any, U extends {
  [key: string]: any
}>(executor: (...args: K[]) => U, args: K[]) {
  const handshake = window.crypto.getRandomValues(new Uint32Array(5)).toString();

  const stringifiedArgs = args.map(value => JSON.stringify(value)).join(',');
  const stringifiedBody = `(${executor.toString()})(${stringifiedArgs});`;
  const wrapped = wrapExecutorWithReturnValue.toString().replace('/* BODY */ undefined', stringifiedBody);

  const scriptTag = document.createElement('script');
  const scriptBody = document.createTextNode(`(${wrapped})('${handshake}');`);
  const id = 'bclubDataPropagator' + window.crypto.getRandomValues(new Uint32Array(1));
  scriptTag.id = id;
  scriptTag.appendChild(scriptBody);
  document.body.append(scriptTag);

  return { handshake, id };
}

function wrapExecutorWithReturnValue(handshake: string) {
  const result = /* BODY */ undefined;

  window.postMessage({
    handshake,
    ...result
  }, '*');
}

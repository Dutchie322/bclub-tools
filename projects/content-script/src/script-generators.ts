export { generateOneTimeScript } from './generators/one-time-script';
export { generatePersistentScriptWithWait } from './generators/persistent-with-wait';

// export function generatePersistentScript<K extends any>(
//     executor: (...args: K[]) => void,
//     ...args: K[]) {
//   const handshake = window.crypto.getRandomValues(new Uint32Array(5)).toString();

//   const stringifiedArgs = args.map(value => JSON.stringify(value)).join(',');
//   const stringifiedBody = `(${executor.toString()})(${stringifiedArgs});`;
//   const wrapped = wrapVoidExecutor.toString().replace('/* BODY */', stringifiedBody);
//   // callback?

//   const scriptTag = document.createElement('script');
//   const scriptBody = document.createTextNode(`(${wrapped})('${handshake}');`);
//   const id = 'bclubDataPropagator' + window.crypto.getRandomValues(new Uint32Array(1));
//   scriptTag.id = id;
//   scriptTag.appendChild(scriptBody);
//   document.body.append(scriptTag);
// }

// function wrapVoidExecutor(handshake: string) {
//   /* BODY */

//   window.postMessage({
//     handshake
//   }, '*');
// }

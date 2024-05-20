/// <reference types="@types/chrome"/>

let handshake: string;

const listener = ({ data }) => {
  if (!data || !data.handshake || !data.type || !data.event) {
    return;
  }

  if (data.handshake !== handshake) {
    return;
  }

  try {
    chrome.runtime.sendMessage(data);
  } catch (e) {
    window.removeEventListener('message', listener);
  }
}
window.addEventListener('message', listener);

chrome.runtime.sendMessage({
  type: 'content-script',
  event: 'GameStart'
}, response => {
  handshake = response.handshake;
});

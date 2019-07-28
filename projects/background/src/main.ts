/// <reference types="chrome"/>

import './database';
import { writeChatLog } from './database';
import { IServerMessage, IAccountBeep, IEnrichedChatRoomMessage, IAccountQueryResult, ILoginResponse } from 'models';
import { notifyAccountBeep } from './notifications';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.event) {
    return;
  }

  console.log('background received message:');
  console.log(message);

  switch (message.event) {
    case 'AccountBeep':
      handleAccountBeep(message);
      break;
    case 'AccountQueryResult':
      handleAccountQueryResult(message);
      break;
    case 'ChatRoomMessage':
      handleChatRoomMessage(message);
      break;
    case 'LoginResponse':
      handleLoginResponse(message);
      break;
  }
});

function handleAccountBeep(message: IServerMessage<IAccountBeep>) {
  notifyAccountBeep(message.data);
}

function handleAccountQueryResult(message: IServerMessage<IAccountQueryResult>) {
  if (message.data.Query !== 'OnlineFriends') {
    return;
  }

  storeForCurrentTab('online_friends', message.data.Result);
}

function handleChatRoomMessage(message: IServerMessage<IEnrichedChatRoomMessage>) {
  writeChatLog(message.data);
}

function handleLoginResponse(message: IServerMessage<ILoginResponse>) {
  storeForCurrentTab('player', message.data);
}

function storeForCurrentTab(key: string, data: any) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const activeTabId = tabs[0].id;
    chrome.storage.local.set({
      [`${key}_${activeTabId}`]: data
    });
  });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove([`player_${tabId}`, `online_friends_${tabId}`]);
});

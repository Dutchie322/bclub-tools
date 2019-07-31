/// <reference types="chrome"/>

import './database';
import { writeChatLog } from './database';
import { IServerMessage, IAccountBeep, IEnrichedChatRoomMessage, IAccountQueryResult, ILoginResponse, IVariablesUpdate } from 'models';
import { notifyAccountBeep } from './notifications';

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || !message.event) {
    return;
  }

  console.log('background received message:');
  console.log(message);
  console.log(sender);

  switch (message.event) {
    case 'AccountBeep':
      handleAccountBeep(message);
      break;
    case 'AccountQueryResult':
      handleAccountQueryResult(sender.tab.id, message);
      break;
    case 'ChatRoomMessage':
      handleChatRoomMessage(message);
      break;
    case 'LoginResponse':
      handleLoginResponse(sender.tab.id, message);
      break;
    case 'disconnect':
    case 'ForceDisconnect':
      handleDisconnect(sender.tab.id);
      break;
    case 'VariablesUpdate':
      handleVariablesUpdate(sender.tab.id, message);
      break;
  }
});

function handleAccountBeep(message: IServerMessage<IAccountBeep>) {
  notifyAccountBeep(message.data);
}

function handleAccountQueryResult(tabId: number, message: IServerMessage<IAccountQueryResult>) {
  if (message.data.Query !== 'OnlineFriends') {
    return;
  }

  storeForTab(tabId, 'online_friends', message.data.Result);
}

function handleChatRoomMessage(message: IServerMessage<IEnrichedChatRoomMessage>) {
  writeChatLog(message.data);
}

function handleLoginResponse(tabId: number, message: IServerMessage<ILoginResponse>) {
  storeForTab(tabId, 'player', message.data);
}

function handleDisconnect(tabId: number) {
  clearStorageForTab(tabId);
}

function handleVariablesUpdate(tabId: number, message: IServerMessage<IVariablesUpdate>) {
  storeForTab(tabId, 'player', message.data.Player);
}

function storeForTab(tabId: number, key: string, data: any) {
  chrome.storage.local.set({
    [`${key}_${tabId}`]: data
  });
}

function clearStorageForTab(tabId: number) {
  chrome.storage.local.remove([
    `online_friends_${tabId}`,
    `player_${tabId}`
  ]);
}

chrome.tabs.onRemoved.addListener(clearStorageForTab);

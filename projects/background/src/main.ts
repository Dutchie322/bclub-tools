/// <reference types="chrome"/>

import './database';
import { writeChatLog } from './database';
import {
  IAccountBeep,
  IAccountQueryResult,
  IEnrichedChatRoomMessage,
  IServerMessage,
  IVariablesUpdate,
  store,
  clearStorage,
  retrieve,
  IChatRoomSync,
  IChatRoomSearchResult,
} from '../../../models';
import { notifyAccountBeep, notifyFriendChange } from './notifications';

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || !message.event) {
    return;
  }

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
    case 'ChatRoomSearchResult':
      handleChatRoomSearchResult(sender.tab.id, message);
      break;
    case 'ChatRoomSync':
      handleChatRoomSync(sender.tab.id, message);
      break;
    case 'disconnect':
    case 'ForceDisconnect':
      handleDisconnect(sender.tab.id);
      break;
    case 'VariablesUpdate':
      handleVariablesUpdate(sender.tab.id, message);
      break;
    default:
      console.log('background received unhandled message:');
      console.log(message);
      break;
  }
});

chrome.tabs.onRemoved.addListener(clearStorage);

function handleAccountBeep(message: IServerMessage<IAccountBeep>) {
  notifyAccountBeep(message.data);
}

function handleAccountQueryResult(tabId: number, message: IServerMessage<IAccountQueryResult>) {
  if (message.data.Query !== 'OnlineFriends') {
    return;
  }

  retrieve(tabId, 'onlineFriends').then(previous => {
    if (typeof previous === 'undefined') {
      return;
    }

    const current = message.data.Result;
    let cameOnline = [];
    let wentOffline = [];

    cameOnline = current.filter(f => !previous.find(p => p.MemberNumber === f.MemberNumber));
    wentOffline = previous.filter(p => !current.find(f => f.MemberNumber === p.MemberNumber));

    cameOnline.forEach(f => notifyFriendChange('online', f));
    wentOffline.forEach(f => notifyFriendChange('offline', f));
  });

  store(tabId, 'onlineFriends', message.data.Result);
}

function handleChatRoomMessage(message: IServerMessage<IEnrichedChatRoomMessage>) {
  writeChatLog(message.data);
}

function handleChatRoomSearchResult(tabId: number, message: IServerMessage<IChatRoomSearchResult[]>) {
  store(tabId, 'chatRoomSearchResult', message.data);
}

function handleChatRoomSync(tabId: number, message: IServerMessage<IChatRoomSync>) {
  store(tabId, 'chatRoomCharacter', message.data.Character);
}

function handleDisconnect(tabId: number) {
  clearStorage(tabId);
}

function handleVariablesUpdate(tabId: number, message: IServerMessage<IVariablesUpdate>) {
  if (message.data.CurrentScreen === 'Login') {
    clearStorage(tabId);
  } else {
    store(tabId, 'player', message.data.Player);
  }
}

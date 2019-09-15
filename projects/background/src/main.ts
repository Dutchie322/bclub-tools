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
  IClientMessage,
  IEnrichedChatRoomChat,
  retrieveGlobal,
  storeGlobal,
  ISettings,
} from '../../../models';
import { notifyAccountBeep, notifyFriendChange } from './notifications';

chrome.webNavigation.onCompleted.addListener(() => {
  chrome.tabs.executeScript({
    runAt: 'document_idle',
    file: 'content-script/main.js'
  });
}, {
  url: [
    { urlMatches: 'http://www.bondageprojects.com/college/' },
    { urlMatches: 'https://www.bondageprojects.com/college/' },
    { urlMatches: 'https://ben987.x10host.com/'},
    { urlMatches: 'http://ben987.x10host.com/'}
  ]
});

chrome.runtime.onInstalled.addListener(() => {
  // Ensure default settings
  retrieveGlobal('settings').then(settings => {
    storeGlobal('settings', {
      notifications: {
        beeps: false,
        friendOnline: false,
        friendOffline: false,
        ...settings ? settings.notifications : {}
      },
      ...settings
    } as ISettings);
  });

  // Inject content scripts in applicable tabs
  [
    'http://www.bondageprojects.com/college/*',
    'https://www.bondageprojects.com/college/*',
    'http://ben987.x10host.com/*',
    'https://ben987.x10host.com/*'
  ].forEach(url => {
    chrome.tabs.query({
      url
    }, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.executeScript(tab.id, {
          runAt: 'document_idle',
          file: 'content-script/main.js'
        });
      });
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || !message.event) {
    return;
  }

  switch (message.type) {
    case 'client':
      handleClientMessage(message, sender);
      break;
    case 'server':
      handleServerMessage(message, sender);
      break;
    default:
      console.error('Unhandled message:');
      console.log(message);
  }
});

chrome.tabs.onRemoved.addListener(clearStorage);

function handleClientMessage(message: IClientMessage<any>, sender: chrome.runtime.MessageSender) {
  switch (message.event) {
    case 'ChatRoomChat':
      handleChatRoomChat(message);
      break;
    case 'VariablesUpdate':
      handleVariablesUpdate(sender.tab.id, message);
      break;
    default:
      console.error('Unhandled client message:');
      console.log(message);
      break;
  }
}

function handleServerMessage(message: IServerMessage<any>, sender: chrome.runtime.MessageSender) {
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
    default:
      console.error('Unhandled server message:');
      console.log(message);
      break;
  }
}

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

function handleChatRoomChat(message: IClientMessage<IEnrichedChatRoomChat>) {
  if (message.data.Type === 'Whisper') {
    writeChatLog(message.data);
  }
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

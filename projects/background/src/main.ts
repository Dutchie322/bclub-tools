/// <reference types="chrome"/>

import './chat-log';
import { writeChatLog } from './chat-log';
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
  IChatRoomSyncSingle,
  executeForAllGameTabs,
  IPlayer,
  IMember
} from '../../../models';
import { notifyAccountBeep, notifyFriendChange } from './notifications';
import { writeMember, writeFriends, removeChatRoomData, retrieveMember } from './member';

chrome.runtime.onInstalled.addListener(() => {
  // Ensure default settings
  retrieveGlobal('settings').then(settings => {
    storeGlobal('settings', {
      notifications: {
        beeps: false,
        friendOnline: false,
        friendOffline: false,
        ...(settings ? settings.notifications : {})
      },
      tools: {
        fpsCounter: false,
        ...(settings ? settings.tools : {})
      },
      ...settings
    } as ISettings);
  });

  // Inject content scripts in applicable tabs
  executeForAllGameTabs(tab => {
    chrome.tabs.executeScript(tab.id, {
      runAt: 'document_idle',
      file: 'content-script/main.js'
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
      console.error('[Bondage Club Tools] Unhandled message:');
      console.log(message);
  }
});

chrome.tabs.onRemoved.addListener(cleanUpData);

function handleClientMessage(message: IClientMessage<any>, sender: chrome.runtime.MessageSender) {
  switch (message.event) {
    case 'ChatRoomChat':
      handleChatRoomChat(message);
      break;
    case 'VariablesUpdate':
      handleVariablesUpdate(sender.tab.id, message);
      break;
    default:
      console.error('[Bondage Club Tools] Unhandled client message:');
      console.log(message);
      break;
  }
}

function handleServerMessage(message: IServerMessage<any>, sender: chrome.runtime.MessageSender) {
  switch (message.event) {
    case 'AccountBeep':
      handleAccountBeep(sender.tab.id, message);
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
    case 'ChatRoomSyncSingle':
      handleChatRoomSyncSingle(sender.tab.id, message);
      break;
    case 'LoginResponse':
      handleLoginResponse(sender.tab.id, message);
      break;
    case 'disconnect':
    case 'ForceDisconnect':
      handleDisconnect(sender.tab.id);
      break;
    default:
      console.error('[Bondage Club Tools] Unhandled server message:');
      console.log(message);
      break;
  }
}

async function handleAccountBeep(tabId: number, message: IServerMessage<IAccountBeep>) {
  const player = await retrieve(tabId, 'player');
  notifyAccountBeep(message.data, player.MemberNumber);
}

async function handleAccountQueryResult(tabId: number, message: IServerMessage<IAccountQueryResult>) {
  if (message.data.Query !== 'OnlineFriends') {
    return;
  }

  const player = await retrieve(tabId, 'player');
  const friends = await Promise.all(message.data.Result.map(friend => writeMember(player, friend)));

  const previous = await retrieve(tabId, 'onlineFriends');
  if (typeof previous !== 'undefined') {
    const current = friends;
    let cameOnline: IMember[] = [];
    let wentOffline: IMember[] = [];

    cameOnline = current.filter(f => !previous.find(p => p.memberNumber === f.memberNumber));
    wentOffline = previous.filter(p => !current.find(f => f.memberNumber === p.memberNumber));

    cameOnline.forEach(f => notifyFriendChange('online', f));
    await Promise.all(wentOffline.map(async friend => {
      await removeChatRoomData(friend);
      notifyFriendChange('offline', friend);
    }));
  }

  store(tabId, 'onlineFriends', friends);
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

async function handleChatRoomSync(tabId: number, message: IServerMessage<IChatRoomSync>) {
  store(tabId, 'chatRoomCharacter', message.data.Character);

  const player = await retrieve(tabId, 'player');
  message.data.Character.forEach(character => writeMember(player, character));
}

async function handleChatRoomSyncSingle(tabId: number, message: IServerMessage<IChatRoomSyncSingle>) {
  const characters = await retrieve(tabId, 'chatRoomCharacter');
  const i = characters.findIndex(char => char.MemberNumber === message.data.Character.MemberNumber);
  characters[i] = message.data.Character;
  store(tabId, 'chatRoomCharacter', characters);

  const player = await retrieve(tabId, 'player');
  writeMember(player, message.data.Character);
}

function handleLoginResponse(tabId: number, message: IServerMessage<IPlayer>) {
  store(tabId, 'player', message.data);

  writeFriends(message.data);
}

function handleDisconnect(tabId: number) {
  cleanUpData(tabId);
}

function handleVariablesUpdate(tabId: number, message: IServerMessage<IVariablesUpdate>) {
  if (message.data.CurrentScreen === 'Login') {
    cleanUpData(tabId);
    return;
  }

  if (!message.data.InChat) {
    store(tabId, 'chatRoomCharacter', []);
  }
}

async function cleanUpData(tabId: number) {
  const friends = await retrieve(tabId, 'onlineFriends');
  if (friends) {
    await Promise.all(friends.map(friend => removeChatRoomData(friend)));
  }
  clearStorage(tabId);
}

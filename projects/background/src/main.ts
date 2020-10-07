/// <reference types="chrome"/>

import './chat-log';
import { writeChatLog } from './chat-log';
import {
  IAccountBeep,
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
  IStoredPlayer,
  IPlayerWithRelations,
  IAccountQueryOnlineFriendsResult,
  addOrUpdateObjectStore
} from '../../../models';
import { notifyAccountBeep, notifyFriendChange } from './notifications';
import { writeMember, writeFriends, removeChatRoomData, retrieveMember } from './member';

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({
    url: '/index.html?page=/log-viewer'
  });
});

chrome.runtime.onInstalled.addListener(async () => {
  // Ensure default settings
  const settings = await retrieveGlobal('settings');
  await storeGlobal('settings', {
    notifications: {
      beeps: false,
      friendOnline: false,
      friendOffline: false,
      ...(settings ? settings.notifications : {})
    },
    tools: {
      chatRoomRefresh: true,
      fpsCounter: false,
      ...(settings ? settings.tools : {})
    }
  } as ISettings);

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

chrome.tabs.onRemoved.addListener(tabId => cleanUpData(tabId, true));

function handleClientMessage(message: IClientMessage<any>, sender: chrome.runtime.MessageSender) {
  switch (message.event) {
    case 'ChatRoomChat':
      handleChatRoomChat(message);
      break;
    case 'CommonDrawAppearanceBuild':
      handleCommonDrawAppearanceBuild(sender.tab.id, message);
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
      if (message.data.Query === 'OnlineFriends') {
        handleAccountQueryOnlineFriendsResult(sender.tab.id, message);
      }
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

async function handleAccountQueryOnlineFriendsResult(tabId: number, message: IServerMessage<IAccountQueryOnlineFriendsResult>) {
  const player = await retrieve(tabId, 'player');
  const friends = await Promise.all(message.data.Result.map(friend => writeMember(player, friend)));

  const previous = await retrieve(tabId, 'onlineFriends');
  if (typeof previous !== 'undefined') {
    const current = friends;

    const cameOnline = current.filter(f => !previous.find(p => p.memberNumber === f.memberNumber));
    const wentOffline = previous.filter(p => !current.find(f => f.memberNumber === p.memberNumber));

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

function handleLoginResponse(tabId: number, message: IServerMessage<IPlayerWithRelations>) {
  setPlayerLoggedIn(tabId, {
    MemberNumber: message.data.MemberNumber,
    Name: message.data.Name
  });

  writeFriends(message.data);
}

async function handleCommonDrawAppearanceBuild(tabId: number, message: IClientMessage<any>) {
  const player = await retrieve(tabId, 'player');
  const member = await retrieveMember(player.MemberNumber, message.data.MemberNumber);
  if (member) {
    member.appearance = message.data.ImageData;
    await addOrUpdateObjectStore('members', member);
  }
}

function handleDisconnect(tabId: number) {
  cleanUpData(tabId);
}

function handleVariablesUpdate(tabId: number, message: IServerMessage<IVariablesUpdate>) {
  if (message.data.CurrentScreen === 'Login') {
    cleanUpData(tabId);
    return;
  }

  if (typeof message.data.InChat !== 'undefined' && !message.data.InChat) {
    store(tabId, 'chatRoomCharacter', []);
  }

  if (message.data.Player && message.data.Player.MemberNumber > 0) {
    setPlayerLoggedIn(tabId, message.data.Player);
  }
}

function setPlayerLoggedIn(tabId: number, player: IStoredPlayer) {
  store(tabId, 'player', player);

  chrome.browserAction.setPopup({
    tabId,
    popup: 'index.html'
  });
  chrome.browserAction.setTitle({
    tabId,
    title: `${chrome.runtime.getManifest().name}: ${player.Name}`
  });
}

async function cleanUpData(tabId: number, isTabClosed = false) {
  const friends = await retrieve(tabId, 'onlineFriends');
  if (friends) {
    await Promise.all(friends.map(friend => removeChatRoomData(friend)));
  }
  clearStorage(tabId);

  if (!isTabClosed) {
    chrome.browserAction.setPopup({
      tabId,
      popup: ''
    });
    chrome.browserAction.setTitle({
      tabId,
      title: chrome.runtime.getManifest().name
    });
  }
}

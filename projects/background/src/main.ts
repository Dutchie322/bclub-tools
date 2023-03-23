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
  addOrUpdateObjectStore,
  IChatRoomSyncCharacter
} from '../../../models';
import { notifyIncomingMessage } from './notifications';
import { writeMember, writeFriends, removeChatRoomData, retrieveMember } from './member';

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({
    url: '/index.html?page=/log-viewer'
  });
});

chrome.runtime.onInstalled.addListener(async () => {
  // Ensure default settings
  const settings = await retrieveGlobal('settings');

  if (settings) {
    if (settings.tools) {
      if (settings.tools.chatRoomRefresh) {
        delete settings.tools.chatRoomRefresh;
      }
      if (settings.tools.fpsCounter) {
        delete settings.tools.fpsCounter;
      }
      if (settings.tools.wardrobeSize) {
        delete settings.tools.wardrobeSize;
      }
    }
    if (settings.notifications) {
      if (settings.notifications.beeps) {
        delete settings.notifications.beeps;
      }
      if (settings.notifications.friendOnline) {
        delete settings.notifications.friendOnline;
      }
      if (settings.notifications.friendOffline) {
        delete settings.notifications.friendOffline;
      }
      if (settings.notifications.actions) {
        delete settings.notifications.actions;
      }
      if (settings.notifications.mentions) {
        delete settings.notifications.mentions;
      }
      if (settings.notifications.whispers) {
        delete settings.notifications.whispers;
      }
    }
  }

  await storeGlobal('settings', {
    notifications: {
      keywords: [],
      ...(settings ? settings.notifications : {})
    },
    tools: {
      chatRoomRefreshInterval: 0,
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
      if (!message.data.BeepType) {
        handleAccountBeep(sender.tab.id, message);
      }
      break;
    case 'AccountQueryResult':
      if (message.data.Query === 'OnlineFriends') {
        handleAccountQueryOnlineFriendsResult(sender.tab.id, message);
      }
      break;
    case 'ChatRoomMessage':
      handleChatRoomMessage(sender.tab.id, message);
      break;
    case 'ChatRoomSync':
      handleChatRoomSync(sender.tab.id, message);
      break;
    case 'ChatRoomSyncCharacter':
      handleChatRoomSyncSingle(sender.tab.id, message);
      break;
    case 'ChatRoomSyncMemberJoin':
      handleChatRoomSyncSingle(sender.tab.id, message);
      break;
    case 'ChatRoomSyncMemberLeave':
      handleChatRoomSyncMemberLeave(sender.tab.id, message);
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
  // TODO Store beep message if there is any
}

async function handleAccountQueryOnlineFriendsResult(tabId: number, message: IServerMessage<IAccountQueryOnlineFriendsResult>) {
  const player = await retrieve(tabId, 'player');
  const friends = await Promise.all(message.data.Result.map(friend => writeMember(player, friend)));

  store(tabId, 'onlineFriends', friends);
}

function handleChatRoomChat(message: IClientMessage<IEnrichedChatRoomChat>) {
  if (message.data.Type === 'Whisper') {
    writeChatLog(message.data);
  }
}

async function handleChatRoomMessage(tabId: number, message: IServerMessage<IEnrichedChatRoomMessage>) {
  if (message.data.Type === 'Hidden' || message.data.Type === 'Status') {
    // Ignore message types that don't contain useful info.
    return;
  }

  const chatLog = await writeChatLog(message.data);
  if (!message.inFocus) {
    notifyIncomingMessage(tabId, chatLog);
  }
}

async function handleChatRoomSync(tabId: number, message: IServerMessage<IChatRoomSync>) {
  store(tabId, 'chatRoomCharacter', message.data.Character);

  const player = await retrieve(tabId, 'player');
  message.data.Character.forEach(character => writeMember(player, character));
}

async function handleChatRoomSyncSingle(tabId: number, message: IServerMessage<IChatRoomSyncSingle | IChatRoomSyncCharacter>) {
  const characters = await retrieve(tabId, 'chatRoomCharacter');
  const i = characters.findIndex(char => char.MemberNumber === message.data.Character.MemberNumber);
  characters[i] = message.data.Character;
  store(tabId, 'chatRoomCharacter', characters);

  const player = await retrieve(tabId, 'player');
  writeMember(player, message.data.Character);
}

async function handleChatRoomSyncMemberLeave(tabId: number, message: IServerMessage<{ SourceMemberNumber: number }>) {
  const characters = await retrieve(tabId, 'chatRoomCharacter');
  const i = characters.findIndex(char => char.MemberNumber === message.data.SourceMemberNumber);
  characters.splice(i, 1);
  store(tabId, 'chatRoomCharacter', characters);
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
    member.appearanceMetaData = Object.assign({}, member.appearanceMetaData, {
      canvasHeight: message.data.CanvasHeight,
      heightModifier: message.data.HeightModifier,
      heightRatio: message.data.HeightRatio,
      heightRatioProportion: message.data.HeightRatioProportion,
      isInverted: message.data.IsInverted
    });

    await addOrUpdateObjectStore('members', member);
  }
}

function handleDisconnect(tabId: number) {
  cleanUpData(tabId);
}

function handleVariablesUpdate(tabId: number, message: IClientMessage<IVariablesUpdate>) {
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

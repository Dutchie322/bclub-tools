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
  IChatRoomSyncCharacter,
  retrieveMember,
  IClientAccountBeep
} from '../../../models';
import { notifyIncomingMessage } from './notifications';
import { writeMember, writeFriends, removeChatRoomData } from './member';
import { writeBeepMessage } from './beep-message';

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

async function handleClientMessage(message: IClientMessage<any>, sender: chrome.runtime.MessageSender) {
  switch (message.event) {
    case 'AccountBeep':
      await handleClientAccountBeep(sender.tab.id, message);
      break;
    case 'ChatRoomChat':
      await handleChatRoomChat(message);
      break;
    case 'ChatRoomLeave':
      handleChatRoomLeave(sender.tab.id);
      break;
    case 'CommonDrawAppearanceBuild':
      await handleCommonDrawAppearanceBuild(sender.tab.id, message);
      break;
    case 'VariablesUpdate':
      await handleVariablesUpdate(sender.tab.id, message);
      break;
    default:
      console.error('[Bondage Club Tools] Unhandled client message:');
      console.log(message);
      break;
  }
}

async function handleServerMessage(message: IServerMessage<any>, sender: chrome.runtime.MessageSender) {
  switch (message.event) {
    case 'AccountBeep':
      if (!message.data.BeepType) {
        await handleAccountBeep(sender.tab.id, message);
      }
      break;
    case 'AccountQueryResult':
      if (message.data.Query === 'OnlineFriends') {
        await handleAccountQueryOnlineFriendsResult(sender.tab.id, message);
      }
      break;
    case 'ChatRoomMessage':
      await handleChatRoomMessage(sender.tab.id, message);
      break;
    case 'ChatRoomSync':
      await handleChatRoomSync(sender.tab.id, message);
      break;
    case 'ChatRoomSyncCharacter':
      await handleChatRoomSyncSingle(sender.tab.id, message);
      break;
    case 'ChatRoomSyncMemberJoin':
      await handleChatRoomSyncMemberJoin(sender.tab.id, message);
      break;
    case 'ChatRoomSyncMemberLeave':
      await handleChatRoomSyncMemberLeave(sender.tab.id, message);
      break;
    case 'ChatRoomSyncSingle':
      await handleChatRoomSyncSingle(sender.tab.id, message);
      break;
    case 'LoginResponse':
      await handleLoginResponse(sender.tab.id, message);
      break;
    case 'disconnect':
    case 'ForceDisconnect':
      await handleDisconnect(sender.tab.id);
      break;
    default:
      console.error('[Bondage Club Tools] Unhandled server message:');
      console.log(message);
      break;
  }
}

async function handleClientAccountBeep(tabId: number, message: IClientMessage<IClientAccountBeep>) {
  const player = await retrieve(tabId, 'player');
  await writeBeepMessage(player.MemberNumber, message.data, 'Outgoing');
}

async function handleAccountBeep(tabId: number, message: IServerMessage<IAccountBeep>) {
  const player = await retrieve(tabId, 'player');
  await writeBeepMessage(player.MemberNumber, message.data, 'Incoming');
}

async function handleAccountQueryOnlineFriendsResult(tabId: number, message: IServerMessage<IAccountQueryOnlineFriendsResult>) {
  const player = await retrieve(tabId, 'player');
  const friends = await Promise.all(message.data.Result.map(friend => writeMember(player, friend)));

  store(tabId, 'onlineFriends', friends);
}

async function handleChatRoomChat(message: IClientMessage<IEnrichedChatRoomChat>) {
  if (message.data.Type !== 'Whisper') {
    return;
  }

  await writeChatLog(message.data);
}

async function handleChatRoomMessage(tabId: number, message: IServerMessage<IEnrichedChatRoomMessage>) {
  const chatLog = await writeChatLog(message.data);
  if (message.inFocus) {
    return;
  }

  await notifyIncomingMessage(tabId, chatLog);
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

async function handleChatRoomSyncMemberJoin(tabId: number, message: IServerMessage<IChatRoomSyncCharacter>) {
  const characters = await retrieve(tabId, 'chatRoomCharacter');
  characters.push(message.data.Character);
  store(tabId, 'chatRoomCharacter', characters);
}

async function handleChatRoomSyncMemberLeave(tabId: number, message: IServerMessage<{ SourceMemberNumber: number }>) {
  const characters = await retrieve(tabId, 'chatRoomCharacter');
  const i = characters.findIndex(char => char.MemberNumber === message.data.SourceMemberNumber);
  characters.splice(i, 1);
  store(tabId, 'chatRoomCharacter', characters);
}

function handleChatRoomLeave(tabId: number) {
  store(tabId, 'chatRoomCharacter', []);
}

async function handleLoginResponse(tabId: number, message: IServerMessage<IPlayerWithRelations>) {
  setPlayerLoggedIn(tabId, {
    MemberNumber: message.data.MemberNumber,
    Name: message.data.Name
  });

  await writeFriends(message.data);
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

async function handleDisconnect(tabId: number) {
  await cleanUpData(tabId);
}

async function handleVariablesUpdate(tabId: number, message: IClientMessage<IVariablesUpdate>) {
  if (message.data.CurrentScreen === 'Login') {
    await cleanUpData(tabId);
    return;
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

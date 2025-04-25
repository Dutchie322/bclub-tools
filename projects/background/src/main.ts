/// <reference types="chrome"/>

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
  putValue,
  IChatRoomSyncCharacter,
  retrieveMember,
  IClientAccountBeep,
  clearCharacterStorage,
  retrieveAppearance
} from '../../../models';
import { checkForGame } from '../../content-script/src/check-for-game';
import { checkForLoggedInState } from '../../content-script/src/check-for-logged-in-state';
import { importAndHook } from '../../content-script/src/import-and-hook';
import { notifyIncomingMessage } from './notifications';
import { writeMember, removeChatRoomData } from './member';
import { writeBeepMessage } from './beep-message';

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: '/log-viewer/index.html'
  });
});

chrome.runtime.onInstalled.addListener(async () => {
  // Ensure default settings
  const settings = await retrieveGlobal('settings');

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
    chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      files: ['content-script/main.js']
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message', message);

  if (!message || !message.type || !message.event) {
    return undefined;
  }

  switch (message.type) {
    case 'content-script':
      handleContentScriptMessage(message, sender).then(sendResponse);
      break;
    case 'client':
      handleClientMessage(message, sender).then(sendResponse);
      break;
    case 'server':
      handleServerMessage(message, sender).then(sendResponse);
      break;
    default:
      console.error('[Bondage Club Tools] Unhandled message:', JSON.stringify(message));
  }

  return true;
});

chrome.tabs.onRemoved.addListener(tabId => cleanUpData(tabId, true));

async function handleContentScriptMessage(message: any, sender: chrome.runtime.MessageSender) {
  let handshake: string;
  const tabId = sender.tab!.id!;

  switch (message.event) {
    case 'GameStart':
      handshake = self.crypto.randomUUID();
      await store(tabId, 'handshake', handshake);

      chrome.scripting.executeScript({
        func: checkForGame,
        args: [handshake],
        target: {
          tabId
        },
        world: 'MAIN'
      });

      return {
        handshake
      };
    case 'GameLoaded':
      handshake = await retrieve(tabId, 'handshake');
      if (message.handshake !== handshake) {
        console.warn('Invalid handshake for message GameLoaded, ignoring message');
        return undefined;
      }

      await injectScripts(handshake, tabId);
      break;
  }

  return undefined;
}

async function injectScripts(handshake: string, tabId: number) {
  const path = chrome.runtime.getURL('content-script/hooks.js')
  const settings = await retrieveGlobal('settings');
  let results = await chrome.scripting.executeScript({
    target: {
      tabId
    },
    func: importAndHook,
    args: [path, handshake, settings.tools.chatRoomRefreshInterval],
    world: 'MAIN'
  });
  console.log(`Injection result for 'injectHookRegistration':`, results);

  results = await chrome.scripting.executeScript({
    target: {
      tabId: tabId
    },
    func: checkForLoggedInState,
    args: [handshake],
    world: 'MAIN'
  });
  console.log(`Injection results for 'checkForLoggedInState':`, results);
}

async function handleClientMessage(message: IClientMessage<any>, sender: chrome.runtime.MessageSender) {
  const tabId = sender.tab!.id!;
  switch (message.event) {
    case 'AccountBeep':
      await handleClientAccountBeep(tabId, message);
      break;
    case 'ChatRoomChat':
      await handleChatRoomChat(message);
      break;
    case 'ChatRoomLeave':
      await handleChatRoomLeave(tabId);
      break;
    case 'CommonDrawAppearanceBuild':
      await handleCommonDrawAppearanceBuild(tabId, message);
      break;
    case 'VariablesUpdate':
      await handleVariablesUpdate(tabId, message);
      break;
    default:
      console.error('[Bondage Club Tools] Unhandled client message:', message);
      break;
  }
}

async function handleServerMessage(message: IServerMessage<any>, sender: chrome.runtime.MessageSender) {
  const tabId = sender.tab!.id!;
  switch (message.event) {
    case 'AccountBeep':
      if (!message.data.BeepType) {
        await handleAccountBeep(tabId, message);
      }
      break;
    case 'AccountQueryResult':
      if (message.data.Query === 'OnlineFriends') {
        await handleAccountQueryOnlineFriendsResult(tabId, message);
      }
      break;
    case 'ChatRoomMessage':
      await handleChatRoomMessage(tabId, message);
      break;
    case 'ChatRoomSearchResponse':
      await handleChatRoomSearchResponse(tabId, message);
      break;
    case 'ChatRoomSync':
      await handleChatRoomSync(tabId, message);
      break;
    case 'ChatRoomSyncCharacter':
      await handleChatRoomSyncSingle(tabId, message);
      break;
    case 'ChatRoomSyncMemberJoin':
      await handleChatRoomSyncMemberJoin(tabId, message);
      break;
    case 'ChatRoomSyncMemberLeave':
      await handleChatRoomSyncMemberLeave(tabId, message);
      break;
    case 'ChatRoomSyncSingle':
      await handleChatRoomSyncSingle(tabId, message);
      break;
    case 'LoginResponse':
      await handleLoginResponse(tabId, message);
      break;
    default:
      console.error('[Bondage Club Tools] Unhandled server message:', message);
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

  await store(tabId, 'onlineFriends', friends);
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

async function handleChatRoomSearchResponse(tabId: number, message: IServerMessage<string>) {
  if (message.data === 'RoomBanned' || message.data === 'RoomKicked') {
    await store(tabId, 'chatRoomCharacter', []);
  }
}

async function handleChatRoomSync(tabId: number, message: IServerMessage<IChatRoomSync>) {
  await store(tabId, 'chatRoomCharacter', message.data.Character);

  const player = await retrieve(tabId, 'player');
  message.data.Character.forEach(character => writeMember(player, character));
}

async function handleChatRoomSyncSingle(tabId: number, message: IServerMessage<IChatRoomSyncSingle | IChatRoomSyncCharacter>) {
  const characters = await retrieve(tabId, 'chatRoomCharacter');
  const i = characters.findIndex(char => char.MemberNumber === message.data.Character.MemberNumber);
  characters[i] = message.data.Character;
  await store(tabId, 'chatRoomCharacter', characters);

  const player = await retrieve(tabId, 'player');
  await writeMember(player, message.data.Character);
}

async function handleChatRoomSyncMemberJoin(tabId: number, message: IServerMessage<IChatRoomSyncCharacter>) {
  const characters = await retrieve(tabId, 'chatRoomCharacter');
  characters.push(message.data.Character);
  await store(tabId, 'chatRoomCharacter', characters);
}

async function handleChatRoomSyncMemberLeave(tabId: number, message: IServerMessage<{ SourceMemberNumber: number }>) {
  const characters = await retrieve(tabId, 'chatRoomCharacter');
  const i = characters.findIndex(char => char.MemberNumber === message.data.SourceMemberNumber);
  characters.splice(i, 1);
  await store(tabId, 'chatRoomCharacter', characters);
}

async function handleChatRoomLeave(tabId: number) {
  await store(tabId, 'chatRoomCharacter', []);
}

async function handleLoginResponse(tabId: number, message: IServerMessage<IPlayerWithRelations>) {
  await setPlayerLoggedIn(tabId, {
    MemberNumber: message.data.MemberNumber,
    Name: message.data.Name
  });
}

async function handleCommonDrawAppearanceBuild(tabId: number, message: IClientMessage<any>) {
  const player = await retrieve(tabId, 'player');
  let appearance = await retrieveAppearance(player.MemberNumber, message.data.MemberNumber);
  if (!appearance) {
    appearance = {
      contextMemberNumber: player.MemberNumber,
      memberNumber: message.data.MemberNumber,
      appearance: message.data.ImageData,
      appearanceMetaData: {
        canvasHeight: message.data.CanvasHeight,
        heightModifier: message.data.HeightModifier,
        heightRatio: message.data.HeightRatio,
        heightRatioProportion: message.data.HeightRatioProportion,
        isInverted: message.data.IsInverted
      },
      timestamp: new Date()
    };
  } else {
    appearance.appearance = message.data.ImageData;
    appearance.appearanceMetaData = {
      canvasHeight: message.data.CanvasHeight,
      heightModifier: message.data.HeightModifier,
      heightRatio: message.data.HeightRatio,
      heightRatioProportion: message.data.HeightRatioProportion,
      isInverted: message.data.IsInverted
    };
    appearance.timestamp = new Date();
  }

  await putValue('appearances', appearance);

  const member = await retrieveMember(player.MemberNumber, message.data.MemberNumber);
  if (member && member.appearance) {
    delete member.appearance;
    delete member.appearanceMetaData;

    await putValue('members', member);
  }
}

async function handleVariablesUpdate(tabId: number, message: IClientMessage<IVariablesUpdate>) {
  if (message.data.CurrentScreen === 'Login') {
    await cleanUpData(tabId);
    return;
  }

  if (message.data.Player && message.data.Player.MemberNumber > 0) {
    await setPlayerLoggedIn(tabId, message.data.Player);
  }
}

async function setPlayerLoggedIn(tabId: number, player: IStoredPlayer) {
  await store(tabId, 'player', player);

  chrome.action.setPopup({
    tabId,
    popup: 'popup/index.html'
  });
  chrome.action.setTitle({
    tabId,
    title: `${chrome.runtime.getManifest().name}: ${player.Name}`
  });
}

async function cleanUpData(tabId: number, isTabClosed = false) {
  const friends = await retrieve(tabId, 'onlineFriends');
  if (friends) {
    await Promise.all(friends.map(friend => removeChatRoomData(friend)));
  }

  if (isTabClosed) {
    await clearStorage(tabId);
  } else {
    await clearCharacterStorage(tabId);

    chrome.action.setPopup({
      tabId,
      popup: ''
    });
    chrome.action.setTitle({
      tabId,
      title: chrome.runtime.getManifest().name
    });
  }
}

/// <reference types="chrome"/>

import { IAccountBeep, retrieveGlobal, IMember, retrieve, IChatLog, renderContent } from '../../../models';
import { retrieveMember } from './member';

export async function notifyAccountBeep(beep: IAccountBeep, playerMemberNumber: number) {
  const settings = await retrieveGlobal('settings');
  if (!settings.notifications.beeps) {
    return;
  }

  const member = await retrieveMember(playerMemberNumber, beep.MemberNumber);
  const opt = {
    type: 'basic',
    title: `Beep from ${beep.MemberName} (${beep.MemberNumber} - ${member.type})`,
    message: beep.Message
      ? `Included message: ${beep.Message}`
      : beep.ChatRoomName
      ? `They're currently in chatroom '${beep.ChatRoomName}'`
      : '',
    iconUrl: 'assets/bclub-logo.png'
  };
  chrome.notifications.create('', opt);
}

export async function notifyFriendChange(change: 'online' | 'offline', friend: IMember) {
  const settings = await retrieveGlobal('settings');
  if ((change === 'online' && !settings.notifications.friendOnline)
    || (change === 'offline' && !settings.notifications.friendOffline)) {
    return;
  }
  const opt = {
    type: 'basic',
    title: `${friend.memberName} (${friend.memberNumber}) is now ${change}`,
    message: friend.type,
    iconUrl: 'assets/bclub-logo.png'
  };
  chrome.notifications.create('', opt);
}

export async function notifyIncomingMessage(tabId: number, chatLog: IChatLog) {
  const player = await retrieve(tabId, 'player');
  const settings = await retrieveGlobal('settings');

  if (player.MemberNumber === chatLog.sender.id) {
    // Don't notify things we did ourselves.
    return;
  }

  const content = renderContent(chatLog);
  if (chatLog.type === 'Whisper') {
    if (settings.notifications.whispers) {
      const opt = {
        type: 'basic',
        title: `Whisper from ${chatLog.sender.name}`,
        message: content,
        iconUrl: 'assets/bclub-logo.png'
      };
      chrome.notifications.create('', opt);
    }
  } else if (wasMentioned(content, [player.Name, ...settings.notifications.keywords])) {
    switch (chatLog.type) {
      case 'Action':
      case 'Activity':
      case 'ServerMessage':
        if (settings.notifications.actions) {
          const opt = {
            type: 'basic',
            title: `Mentioned by ${chatLog.sender.name}`,
            message: content,
            iconUrl: 'assets/bclub-logo.png'
          };
          chrome.notifications.create('', opt);
        }
        break;
      case 'Emote':
      case 'Chat':
        if (settings.notifications.mentions) {
          const opt = {
            type: 'basic',
            title: `Mentioned by ${chatLog.sender.name}`,
            message: content,
            iconUrl: 'assets/bclub-logo.png'
          };
          chrome.notifications.create('', opt);
        }
        break;
    }
  }
}

function wasMentioned(content: string, keywords: string[]) {
  const regex = new RegExp(`\\b(?:${keywords.map(escapeRegExp).join('|')})\\b`, 'iu');
  return regex.test(content);
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

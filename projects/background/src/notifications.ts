/// <reference types="chrome"/>

import { retrieveGlobal, retrieve, IChatLog, renderContent } from '../../../models';

export async function notifyIncomingMessage(tabId: number, chatLog: IChatLog) {
  const player = await retrieve(tabId, 'player');
  const settings = await retrieveGlobal('settings');

  if (player.MemberNumber === chatLog.sender.id) {
    // Don't notify things we did ourselves.
    return;
  }

  const content = await renderContent(chatLog);
  if (wasMentioned(content, settings.notifications.keywords)) {
    switch (chatLog.type) {
      case 'Action':
      case 'Activity':
      case 'ServerMessage': {
        chrome.notifications.create('', {
          type: 'basic',
          title: `Mentioned by ${chatLog.sender.name}`,
          message: content,
          iconUrl: 'assets/bclub-logo.png'
        });
        break;
      }
      case 'Emote':
      case 'Chat': {
        chrome.notifications.create('', {
          type: 'basic',
          title: `Mentioned by ${chatLog.sender.name}`,
          message: content,
          iconUrl: 'assets/bclub-logo.png'
        });
        break;
      }
    }
  }
}

function wasMentioned(content: string, keywords: string[]) {
  if (!keywords || keywords.length === 0) {
    return false;
  }
  const regex = new RegExp(`\\b(?:${keywords.map(escapeRegExp).join('|')})\\b`, 'iu');
  return regex.test(content);
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

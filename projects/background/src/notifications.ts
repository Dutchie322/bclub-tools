/// <reference types="chrome"/>

import { IAccountBeep, IAccountQueryResultItem, retrieveGlobal } from '../../../models';

export async function notifyAccountBeep(beep: IAccountBeep) {
  const settings = await retrieveGlobal('settings');
  if (!settings.notifications.beeps) {
    return;
  }

  const opt = {
    type: 'basic',
    title: `Beep from ${beep.MemberName}`,
    message: beep.ChatRoomName
      ? `She's currently in chatroom ${beep.ChatRoomName}`
      : 'She isn\'t in a chatroom right now',
    iconUrl: 'assets/bclub-logo.png'
  };
  chrome.notifications.create('', opt);
}

export async function notifyFriendChange(type: 'online' | 'offline', friend: IAccountQueryResultItem) {
  const settings = await retrieveGlobal('settings');
  if ((type === 'online' && !settings.notifications.friendOnline)
    || (type === 'offline' && !settings.notifications.friendOffline)) {
    return;
  }
  const opt = {
    type: 'basic',
    title: `${friend.MemberName} is now ${type}`,
    message: friend.Type,
    iconUrl: 'assets/bclub-logo.png'
  };
  chrome.notifications.create('', opt);
}

/// <reference types="chrome"/>

import { IAccountBeep, IAccountQueryResultItem } from 'models';

export function notifyAccountBeep(beep: IAccountBeep) {
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

export function notifyFriendChange(type: 'online' | 'offline', friend: IAccountQueryResultItem) {
  console.log('notify friend change: ' + type);
  console.log(friend);

  const opt = {
    type: 'basic',
    title: `${friend.MemberName} is now ${type}`,
    message: friend.Type,
    iconUrl: 'assets/bclub-logo.png'
  };
  chrome.notifications.create('', opt);
}

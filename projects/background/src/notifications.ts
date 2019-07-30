/// <reference types="chrome"/>

import { IAccountBeep } from 'models';

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

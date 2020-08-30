/// <reference types="chrome"/>

import { IAccountBeep, retrieveGlobal, IMember } from '../../../models';
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
    message: beep.ChatRoomName
      ? `She's currently in chatroom '${beep.ChatRoomName}'`
      : 'She isn\'t in a chatroom right now',
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

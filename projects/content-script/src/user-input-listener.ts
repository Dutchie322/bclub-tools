/// <reference path="../../../node_modules/bc-stubs/bc/Scripts/Common.d.ts"/>

import {
  IChatRoomCharacter,
  IChatRoomChat,
  IClientMessage,
  IEnrichedChatRoomChat,
  IAppearance,
  IClientAccountBeep,
  IPlayer
} from '../../../models';

let lastExecutedSearch: ServerChatRoomSearchRequest;
let activeTimer: any;

function configureNextRefresh(interval: number) {
  if (interval <= 0) {
    return;
  }

  if (activeTimer) {
    // A new search was done, cancel previous timer.
    clearTimeout(activeTimer);

    activeTimer = undefined;
  }

  activeTimer = setTimeout(() => {
    if (CurrentScreen !== 'ChatSearch') {
      // If we're no longer on the search screen, stop refreshing.
      return;
    }

    if (ChatSearchResultOffset === 0) {
      // Only refresh chat rooms if we're on the first page.
      ServerSend('ChatRoomSearch', lastExecutedSearch);
    } else {
      // Otherwise, we'll try again in the next cycle.
      configureNextRefresh(interval);
    }
  }, interval * 1000);
}

function getName(character: IChatRoomCharacter | IPlayer | ServerAccountDataSynced) {
  return character.Nickname || character.Name;
}

function mapAppearance(appearance: IAppearance | ServerItemBundle) {
  return {
    Group: (appearance as IAppearance).Asset ? (appearance as IAppearance).Asset.Group.Name : appearance.Group,
    Name: (appearance as IAppearance).Asset ? (appearance as IAppearance).Asset.Name : appearance.Name,
    Color: appearance.Color,
    Difficulty: appearance.Difficulty,
    Property: appearance.Property,
    Craft: appearance.Craft
  };
}

function mapCharacter(character: IChatRoomCharacter | ServerAccountDataSynced) {
  return {
    ID: character.ID,
    Name: character.Name,
    Nickname: character.Nickname ? character.Nickname : undefined,
    Title: character.Title,
    Reputation: character.Reputation,
    Creation: character.Creation,
    Lovership: character.Lovership,
    Description: character.Description,
    Owner: character.Owner,
    MemberNumber: character.MemberNumber,
    LabelColor: character.LabelColor,
    ItemPermission: character.ItemPermission,
    Ownership: character.Ownership,
    Appearance: character.Appearance ? character.Appearance.map(mapAppearance) : []
  };
}

export function getEvents(handshake: string, searchInterval: number) {
  // TODO: clean up the types
  return {
    AccountBeep: (event: string, incomingData: IClientAccountBeep) => {
      if (incomingData.BeepType || typeof incomingData.Message !== 'string') {
        // Ignore leashes and telemetry from mods
        return;
      }

      let message = incomingData.Message;
      if (message.includes("\uf124")) {
        // Remove FBC/WCE metadata
        message = message.split("\uf124")[0];
      }
      message = message.trim();
      if (!message) {
        // Sanity check
        return;
      }

      const data = {
        MemberName: incomingData.MemberName || Player.FriendNames.get(incomingData.MemberNumber),
        MemberNumber: incomingData.MemberNumber,
        Message: message
      };

      window.postMessage({
        handshake,
        type: 'client',
        event,
        data,
      } as IClientMessage<IClientAccountBeep>, '*');
    },
    ChatRoomChat: (event: string, incomingData: IChatRoomChat) => {
      if (!ChatRoomData || incomingData.Type === 'Hidden') {
        // A chat room message without chat room data is useless to us.
        // However, this seems to happen when other mods are installed, so we
        // will actively ignore these. Also to avoid (potentially, because we
        // only store whispers from ChatRoomChat events) filling up our
        // database with internal messages from other mods, we will also ignore
        // messages with type Hidden as this seems to be used by several mods
        // out there.
        return;
      }

      const data = {
        Content: incomingData.Content,
        Dictionary: incomingData.Dictionary,
        Target: incomingData.Target,
        Type: incomingData.Type,
        ChatRoom: {
          Background: ChatRoomData.Background,
          Description: ChatRoomData.Description,
          Name: ChatRoomData.Name,
          Character: ChatRoomData.Character.map(mapCharacter)
        },
        SessionId: Player.CharacterID,
        Sender: Player.MemberNumber,
        PlayerName: Player.Name,
        PlayerNickname: Player.Nickname,
        MemberNumber: Player.MemberNumber,
        TargetName: incomingData.Target
          ? getName(ChatRoomData.Character.find(c => c.MemberNumber === incomingData.Target))
          : undefined,
        Timestamp: new Date()
      } as IEnrichedChatRoomChat;

      window.postMessage({
        handshake,
        type: 'client',
        event,
        data,
      } as IClientMessage<IEnrichedChatRoomChat>, '*');
    },
    ChatRoomLeave: (event: string, _: any) => {
      window.postMessage({
        handshake,
        type: 'client',
        event
      } as IClientMessage<void>, '*');
    },
    ChatRoomSearch: (_: string, incomingData: ServerChatRoomSearchRequest) => {
      lastExecutedSearch = incomingData;

      configureNextRefresh(searchInterval);
    }
  };
};

export function forwardUserSentEvent(events: ReturnType<typeof getEvents>, args: [ev: string, ...args: any[]]) {
  try {
    if (!events[args[0]]) {
      return;
    }

    events[args[0]].apply(this, args);
  } catch (e) {
    console.warn('[Bondage Club Tools] Could not handle message, game is not affected:', args, 'Error:', e);
  }
}

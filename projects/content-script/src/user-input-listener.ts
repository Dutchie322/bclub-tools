/// <reference path="../../../node_modules/bc-stubs/bc/Scripts/Common.d.ts"/>

import {
  IChatRoomCharacter,
  IClientMessage,
  IAppearance,
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
    Group: (appearance as IAppearance).Asset ? (appearance as IAppearance).Asset!.Group.Name : appearance.Group,
    Name: (appearance as IAppearance).Asset ? (appearance as IAppearance).Asset!.Name : appearance.Name,
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

export function getEventMappers(searchInterval: number) {
  type MappedClientToServerEvents = {
    [K in keyof ClientToServerEvents]?: (...args: Parameters<ClientToServerEvents[K]>) => false | undefined | {}
  };
  const sentEvents = {
    // Store sent beep messages.
    AccountBeep(data) {
      if (data.BeepType || typeof data.Message !== 'string') {
        // Ignore leashes and telemetry from mods
        return false;
      }

      let message = data.Message;
      if (message.includes("\uf124")) {
        // Remove FBC/WCE metadata
        message = message.split("\uf124")[0];
      }
      message = message.trim();
      if (!message) {
        // Sanity check
        return false;
      }

      return {
        MemberName: Player.FriendNames?.get(data.MemberNumber),
        MemberNumber: data.MemberNumber,
        Message: message
      };
    },
    // Store sent whispers.
    ChatRoomChat(data) {
      if (!ChatRoomData || data.Type === 'Hidden') {
        // A chat room message without chat room data is useless to us.
        // However, this seems to happen when other mods are installed, so we
        // will actively ignore these. Also to avoid (potentially, because we
        // only store whispers from ChatRoomChat events) filling up our
        // database with internal messages from other mods, we will also ignore
        // messages with type Hidden as this seems to be used by several mods
        // out there.
        return false;
      }

      return {
        Content: data.Content,
        Dictionary: data.Dictionary,
        Target: data.Target,
        Type: data.Type,
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
        TargetName: data.Target
          ? getName(ChatRoomData.Character.find(c => c.MemberNumber === data.Target)!)
          : undefined,
        Timestamp: new Date()
      };
    },
    // Let the extension know we left the room.
    ChatRoomLeave() {
      // Should be undefined, but without strict mode it will collapse all
      // typings to `any`. Not useful.
      return {};
    },
    // Not a mapping function, rather store the latest search query.
    ChatRoomSearch(data) {
      lastExecutedSearch = data;

      configureNextRefresh(searchInterval);

      return false as const;
    }
  } satisfies MappedClientToServerEvents;

  return sentEvents;
};

export function forwardUserSentEvents(handshake: string, searchInterval: number) {
  const eventMappers = getEventMappers(searchInterval);
  ServerSocket.prependAnyOutgoing((eventName: string, ...args: any[]) => {
    function isEventHandled(eventName: string): eventName is keyof typeof eventMappers {
      return eventMappers.hasOwnProperty(eventName);
    }

    try {
      if (!isEventHandled(eventName)) {
        return;
      }

      type MappedType = ReturnType<typeof eventMappers[typeof eventName]>;
      const mappedData: MappedType = eventMappers[eventName].apply(eventMappers, args);

      if (mappedData === false) {
        return;
      }

      window.postMessage({
        handshake,
        type: 'client',
        event: eventName,
        data: mappedData,
      } as IClientMessage<MappedType>, '*');
    } catch (e) {
      console.warn('[Bondage Club Tools] Could not handle message, game is not affected:', args, 'Error:', e);
    }
  });
}

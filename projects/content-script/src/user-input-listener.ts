import {
  IChatRoomCharacter,
  IChatRoomChat,
  IChatRoomSearch,
  IClientMessage,
  IEnrichedChatRoomChat,
  IAppearance,
  IClientAccountBeep
} from '../../../models';

export function listenForUserSentEvents(handshake: string, searchInterval: number) {
  let lastExecutedSearch: IChatRoomSearch;
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
        ServerSocket.emit('ChatRoomSearch', lastExecutedSearch);
      } else {
        // Otherwise, we'll try again in the next cycle.
        configureNextRefresh(interval);
      }
    }, interval * 1000);
  }

  function mapAppearance(appearance: IAppearance) {
    return {
      Group: appearance.Group || appearance.Asset.Group.Name,
      Name: appearance.Name || appearance.Asset.Name,
      Color: appearance.Color,
      Difficulty: appearance.Difficulty,
      Property: appearance.Property,
      Craft: appearance.Craft
    };
  }
  function mapCharacter(character: IChatRoomCharacter) {
    return {
      ID: character.ID,
      Name: character.Name,
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
  const eventsToListenTo = {
    AccountBeep: (event: string, incomingData: IClientAccountBeep) => {
      if (incomingData.BeepType || typeof incomingData.Message !== 'string') {
        // Ignore leashes and telemetry
        return;
      }

      let message = incomingData.Message;
      if (message.includes("\uf124")) {
        // Remove FBC metadata
        message = message.split("\uf124")[0];
      }
      message = message.trim();
      if (!message) {
        // Sanity check
        return false;
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
        // A chat room message without chat room data is useless to us. However, this seems to happen when other
        // extensions are installed, so we will actively ignore these. Also to avoid (potentially, because we only
        // store whispers from ChatRoomChat events) filling up our database with internal messages from other
        // extensions, we will also ignore messages with type Hidden as this seems to be used by several extensions
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
        SessionId: Player.OnlineID,
        Sender: Player.MemberNumber,
        PlayerName: Player.Name,
        MemberNumber: Player.MemberNumber,
        TargetName: incomingData.Target
          ? ChatRoomData.Character.find(c => c.MemberNumber === incomingData.Target).Name
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
    ChatRoomLeave: (event: string, __: any) => {
      window.postMessage({
        handshake,
        type: 'client',
        event
      } as IClientMessage<void>, '*');
    },
    ChatRoomSearch: (_: string, incomingData: IChatRoomSearch) => {
      lastExecutedSearch = incomingData;

      configureNextRefresh(searchInterval);
    }
  };

  const handler = {
    get(target, propKey, receiver) {
      const targetValue = Reflect.get(target, propKey, receiver);
      if (typeof targetValue === 'function') {
        return function(...args: any[]) {
          const returnValue = targetValue.apply(this, args);
          if (propKey === 'emit') {
            try {
              if (!eventsToListenTo[args[0]]) {
                return;
              }

              eventsToListenTo[args[0]].apply(this, args);
            } catch (e) {
              console.warn('[Bondage Club Tools] Could not handle message, game is not affected:', args, 'Error:', e);
            }
          }
          return returnValue;
        };
      } else {
        return targetValue;
      }
    }
  } as ProxyHandler<typeof ServerSocket>;

  const proxy = new Proxy(ServerSocket, handler);
  ServerSocket = proxy;
}

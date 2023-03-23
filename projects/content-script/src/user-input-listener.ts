import {
  IChatRoomCharacter,
  IChatRoomChat,
  IChatRoomSearch,
  IClientMessage,
  IEnrichedChatRoomChat
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
    };
  }
  const eventsToListenTo = {
    ChatRoomChat: (event: string, incomingData: IChatRoomChat) => {
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
              console.warn('[Bondage Club Tools] Extension could not handle message, game is not affected:', args, 'Error:', e);
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

import {
  IClientMessage, IEnrichedChatRoomChat, IChatRoomChat, IChatRoomCharacter
} from '../../../models';

export function listenForUserSentEvents(handshake: string) {
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
  const eventsToForward = {
    ChatRoomChat: (data: IChatRoomChat) => ({
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
      SessionId: Player.OnlineID,
      Sender: Player.MemberNumber,
      PlayerName: Player.Name,
      MemberNumber: Player.MemberNumber,
      TargetName: data.Target ? ChatRoomData.Character.find(c => c.MemberNumber === data.Target).Name : undefined,
      Timestamp: new Date()
    } as IEnrichedChatRoomChat)
  } as {[event: string]: (data: any) => any };

  function forwardMessage<TMessage>(event: string, data: any) {
    if (!eventsToForward[event]) {
      return;
    }

    window.postMessage({
      handshake,
      type: 'client',
      event,
      data: eventsToForward[event](data),
    } as IClientMessage<TMessage>, '*');
  }

  const handler = {
    get(target, propKey, receiver) {
      const targetValue = Reflect.get(target, propKey, receiver);
      if (typeof targetValue === 'function') {
        return function(...args: any[]) {
          if (propKey === 'emit') {
            forwardMessage(args[0], args[1]);
          }
          return targetValue.apply(this, args);
        };
      } else {
        return targetValue;
      }
    }
  } as ProxyHandler<typeof ServerSocket>;

  const proxy = new Proxy(ServerSocket, handler);
  ServerSocket = proxy;
}

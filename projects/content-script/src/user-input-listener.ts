import {
  IClientMessage, IEnrichedChatRoomChat, IChatRoomChat
} from '../../../models';

export function listenForUserSentEvents(handshake: string) {
  const eventsToForward = {
    ChatRoomChat: (data: IChatRoomChat) => ({
      ...data,
      ChatRoom: window.ChatRoomData,
      SessionId: window.Player.OnlineID,
      Sender: window.Player.MemberNumber,
      PlayerName: window.Player.Name,
      MemberNumber: window.Player.MemberNumber,
      TargetName: data.Target ? window.ChatRoomData.Character.find(c => c.MemberNumber === data.Target).Name : undefined,
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
  } as ProxyHandler<typeof window.ServerSocket>;

  const proxy = new Proxy(window.ServerSocket, handler);
  window.ServerSocket = proxy;
}

import { generatePersistentScriptWithWait } from './script-generators';
import {
  IClientMessage, IEnrichedChatRoomChat, IChatRoomChat
} from '../../../models';

generatePersistentScriptWithWait('ServerSocket', listenForUserSentEvents);

function listenForUserSentEvents(handshake: string) {
  function forwardMessage<TMessage>(event: string, data: any, enrichData?: {[event: string]: (data: TMessage) => TMessage }) {
    window.postMessage({
      handshake,
      event,
      data: enrichData[event] ? enrichData[event](data) : data,
      type: 'client'
    } as IClientMessage<TMessage>, '*');
  }

  const handler = {
    get(target, propKey, receiver) {
      const targetValue = Reflect.get(target, propKey, receiver);
      if (typeof targetValue === 'function') {
        return function(...args: any[]) {
          if (propKey === 'emit') {
            forwardMessage(args[0], args[1], {
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
            });
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

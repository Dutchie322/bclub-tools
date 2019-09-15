import {
  IChatRoomMessage,
  IEnrichedChatRoomMessage,
  IAccountBeep,
  IServerMessage,
  IChatRoomSearchResult,
  IChatRoomSync,
  IAccountQueryResult
} from '../../../models';

export function listenToServerEvents(handshake: string) {
  function createForwarder<TMessage>(event: string, enrichData?: (data: TMessage) => TMessage) {
    window.ServerSocket.on(event, (data: TMessage) => {
      window.postMessage({
        handshake,
        type: 'server',
        event,
        data: enrichData ? enrichData(data) : data,
      } as IServerMessage<TMessage>, '*');
    });
  }

  createForwarder<IAccountBeep>('AccountBeep');
  createForwarder<IAccountQueryResult>('AccountQueryResult');
  createForwarder<IChatRoomMessage>('ChatRoomMessage', data => ({
    ...data,
    ChatRoom: window.ChatRoomData,
    SessionId: window.Player.OnlineID,
    PlayerName: window.Player.Name,
    MemberNumber: window.Player.MemberNumber,
    Timestamp: new Date()
  } as IEnrichedChatRoomMessage));
  createForwarder<IChatRoomSync>('ChatRoomSync');
  createForwarder<IChatRoomSearchResult[]>('ChatRoomSearchResult');
  createForwarder('disconnect');
  createForwarder('ForceDisconnect');

  // Retrieve online friends on login
  window.ServerSocket.on('LoginResponse', () => {
    window.ServerSocket.emit('AccountQuery', { Query: 'OnlineFriends' });
  });
}

export function pollOnlineFriends() {
  setInterval(() => {
    if (window.CurrentScreen !== 'Login') {
      // const searchInput = document.getElementById('InputSearch') as HTMLInputElement;

      window.ServerSocket.emit('AccountQuery', { Query: 'OnlineFriends' });
      // window.ServerSocket.emit('ChatRoomSearch', { Query: searchInput ? searchInput.value : '' });
    }
  }, 10000);
}

export function pollVariables(handshake: string) {
  function sanitizeObject(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  setInterval(() => {
    window.postMessage({
      handshake,
      type: 'client',
      event: 'VariablesUpdate',
      data: {
        CurrentScreen: sanitizeObject(window.CurrentScreen),
        Player: sanitizeObject(window.Player)
      }
    }, '*');
  }, 1000);
}

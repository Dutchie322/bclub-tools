import {
  IChatRoomMessage,
  IEnrichedChatRoomMessage,
  IAccountBeep,
  IServerMessage,
  IChatRoomSearchResult,
  IChatRoomSync,
  IChatRoomSyncSingle,
  IAccountQueryResult
} from '../../../models';

/**
 * Listens for specific server events and forwards them to the background page for further
 * processing.
 *
 * Note: This function is stringified and injected into the page of the game. All code should
 * be in the body of the function. No imports are supported.
 *
 * @param handshake A generated string to confirm origin of messages.
 */
export function listenToServerEvents(handshake: string) {
  function createForwarder<TIncomingMessage, TOutgoingMessage>(event: string, mapData?: (data: TIncomingMessage) => TOutgoingMessage) {
    window.ServerSocket.on(event, (data: TIncomingMessage) => {
      window.postMessage({
        handshake,
        type: 'server',
        event,
        data: mapData ? mapData(data) : undefined,
      } as IServerMessage<TOutgoingMessage>, '*');
    });
  }

  createForwarder<IAccountBeep, IAccountBeep>('AccountBeep', data => ({
    ChatRoomName: data.ChatRoomName,
    ChatRoomSpace: data.ChatRoomSpace,
    MemberName: data.MemberName,
    MemberNumber: data.MemberNumber
  }));
  createForwarder<IAccountQueryResult, IAccountQueryResult>('AccountQueryResult', data => ({
    Query: data.Query,
    Result: data.Result.map(result => ({
      ChatRoomName: result.ChatRoomName,
      ChatRoomSpace: result.ChatRoomSpace,
      MemberName: result.MemberName,
      MemberNumber: result.MemberNumber,
      Type: result.Type
    }))
  }));
  createForwarder<IChatRoomMessage, IEnrichedChatRoomMessage>('ChatRoomMessage', data => ({
    Content: data.Content,
    Sender: data.Sender,
    Type: data.Type,
    ChatRoom: window.ChatRoomData,
    SessionId: window.Player.OnlineID,
    PlayerName: window.Player.Name,
    MemberNumber: window.Player.MemberNumber,
    Timestamp: new Date()
  }));
  createForwarder<IChatRoomSync, any>('ChatRoomSync', data => ({
    Name: data.Name,
    Description: data.Description,
    Background: data.Background,
    SourceMemberNumber: data.SourceMemberNumber,
    Character: data.Character.map(c => ({
      ID: c.ID,
      Name: c.Name,
      Title: c.Title,
      Reputation: c.Reputation,
      Creation: c.Creation,
      Lovership: c.Lovership,
      Description: c.Description,
      Owner: c.Owner,
      MemberNumber: c.MemberNumber,
      LabelColor: c.LabelColor,
      ItemPermission: c.ItemPermission,
      Ownership: c.Ownership,
    }))
  }));
  createForwarder<IChatRoomSyncSingle, any>('ChatRoomSyncSingle', data => ({
    Character: {
      ID: data.Character.ID,
      Name: data.Character.Name,
      Title: data.Character.Title,
      Reputation: data.Character.Reputation,
      Creation: data.Character.Creation,
      Lovership: data.Character.Lovership,
      Description: data.Character.Description,
      Owner: data.Character.Owner,
      MemberNumber: data.Character.MemberNumber,
      LabelColor: data.Character.LabelColor,
      ItemPermission: data.Character.ItemPermission,
      Ownership: data.Character.Ownership,
    },
    SourceMemberNumber: data.SourceMemberNumber
  }));
  createForwarder<IChatRoomSearchResult[], any>('ChatRoomSearchResult', data => data.map(result => ({
    Name: result.Name,
    Creator: result.Creator,
    MemberCount: result.MemberCount,
    MemberLimit: result.MemberLimit,
    Description: result.Description,
    Friends: result.Friends.map(friend => ({
      MemberName: friend.MemberName,
      MemberNumber: friend.MemberNumber,
      Type: friend.Type
    }))
  })));
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
      window.ServerSocket.emit('AccountQuery', {
        Query: 'OnlineFriends'
      });
    }
    if (window.CurrentScreen === 'ChatSearch') {
      const searchInput = document.getElementById('InputSearch') as HTMLInputElement;
      window.ServerSocket.emit('ChatRoomSearch', {
        Query: searchInput ? searchInput.value.toUpperCase().trim() : '',
        Space: window.ChatRoomSpace
      });
    }
  }, 10000);
}

export function pollVariables(handshake: string) {
  function isInChat() {
    switch(window.CurrentScreen) {
      case 'ChatRoom':
      case 'ChatAdmin':
        return true;
      case 'Appearance':
        return window.CharacterAppearanceReturnRoom === 'ChatRoom';
      case 'InformationSheet':
      case 'Preference':
      case 'FriendList':
      case 'Title':
      case 'OnlineProfile':
        return window.InformationSheetPreviousScreen === 'ChatRoom';
    }
    return false;
  }

  setInterval(() => {
    window.postMessage({
      handshake,
      type: 'client',
      event: 'VariablesUpdate',
      data: {
        ChatRoomSpace: window.ChatRoomSpace,
        CurrentScreen: window.CurrentScreen,
        InChat: isInChat(),
        Player: {
          AccountName: window.Player.AccountName,
          MemberNumber: window.Player.MemberNumber,
          Name: window.Player.Name,
          OnlineID: window.Player.OnlineID
        }
      }
    }, '*');
  }, 1000);
}

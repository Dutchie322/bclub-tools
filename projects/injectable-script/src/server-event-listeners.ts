import {
  IChatRoomMessage,
  IAccountBeep,
  IChatRoomSearchResult,
  IChatRoomSync,
  IChatRoomSyncSingle,
  IAccountQueryResult,
  IChatRoomCharacter,
  ILoginResponse,
  IPlayerWithRelations,
} from '../../../models';

/**
 * Listens for specific server events and forwards them to the background page for further
 * processing.
 *
 * @param postMessage Used to send a message to the background script.
 */
export function listenToServerEvents(postMessage: PostMessageCallback) {
  // tslint:disable-next-line: max-line-length
  function createForwarder<TIncomingMessage, TOutgoingMessage extends object>(event: string, mapData?: (data: TIncomingMessage) => TOutgoingMessage) {
    ServerSocket.listeners(event).unshift((data: TIncomingMessage) => {
      postMessage('server', event, mapData ? mapData(data) : undefined);
    });
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

  createForwarder<IAccountBeep, IAccountBeep>('AccountBeep', data => ({
    BeepType: data.BeepType,
    ChatRoomName: data.ChatRoomName,
    ChatRoomSpace: data.ChatRoomSpace,
    MemberName: data.MemberName,
    MemberNumber: data.MemberNumber,
    Message: data.Message
  }));
  createForwarder<IAccountQueryResult, any>('AccountQueryResult', data => {
    if (data.Query !== 'OnlineFriends') {
      return {
        Query: data.Query
      };
    }

    return {
      Query: data.Query,
      Result: data.Result ? data.Result.map(result => ({
        ChatRoomName: result.ChatRoomName,
        ChatRoomSpace: result.ChatRoomSpace,
        MemberName: result.MemberName,
        MemberNumber: result.MemberNumber,
        Private: result.Private,
        Type: result.Type
      })) : []
    };
  });
  createForwarder<IChatRoomMessage, any>('ChatRoomMessage', data => ({
    Content: data.Content,
    Dictionary: data.Dictionary,
    Sender: data.Sender,
    Type: data.Type,
    ChatRoom: {
      Background: ChatRoomData.Background,
      Description: ChatRoomData.Description,
      Name: ChatRoomData.Name,
      Character: ChatRoomData.Character.map(mapCharacter)
    },
    SessionId: Player.OnlineID,
    PlayerName: Player.Name,
    MemberNumber: Player.MemberNumber,
    Timestamp: new Date()
  }));
  createForwarder<IChatRoomSync, any>('ChatRoomSync', data => ({
    Name: data.Name,
    Description: data.Description,
    Background: data.Background,
    SourceMemberNumber: data.SourceMemberNumber,
    Character: data.Character.map(mapCharacter)
  }));
  createForwarder<IChatRoomSyncSingle, any>('ChatRoomSyncSingle', data => ({
    Character: mapCharacter(data.Character)
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
  createForwarder<ILoginResponse, IPlayerWithRelations>('LoginResponse', data => ({
    MemberNumber: data.MemberNumber,
    Name: data.Name,
    FriendList: data.FriendList,
    Lovership: data.Lovership,
    Ownership: data.Ownership
  }));
  createForwarder('disconnect');
  createForwarder('ForceDisconnect');

  // Retrieve online friends on login
  ServerSocket.on('LoginResponse', () => {
    ServerSocket.emit('AccountQuery', { Query: 'OnlineFriends' });
  });
}

import {
  IChatRoomMessage,
  IAccountBeep,
  IServerMessage,
  IChatRoomSync,
  IChatRoomSyncSingle,
  IAccountQueryResult,
  IChatRoomCharacter,
  ILoginResponse,
  IPlayerWithRelations,
  IChatRoomSyncCharacter,
  IAppearance,
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
  function createForwarder<TIncomingMessage, TOutgoingMessage>(event: string, mapData?: (data: TIncomingMessage) => TOutgoingMessage | false) {
    ServerSocket.listeners(event).unshift((incomingData: TIncomingMessage) => {
      const data = mapData ? mapData(incomingData) : undefined;
      if (data === false) {
        // Don't send data to background script in case mapper return false
        return;
      }

      window.postMessage({
        handshake,
        type: 'server',
        event,
        data,
        inFocus: document.hasFocus()
      } as IServerMessage<TOutgoingMessage>, '*');
    });
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
      return false;
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
  createForwarder<IChatRoomMessage, any>('ChatRoomMessage', data => {
    if (data.Type === 'Hidden' || data.Type === 'Status') {
      // Ignore message types that don't contain useful info.
      return false;
    }

    return {
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
    }
  });
  createForwarder<IChatRoomSync, any>('ChatRoomSync', data => ({
    Name: data.Name,
    Description: data.Description,
    Background: data.Background,
    SourceMemberNumber: data.SourceMemberNumber,
    Character: data.Character.map(mapCharacter)
  }));
  createForwarder<IChatRoomSyncCharacter, any>('ChatRoomSyncCharacter', data => ({
    Character: mapCharacter(data.Character)
  }));
  createForwarder<any, any>('ChatRoomSyncMemberJoin', data => ({
    Character: mapCharacter(data.Character)
  }));
  createForwarder<any, any>('ChatRoomSyncMemberLeave', data => ({
    SourceMemberNumber: data.SourceMemberNumber
  }));
  createForwarder<IChatRoomSyncSingle, any>('ChatRoomSyncSingle', data => ({
    Character: mapCharacter(data.Character)
  }));
  createForwarder<ILoginResponse, IPlayerWithRelations>('LoginResponse', data => ({
    MemberNumber: data.MemberNumber,
    Name: data.Name,
    FriendList: data.FriendList,
    Lovership: data.Lovership,
    Ownership: data.Ownership
  }));
  createForwarder('disconnect');
  createForwarder('ForceDisconnect');
}

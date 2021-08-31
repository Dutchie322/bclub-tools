import { IChatRoomSearch } from 'models';

export function pollOnlineFriends() {
  const timerHandle = setInterval(() => {
    if (CurrentScreen !== 'Login') {
      ServerSocket.emit('AccountQuery', {
        Query: 'OnlineFriends'
      });
    }
  }, 10000);

  return () => {
    clearInterval(timerHandle);
  };
}

export function chatRoomRefresh() {
  const timerHandle = setInterval(() => {
    if (CurrentScreen === 'ChatSearch') {
      const searchInput = document.getElementById('InputSearch') as HTMLInputElement;
      ServerSocket.emit('ChatRoomSearch', {
        Query: searchInput ? searchInput.value.toUpperCase().trim() : '',
        Space: ChatRoomSpace,
        FullRooms: Player.OnlineSettings && Player.OnlineSettings.SearchShowsFullRooms,
        Ignore: ChatSearchIgnoredRooms
      } as IChatRoomSearch);
    }
  }, 10000);

  return () => {
    clearInterval(timerHandle);
  };
}

export function pollVariables(postMessage: PostMessageCallback) {
  function isInChat() {
    switch (CurrentScreen) {
      case 'ChatRoom':
      case 'ChatAdmin':
        return true;
      case 'Appearance':
        return CharacterAppearanceReturnRoom === 'ChatRoom';
      case 'InformationSheet':
      case 'Preference':
      case 'FriendList':
      case 'Title':
      case 'OnlineProfile':
        return InformationSheetPreviousScreen === 'ChatRoom';
    }
    return false;
  }

  setInterval(() => {
    postMessage('client', 'VariablesUpdate', {
      ChatRoomSpace,
      CurrentScreen,
      InChat: isInChat()
    });
  }, 1000);
}

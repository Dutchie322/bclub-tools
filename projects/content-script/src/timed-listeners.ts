import { IChatRoomSearch } from 'models';

export function pollOnlineFriends() {
  const timerHandle = setInterval(() => {
    if (window.CurrentScreen !== 'Login') {
      window.ServerSocket.emit('AccountQuery', {
        Query: 'OnlineFriends'
      });
    }
  }, 10000);

  return () => {
    clearInterval(timerHandle);
  }
}

export function chatRoomRefresh() {
  const timerHandle = setInterval(() => {
    if (window.CurrentScreen === 'ChatSearch') {
      const searchInput = document.getElementById('InputSearch') as HTMLInputElement;
      window.ServerSocket.emit('ChatRoomSearch', {
        Query: searchInput ? searchInput.value.toUpperCase().trim() : '',
        Space: window.ChatRoomSpace,
        FullRooms: (window.Player.ChatSettings && window.Player.ChatSettings.SearchShowsFullRooms)
                || (window.Player.OnlineSettings && window.Player.OnlineSettings.SearchShowsFullRooms),
        Ignore: window.ChatSearchIgnoredRooms
      } as IChatRoomSearch);
    }
  }, 10000);

  return () => {
    clearInterval(timerHandle);
  };
}

export function pollVariables(handshake: string) {
  function isInChat() {
    switch (window.CurrentScreen) {
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
        InChat: isInChat()
      }
    }, '*');
  }, 1000);
}

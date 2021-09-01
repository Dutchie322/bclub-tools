import { isEqual } from 'lodash-es';
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

export function pollVariables(postMessage: PostMessageCallback) {
  let last = {};
  setInterval(() => {
    const current = {
      ChatRoomSpace,
      CurrentScreen,
      InChat: isInChat()
    };

    if (isEqual(current, last)) {
      return;
    }

    postMessage('client', 'VariablesUpdate', current);
    last = current;
  }, 1000);
}

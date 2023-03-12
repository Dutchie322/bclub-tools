export function pollVariables(handshake: string) {
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
    window.postMessage({
      handshake,
      type: 'client',
      event: 'VariablesUpdate',
      data: {
        ChatRoomSpace,
        CurrentScreen,
        InChat: isInChat()
      }
    }, '*');
  }, 1000);
}

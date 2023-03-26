export function requestOnlineFriends() {
  if (CurrentScreen !== 'Login') {
    ServerSocket.emit('AccountQuery', {
      Query: 'OnlineFriends'
    });
  }
}
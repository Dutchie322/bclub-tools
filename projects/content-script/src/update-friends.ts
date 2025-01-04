export function requestOnlineFriends() {
  if (CurrentScreen !== 'Login') {
    ServerSend('AccountQuery', {
      Query: 'OnlineFriends'
    });
  }
}

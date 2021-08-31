export function checkForLoggedInState(postMessage: PostMessageCallback) {
  postMessage('client', 'VariablesUpdate', {
    Player: {
      MemberNumber: Player ? Player.MemberNumber : null,
      Name: Player ? Player.Name : null
    }
  });
}

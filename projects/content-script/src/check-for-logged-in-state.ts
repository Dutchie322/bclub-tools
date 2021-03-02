export function checkForLoggedInState(handshake: string) {
  window.postMessage({
    handshake,
    type: 'client',
    event: 'VariablesUpdate',
    data: {
      Player: {
        MemberNumber: Player ? Player.MemberNumber : null,
        Name: Player ? Player.Name : null
      }
    }
  }, '*');
}

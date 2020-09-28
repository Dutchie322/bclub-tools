export function checkForLoggedInState(handshake: string) {
  window.postMessage({
    handshake,
    type: 'client',
    event: 'VariablesUpdate',
    data: {
      Player: {
        MemberNumber: window.Player.MemberNumber,
        Name: window.Player.Name
      }
    }
  }, '*');
}

export function checkForLoggedInState(handshake: string) {
  window.postMessage({
    handshake,
    type: 'client',
    event: 'VariablesUpdate',
    data: {
      Player: {
        MemberNumber: Player.MemberNumber,
        Name: Player.Name
      }
    }
  }, '*');
}

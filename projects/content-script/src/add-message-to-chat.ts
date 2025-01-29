/// <reference path="../../../node_modules/bc-stubs/bc/Screens/Online/ChatRoom/ChatRoom.d.ts"/>
/// <reference path="../../../node_modules/bc-stubs/bc/Scripts/Common.d.ts"/>

export function addArchiveLinkMessageToChat(link: string) {
  ChatRoomMessageDisplay({
    Type: 'LocalMessage',
    Content: `The chat log of this room is being archived <a href="${link}" target="_blank">here</a>.`
  }, '', Player, {});
}

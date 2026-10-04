/**
 * A chat room visit of a player character, derived from `chatRoomLogs` so the
 * log viewer can sort and page the sessions without reading every chat log.
 */
export interface IChatSessionRecord {
  memberNumber: number;
  sessionId: string;
  chatRoom: string;
  // Upper case chat room name, so sorting on it is case insensitive
  chatRoomSortKey: string;
  // Timestamp of the earliest chat log of this session in this room
  start: Date;
}

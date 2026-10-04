import { executeRequest } from './functions';
import { IChatLog } from './IChatLog';
import { IChatSessionRecord } from './IChatSessionRecord';

/**
 * Creates the `chatSessions` record a chat log belongs to, or `undefined` when
 * the chat log can't be used as such, because writing an invalid key would
 * abort the whole transaction.
 *
 * @param chatLog The chat log to create the session record for
 * @returns The session record with the chat log's timestamp as start
 */
export function createChatSessionRecord(chatLog: IChatLog): IChatSessionRecord | undefined {
  const memberNumber = chatLog?.session?.memberNumber;
  const sessionId = chatLog?.session?.id;
  const chatRoom = chatLog?.chatRoom;
  const start = chatLog?.timestamp;
  if (typeof memberNumber !== 'number' || typeof sessionId !== 'string' || typeof chatRoom !== 'string' ||
      !(start instanceof Date) || isNaN(start.getTime())) {
    return undefined;
  }

  return {
    memberNumber,
    sessionId,
    chatRoom,
    chatRoomSortKey: chatRoom.toLocaleUpperCase(),
    start
  };
}

/**
 * Makes sure the `chatSessions` store contains the sessions of the given chat
 * logs, with the earliest known timestamp as start. The `transaction` must
 * include the `chatSessions` store in readwrite mode.
 *
 * @param transaction The current transaction
 * @param chatLogs The chat logs that were written
 */
export async function recordChatSessions(transaction: IDBTransaction, chatLogs: IChatLog[]) {
  // Determine the earliest start per session first, so writes for the same
  // session don't overwrite each other
  const sessions = new Map<string, IChatSessionRecord>();
  for (const chatLog of chatLogs) {
    const session = createChatSessionRecord(chatLog);
    if (!session) {
      continue;
    }

    const key = JSON.stringify(chatSessionKey(session));
    const known = sessions.get(key);
    if (!known || session.start < known.start) {
      sessions.set(key, session);
    }
  }

  for (const session of sessions.values()) {
    const stored = await executeRequest<IChatSessionRecord>(transaction, t => t.objectStore('chatSessions').get(chatSessionKey(session)));
    if (!stored || session.start < stored.start) {
      await executeRequest(transaction, t => t.objectStore('chatSessions').put(session));
    }
  }
}

function chatSessionKey(session: IChatSessionRecord) {
  return [session.memberNumber, session.sessionId, session.chatRoom];
}

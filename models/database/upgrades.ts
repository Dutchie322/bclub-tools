///////////////////////////////////////////////////////////////////////////////
// Database changelog
//
// Version 5 (included in v0.6.0):
// - Removed type_idx from members
// - Fixed timestamp_idx and type_idx removal from chatRoomLogs
// - Added beepMessages object store
//
// Version 6 (included in v0.7.0):
// - Added appearances object store
// - Added senderMemberNumber_idx to chatRoomLogs
// - Removed chatRoom_idx, senderName_idx and sessionId_idx from chatRoomLogs
//
// Version 7:
// - Added chatSessions object store, filled from the existing chatRoomLogs
// - Added lastSeen_idx, nickname_idx and normalizedNickname_idx to members
///////////////////////////////////////////////////////////////////////////////

import { createChatSessionRecord } from './chat-session-functions';
import { IChatLog } from './IChatLog';

/**
 * Performs the changes needed to get the database to the latest version.
 *
 * For now, the version number is not used to perform upgrades in steps, but
 * rather the state of the database is checked and changes made as necessary.
 * This helps keep the code relatively compact and easy to understand as long
 * as functionality of the extension remains limited, but this might need to
 * change in the future.
 *
 * @param db The database to upgrade
 * @param transaction The upgrade transaction
 */
export function upgradeDatabase(db: IDBDatabase, transaction: IDBTransaction) {
  // chatRoomLogs
  let chatRoomLogsStore: IDBObjectStore;
  if (!db.objectStoreNames.contains('chatRoomLogs')) {
    chatRoomLogsStore = db.createObjectStore('chatRoomLogs', {
      autoIncrement: true,
      keyPath: 'id'
    });
    // Used to show shared rooms
    chatRoomLogsStore.createIndex('senderMemberNumber_idx', ['session.memberNumber', 'sender.id', 'session.id', 'chatRoom']);
    // Used to show overview of player characters
    chatRoomLogsStore.createIndex('sessionMemberNumber_idx', 'session.memberNumber');
    // Used to show chat rooms a character has been in, as well as showing the logs of a room
    chatRoomLogsStore.createIndex('member_session_chatRoom_idx', ['chatRoom', 'session.id', 'session.memberNumber']);
  } else {
    chatRoomLogsStore = transaction.objectStore('chatRoomLogs');
    if (chatRoomLogsStore.indexNames.contains('timestamp_idx')) {
      chatRoomLogsStore.deleteIndex('timestamp_idx');
    }
    if (chatRoomLogsStore.indexNames.contains('type_idx')) {
      chatRoomLogsStore.deleteIndex('type_idx');
    }
    if (chatRoomLogsStore.indexNames.contains('chatRoom_idx')) {
      chatRoomLogsStore.deleteIndex('chatRoom_idx');
    }
    if (chatRoomLogsStore.indexNames.contains('sessionId_idx')) {
      chatRoomLogsStore.deleteIndex('sessionId_idx');
    }
    if (chatRoomLogsStore.indexNames.contains('senderName_idx')) {
      chatRoomLogsStore.deleteIndex('senderName_idx');
    }
    if (!chatRoomLogsStore.indexNames.contains('senderMemberNumber_idx')) {
      chatRoomLogsStore.createIndex('senderMemberNumber_idx', ['session.memberNumber', 'sender.id', 'session.id', 'chatRoom']);
    }
  }

  // chatSessions
  if (!db.objectStoreNames.contains('chatSessions')) {
    const chatSessionsStore = db.createObjectStore('chatSessions', {
      autoIncrement: false,
      keyPath: ['memberNumber', 'sessionId', 'chatRoom']
    });
    // Used to show the sessions of a character sorted by start date
    chatSessionsStore.createIndex('member_start_idx', ['memberNumber', 'start']);
    // Used to show the sessions of a character sorted by chat room
    chatSessionsStore.createIndex('member_chatRoom_idx', ['memberNumber', 'chatRoomSortKey', 'start']);
    fillChatSessions(chatRoomLogsStore, chatSessionsStore);
  }

  // members
  let memberStore: IDBObjectStore;
  if (!db.objectStoreNames.contains('members')) {
    memberStore = db.createObjectStore('members', {
      autoIncrement: false,
      keyPath: ['playerMemberNumber', 'memberNumber']
    });
    memberStore.createIndex('memberName_idx', ['playerMemberNumber', 'memberName']);
  } else {
    memberStore = transaction.objectStore('members');
    if (memberStore.indexNames.contains('type_idx')) {
      memberStore.deleteIndex('type_idx');
    }
  }
  // Used to sort and filter the people of a character
  if (!memberStore.indexNames.contains('lastSeen_idx')) {
    memberStore.createIndex('lastSeen_idx', ['playerMemberNumber', 'lastSeen']);
  }
  if (!memberStore.indexNames.contains('nickname_idx')) {
    memberStore.createIndex('nickname_idx', ['playerMemberNumber', 'nickname']);
  }
  if (!memberStore.indexNames.contains('normalizedNickname_idx')) {
    memberStore.createIndex('normalizedNickname_idx', ['playerMemberNumber', 'normalizedNickname']);
  }

  // appearances
  let appearanceStore: IDBObjectStore;
  if (!db.objectStoreNames.contains('appearances')) {
    appearanceStore = db.createObjectStore('appearances', {
      autoIncrement: false,
      keyPath: ['contextMemberNumber', 'memberNumber']
    });
  }

  // beepMessages
  let beepMessagesStore: IDBObjectStore;
  if (!db.objectStoreNames.contains('beepMessages')) {
    beepMessagesStore = db.createObjectStore('beepMessages', {
      autoIncrement: true,
      keyPath: 'id'
    });
    // Used to retrieve beep message exchanges with a specific person
    beepMessagesStore.createIndex('context_member_idx', ['contextMemberNumber', 'memberNumber']);
  }
}

/**
 * Creates a `chatSessions` record for every session already in `chatRoomLogs`.
 * The start of a session is the timestamp of its first chat log.
 *
 * Only keys are read to find the sessions, and every failing request is
 * skipped instead of aborting the upgrade, so unreadable chat logs can't
 * prevent the database from opening.
 *
 * @param chatRoomLogsStore The chatRoomLogs store of the upgrade transaction
 * @param chatSessionsStore The chatSessions store of the upgrade transaction
 */
function fillChatSessions(chatRoomLogsStore: IDBObjectStore, chatSessionsStore: IDBObjectStore) {
  const skipError = (event: Event) => {
    console.warn('Skipped chat session while filling chatSessions', (event.target as IDBRequest).error);
    event.preventDefault();
    event.stopPropagation();
  };

  // With nextunique, the primary key is the lowest one, i.e. the first chat log
  const request = chatRoomLogsStore.index('member_session_chatRoom_idx').openKeyCursor(null, 'nextunique');
  request.addEventListener('error', skipError);
  request.addEventListener('success', () => {
    const cursor = request.result;
    if (!cursor) {
      return;
    }

    const getRequest = chatRoomLogsStore.get(cursor.primaryKey) as IDBRequest<IChatLog>;
    getRequest.addEventListener('error', skipError);
    getRequest.addEventListener('success', () => {
      const session = createChatSessionRecord(getRequest.result);
      if (session) {
        chatSessionsStore.put(session).addEventListener('error', skipError);
      }
    });
    cursor.continue();
  });
}

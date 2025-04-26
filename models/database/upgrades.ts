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
///////////////////////////////////////////////////////////////////////////////

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

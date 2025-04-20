export type StoreNames = 'appearances' | 'beepMessages' | 'chatRoomLogs' | 'members';

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

export function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = indexedDB.open('bclub-tools', 6);

    openRequest.addEventListener('blocked', () => {
      alert('Could not open database, make sure all tabs are closed and reload.');
      reject(new Error('Open database request blocked'));
    });

    openRequest.addEventListener('error', event => {
      const request = event.target as IDBOpenDBRequest;
      console.error('Error while opening database:', request.error);
      reject(request.error);
    });

    openRequest.addEventListener('upgradeneeded', event => {
      const request = event.target as IDBOpenDBRequest;
      upgradeDatabase(request.result, request.transaction);
    });

    openRequest.addEventListener('success', event => {
      const db = (event.target as IDBOpenDBRequest).result;
      addDatabaseEventHandlers(db);

      resolve(db);
    });
  });
}

function upgradeDatabase(db: IDBDatabase, transaction: IDBTransaction) {
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
      console.time('createIndex');
      chatRoomLogsStore.createIndex('senderMemberNumber_idx', ['session.memberNumber', 'sender.id', 'session.id', 'chatRoom']);
      console.time('createIndex');
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

function addDatabaseEventHandlers(db: IDBDatabase) {
  db.addEventListener('versionchange', () => {
    db.close();
    alert('Database is outdated, please reload the page.');
  });
}

export async function startTransaction(storeNames: StoreNames | StoreNames[], mode: IDBTransactionMode) {
  const db = await openDatabase();
  return db.transaction(storeNames, mode);
}

export async function addOrUpdateObjectStore<T>(storeName: StoreNames, value: T): Promise<T> {
  const transaction = await startTransaction(storeName, 'readwrite');

  return new Promise<T>((resolve, reject) => {
    transaction.addEventListener('error', () => {
      console.error(`Error during transaction for store ${storeName}`, transaction.error);
      reject(transaction.error);
    });

    const store = transaction.objectStore(storeName);
    const request = store.put(value);
    request.addEventListener('error', () => {
      console.error(`Error while writing to store ${storeName}`, request.error);
      reject(request.error);
    });
    request.addEventListener('success', () => {
      resolve(value);
    });
  });
}

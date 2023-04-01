export type StoreNames = 'chatRoomLogs' | 'members' | 'beepMessages';

/**
 * Database changelog
 *
 * Version 5 (included in v0.6.0):
 * - Removed type_idx from members
 * - Fixed timestamp_idx and type_idx removal from chatRoomLogs
 * - Added beepMessages object store
 */

export function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = indexedDB.open('bclub-tools', 5);

    openRequest.addEventListener('blocked', () => {
      alert('Could not open database, make sure all tabs are closed and reload.');
      reject(new Error('Open database request blocked'));
    });

    openRequest.addEventListener('error', event => {
      const request = event.target as IDBOpenDBRequest;
      console.error('Error while opening database:');
      console.error(request.error);
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
    chatRoomLogsStore.createIndex('chatRoom_idx', 'chatRoom');
    chatRoomLogsStore.createIndex('senderName_idx', 'sender.name');
    chatRoomLogsStore.createIndex('sessionId_idx', 'session.id');
    chatRoomLogsStore.createIndex('sessionMemberNumber_idx', 'session.memberNumber');
    chatRoomLogsStore.createIndex('member_session_chatRoom_idx', ['chatRoom', 'session.id', 'session.memberNumber'], { unique: false });
  } else {
    chatRoomLogsStore = transaction.objectStore('chatRoomLogs');
    if (chatRoomLogsStore.indexNames.contains('timestamp_idx')) {
      chatRoomLogsStore.deleteIndex('timestamp_idx');
    }
    if (chatRoomLogsStore.indexNames.contains('type_idx')) {
      chatRoomLogsStore.deleteIndex('type_idx');
    }
  }

  // members
  let memberStore: IDBObjectStore;
  if (!db.objectStoreNames.contains('members')) {
    memberStore = db.createObjectStore('members', {
      autoIncrement: false,
      keyPath: ['playerMemberNumber', 'memberNumber']
    });
    memberStore.createIndex('memberName_idx', ['playerMemberNumber', 'memberName'], { unique: false });
  } else {
    memberStore = transaction.objectStore('members');
    if (memberStore.indexNames.contains('type_idx')) {
      memberStore.deleteIndex('type_idx');
    }
  }

  // beepMessages
  let beepMessagesStore: IDBObjectStore;
  if (!db.objectStoreNames.contains('beepMessages')) {
    beepMessagesStore = db.createObjectStore('beepMessages', {
      autoIncrement: true,
      keyPath: 'id'
    });
    beepMessagesStore.createIndex('context_member_idx', ['contextMemberNumber', 'memberNumber'], { unique: false });
  }
}

function addDatabaseEventHandlers(db: IDBDatabase) {
  db.addEventListener('versionchange', () => {
    db.close();
    alert('Database is outdated, please reload the page.');
  });
}

export function addOrUpdateObjectStore<T>(storeName: StoreNames, value: T): Promise<T> {
  return new Promise<T>(async (resolve, reject) => {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    transaction.addEventListener('error', () => {
      console.error(`Error during transaction for store ${storeName}`);
      console.error(transaction.error);
      reject(transaction.error);
    });

    const store = transaction.objectStore(storeName);
    const request = store.put(value);
    request.addEventListener('error', () => {
      console.error(`Error while writing to store ${storeName}`);
      console.error(request.error);
      reject(request.error);
    });
    request.addEventListener('success', () => {
      resolve(value);
    });
  });
}

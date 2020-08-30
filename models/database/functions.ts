type StoreNames = 'chatRoomLogs' | 'members';

export function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = indexedDB.open('bclub-tools', 4);

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
    if (chatRoomLogsStore.indexNames.contains('timestamp_idx')) {
      chatRoomLogsStore.deleteIndex('timestamp_idx');
    }
    if (chatRoomLogsStore.indexNames.contains('type_idx')) {
      chatRoomLogsStore.deleteIndex('type_idx');
    }
  } else {
    chatRoomLogsStore = transaction.objectStore('chatRoomLogs');
  }
  let memberStore: IDBObjectStore;
  if (!db.objectStoreNames.contains('members')) {
    memberStore = db.createObjectStore('members', {
      autoIncrement: false,
      keyPath: ['playerMemberNumber', 'memberNumber']
    });
    memberStore.createIndex('memberName_idx', ['playerMemberNumber', 'memberName'], { unique: false });
    memberStore.createIndex('type_idx', ['playerMemberNumber', 'type'], { unique: false });
  }
}

function addDatabaseEventHandlers(db: IDBDatabase) {
  db.addEventListener('versionchange', () => {
    db.close();
    alert('Database is outdated, please reload the page.');
  });
}

export async function addOrUpdateObjectStore(storeName: StoreNames, value: any) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, 'readwrite');
  transaction.addEventListener('error', () => {
    console.error(`Error during transaction for store ${storeName}`);
    console.error(transaction.error);
  });

  const store = transaction.objectStore(storeName);
  const request = store.put(value);
  request.addEventListener('error', () => {
    console.error(`Error while writing to store ${storeName}`);
    console.error(request.error);
  });
}

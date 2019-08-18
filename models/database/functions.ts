export function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = indexedDB.open('bclub-tools', 3);

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
  } else {
    chatRoomLogsStore = transaction.objectStore('chatRoomLogs');
  }

  if (!chatRoomLogsStore.indexNames.contains('member_session_chatRoom_idx')) {
    chatRoomLogsStore.createIndex('member_session_chatRoom_idx', ['chatRoom', 'session.id', 'session.memberNumber'], { unique: false });
  }

  if (chatRoomLogsStore.indexNames.contains('timestamp_idx')) {
    chatRoomLogsStore.deleteIndex('timestamp_idx');
  }

  if (chatRoomLogsStore.indexNames.contains('type_idx')) {
    chatRoomLogsStore.deleteIndex('type_idx');
  }
}

function addDatabaseEventHandlers(db: IDBDatabase) {
  db.addEventListener('versionchange', () => {
    db.close();
    alert('Database is outdated, please reload the page.');
  });
}


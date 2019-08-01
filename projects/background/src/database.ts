import { IEnrichedChatRoomMessage } from 'models';

function upgradeDatabase(db: IDBDatabase) {
  switch (db.version) {
    case 1:
      const chatRoomLogsStore = db.createObjectStore('chatRoomLogs', {
        autoIncrement: true,
        keyPath: 'id'
      });
      chatRoomLogsStore.createIndex('chatRoom_idx', 'chatRoom');
      chatRoomLogsStore.createIndex('senderName_idx', 'sender.name');
      chatRoomLogsStore.createIndex('sessionId_idx', 'session.id');
      chatRoomLogsStore.createIndex('sessionMemberNumber_idx', 'session.memberNumber');
      chatRoomLogsStore.createIndex('timestamp_idx', 'timestamp');
      chatRoomLogsStore.createIndex('type_idx', 'type');
  }
}

function addDatabaseEventHandlers(db: IDBDatabase) {
  db.addEventListener('versionchange', () => {
    db.close();
    alert('Database is outdated, please reload the page.');
  });
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const openRequest = indexedDB.open('bclub-tools', 1);

    openRequest.addEventListener('blocked', () => {
      alert('Could not open database, make sure all tabs are closed and reload.');
      reject('blocked');
    });

    openRequest.addEventListener('error', () => {
      console.error('Error while opening database:');
      console.error(openRequest.error);
      reject(openRequest.error);
    });

    openRequest.addEventListener('upgradeneeded', event => {
      const db = (event.target as IDBOpenDBRequest).result;
      upgradeDatabase(db);
    });

    openRequest.addEventListener('success', event => {
      const db = (event.target as IDBOpenDBRequest).result;
      addDatabaseEventHandlers(db);

      resolve(db);
    });
  });
}

export async function writeChatLog(data: IEnrichedChatRoomMessage) {
  const db = await openDatabase();
  const transaction = db.transaction('chatRoomLogs', 'readwrite');
  transaction.addEventListener('error', () => {
    console.error('Error during transaction');
    console.error(transaction.error);
  });

  const chatLogs = transaction.objectStore('chatRoomLogs');
  const chatLog = {
    chatRoom: data.ChatRoom.Name,
    content: data.Content,
    sender: {
      id: data.Sender,
      name: data.ChatRoom.Character.find(c => c.MemberNumber === data.Sender).Name
    },
    session: {
      id: data.SessionId,
      name: data.PlayerName,
      memberNumber: data.MemberNumber
    },
    timestamp: new Date(data.Timestamp),
    type: data.Type
  };

  const request = chatLogs.add(chatLog);
  request.addEventListener('error', () => {
    console.error('Error while writing chat log');
    console.error(request.error);
  });
}

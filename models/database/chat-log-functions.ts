import { startTransaction } from './functions';
import { IChatLog } from './IChatLog';
import { SharedRoom } from './projections/shared-room';

export async function retrieveSharedRooms(playerMemberNumber: number, memberNumber: number) {
  const transaction = await startTransaction('chatRoomLogs', 'readonly');
  return new Promise<SharedRoom[]>((resolve, reject) => {
    // ['session.memberNumber', 'sender.id', 'session.id', 'chatRoom']
    const keyRange = IDBKeyRange.bound([playerMemberNumber, memberNumber], [playerMemberNumber, memberNumber, [], []]);
    const request = transaction.objectStore('chatRoomLogs').index('senderMemberNumber_idx').openCursor(keyRange, 'nextunique');
    const sharedRooms = [] as SharedRoom[];
    request.addEventListener('error', () => {
      console.error('Error while reading store members', request.error);
      reject(request.error);
    });
    request.addEventListener('success', event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (!cursor) {
        resolve(sharedRooms);
        return;
      }

      sharedRooms.push({
        sessionId: cursor.key[2],
        chatRoom: cursor.key[3],
        startDate: (cursor.value as IChatLog).timestamp
      });
      cursor.continue();
    });
  });
}

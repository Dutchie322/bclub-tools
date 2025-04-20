import { startTransaction } from './functions';
import { IBeepMessage } from './IBeepMessage';

export async function retrieveBeepMessages(playerMemberNumber: number, memberNumber: number) {
  const transaction = await startTransaction('beepMessages', 'readonly');
  return new Promise<IBeepMessage[]>((resolve, reject) => {
    const request = transaction.objectStore('beepMessages').index('context_member_idx').getAll([playerMemberNumber, memberNumber]);
    request.addEventListener('error', () => {
      console.error('Error while reading store members', request.error);
      reject(request.error);
    });
    request.addEventListener('success', event => {
      resolve((event.target as IDBRequest<IBeepMessage[]>).result);
    });
  });
}

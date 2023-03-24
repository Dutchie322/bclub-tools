import { openDatabase } from './functions';
import { IMember } from './IMember';

export async function retrieveMember(playerMemberNumber: number, memberNumber: number) {
  const db = await openDatabase();
  const transaction = db.transaction('members', 'readonly');
  return await new Promise<IMember>((resolve, reject) => {
    const request = transaction.objectStore('members').get([playerMemberNumber, memberNumber]);
    request.addEventListener('error', () => {
      console.error(`Error while reading store members`);
      console.error(request.error);
      reject(request.error);
    });
    request.addEventListener('success', event => {
      resolve((event.target as IDBRequest<IMember>).result);
    });
  });
}

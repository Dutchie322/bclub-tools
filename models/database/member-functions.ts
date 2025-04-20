import { Appearance } from './Appearance';
import { startTransaction } from './functions';
import { IMember } from './IMember';

export async function retrieveAppearance(contextMemberNumber: number, memberNumber: number) {
  const transaction = await startTransaction('appearances', 'readonly');
  return new Promise<Appearance>((resolve, reject) => {
    const request = transaction.objectStore('appearances').get([contextMemberNumber, memberNumber]);
    request.addEventListener('error', () => {
      console.error('Error while reading store appearances:', request.error);
      reject(request.error);
    });
    request.addEventListener('success', event => {
      resolve((event.target as IDBRequest<Appearance>).result);
    });
  });
}

export async function retrieveAppearanceWithFallback(contextMemberNumber: number, memberNumber: number): Promise<Appearance | undefined> {
  const result = await retrieveAppearance(contextMemberNumber, memberNumber);
  if (result) {
    return result;
  }

  const member = await retrieveMember(contextMemberNumber, memberNumber);
  if (!member || !member.appearance) {
    return undefined;
  }

  return {
    appearance: member.appearance,
    appearanceMetaData: member.appearanceMetaData,
    contextMemberNumber: member.playerMemberNumber,
    memberNumber: member.memberNumber,
    timestamp: member.lastSeen
  } as Appearance;
}

export async function retrieveMember(playerMemberNumber: number, memberNumber: number) {
  const transaction = await startTransaction('members', 'readonly');
  return new Promise<IMember>((resolve, reject) => {
    const request = transaction.objectStore('members').get([playerMemberNumber, memberNumber]);
    request.addEventListener('error', () => {
      console.error('Error while reading store members', request.error);
      reject(request.error);
    });
    request.addEventListener('success', event => {
      resolve((event.target as IDBRequest<IMember>).result);
    });
  });
}

export async function isMemberKnown(contextMemberNumber: number, memberNumber: number) {
  const transaction = await startTransaction('members', 'readonly');
  return new Promise<boolean>((resolve, reject) => {
    const request = transaction.objectStore('members').get([contextMemberNumber, memberNumber]);
    request.addEventListener('error', () => {
      console.error('Error while reading store members', request.error);
      reject(request.error);
    });
    request.addEventListener('success', event => {
      resolve(!!(event.target as IDBRequest<IMember>).result);
    });
  });
}

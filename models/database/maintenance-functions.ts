import { retrieveGlobal, storeGlobal } from '../storage/functions';
import { openDatabase } from './functions';

/** Time a scheduled maintenance run may spend before pausing. */
const SCHEDULED_TIME_LIMIT = 10_000;
/** Minimum time between the end of one full pass and the start of the next. */
const PASS_INTERVAL = 3_600_000;
/**
 * Maximum time a single transaction stays open. Short transactions keep the
 * members store available for writes and reads from the rest of the extension.
 */
const TRANSACTION_TIME_LIMIT = 250;

type ScanResult =
  | { status: 'finished' }
  | { status: 'paused', lastKey: IDBValidKey }
  | { status: 'error', lastKey: IDBValidKey | undefined };

/**
 * Continues the member database scan where the previous run stopped, for at
 * most `SCHEDULED_TIME_LIMIT` milliseconds. Once a full pass has finished, a
 * new one is only started after `PASS_INTERVAL`.
 */
export async function runScheduledMaintenance() {
  const state = await retrieveGlobal('maintenance');
  if (!state.resumeAfter && Date.now() - (state.lastCompleted ?? 0) < PASS_INTERVAL) {
    return;
  }

  const lastKey = await fixMembers(state.resumeAfter, Date.now() + SCHEDULED_TIME_LIMIT);
  await storeGlobal('maintenance', lastKey === undefined
    ? { lastCompleted: Date.now() }
    : { lastCompleted: state.lastCompleted, resumeAfter: lastKey as [number, number] });
}

/**
 * Scans the entire member database without a time limit.
 */
export async function runFullMaintenance() {
  await fixMembers(undefined, Infinity);
  await storeGlobal('maintenance', { lastCompleted: Date.now() });
}

/**
 * Reads every member record after `startAfter` and deletes the ones that can
 * no longer be read (e.g. "Failed to read large IndexedDB value").
 *
 * @returns The last scanned key if the deadline was reached, or `undefined`
 * if the end of the store was reached.
 */
async function fixMembers(startAfter: IDBValidKey | undefined, deadline: number): Promise<IDBValidKey | undefined> {
  const db = await openDatabase();
  try {
    let lastKey = startAfter;
    while (true) {
      const result = await scanMembers(db, lastKey, Math.min(deadline, Date.now() + TRANSACTION_TIME_LIMIT));
      if (result.status === 'finished') {
        console.log('Fully looped through all member data, everything is retrievable');
        return undefined;
      }

      lastKey = result.lastKey;
      if (result.status === 'error') {
        const faultyKey = await findKeyAfter(db, lastKey);
        if (faultyKey === undefined) {
          // The cursor failed, but there is nothing to remove. Try again in the next pass.
          console.log('Error reading members after', lastKey, 'but no record found to remove');
          return undefined;
        }

        await deleteMember(db, faultyKey);
        // Continue after the faulty key, even if deleting failed, so a broken
        // record can never stall the scan.
        lastKey = faultyKey;
      }

      if (Date.now() >= deadline) {
        return lastKey;
      }
    }
  } finally {
    db.close();
  }
}

function scanMembers(db: IDBDatabase, startAfter: IDBValidKey | undefined, deadline: number) {
  return new Promise<ScanResult>(resolve => {
    let lastKey = startAfter;
    let scanned = 0;
    const range = startAfter === undefined ? null : IDBKeyRange.lowerBound(startAfter, true);
    const request = db.transaction('members', 'readonly').objectStore('members').openCursor(range);
    request.addEventListener('error', event => {
      console.log('Error reading member after', lastKey, request.error);
      // Prevent the error from aborting the transaction and logging it again
      event.preventDefault();
      resolve({ status: 'error', lastKey });
    });
    request.addEventListener('success', () => {
      const cursor = request.result;
      if (!cursor) {
        resolve({ status: 'finished' });
      } else if (scanned > 0 && Date.now() >= deadline) {
        resolve({ status: 'paused', lastKey });
      } else {
        lastKey = cursor.key;
        scanned++;
        cursor.continue();
      }
    });
  });
}

/**
 * Finds the first key after `lastKey`, reading only keys so a broken value is
 * never touched.
 */
function findKeyAfter(db: IDBDatabase, lastKey: IDBValidKey | undefined) {
  return new Promise<IDBValidKey | undefined>(resolve => {
    const range = lastKey === undefined ? null : IDBKeyRange.lowerBound(lastKey, true);
    const request = db.transaction('members', 'readonly').objectStore('members').getAllKeys(range, 1);
    request.addEventListener('error', event => {
      // Database is more severely broken...
      console.log('Error requesting keys after', lastKey, request.error);
      event.preventDefault();
      resolve(undefined);
    });
    request.addEventListener('success', () => resolve(request.result[0]));
  });
}

function deleteMember(db: IDBDatabase, key: IDBValidKey) {
  return new Promise<void>(resolve => {
    const request = db.transaction('members', 'readwrite').objectStore('members').delete(key);
    request.addEventListener('error', event => {
      // Database is more severely broken...
      console.log('Error deleting member with key', key, request.error);
      event.preventDefault();
      resolve();
    });
    request.addEventListener('success', () => {
      console.log('Deleted unreadable member with key', key);
      resolve();
    });
  });
}

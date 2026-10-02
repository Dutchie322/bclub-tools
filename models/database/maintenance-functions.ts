import { IMaintenance } from '../storage/IMaintenance';
import { retrieveGlobal, storeGlobal } from '../storage/functions';
import { Appearance } from './Appearance';
import { dataUrlToBlob } from './appearance-functions';
import { openDatabase } from './functions';

/** Time a scheduled maintenance run may spend before pausing. */
const SCHEDULED_TIME_LIMIT = 10_000;
/** Minimum time between the end of one full pass and the start of the next. */
const PASS_INTERVAL = 3_600_000;
/**
 * Maximum time a single transaction stays open. Short transactions keep the
 * stores available for writes and reads from the rest of the extension.
 */
const TRANSACTION_TIME_LIMIT = 250;

export type MaintainedStore = 'members' | 'appearances';

interface MaintenanceTask<T = any> {
  store: MaintainedStore;
  /** Whether a readable record needs `process` to be called. */
  needsProcessing?: (value: T) => boolean;
  /**
   * Processes a record outside of the scanning transaction. Returns the new
   * value to store, or `undefined` to leave the record as it is.
   */
  process?: (value: T) => Promise<T | undefined>;
  /**
   * Whether the record that is currently stored may be replaced by the
   * processed value, i.e. it hasn't been changed in the meantime.
   */
  isUnchanged?: (original: T, current: T) => boolean;
}

/**
 * The tasks of a maintenance pass, in order. Every store is checked for
 * unreadable records (e.g. "Failed to read large IndexedDB value"), which are
 * deleted.
 */
const TASKS: MaintenanceTask[] = [
  {
    store: 'members'
  },
  {
    // Convert legacy base64 PNG data URLs to WebP blobs.
    store: 'appearances',
    needsProcessing: (appearance: Appearance) => typeof appearance.appearance === 'string',
    process: async (appearance: Appearance) => ({
      ...appearance,
      appearance: await convertToWebp(appearance.appearance as string)
    }),
    isUnchanged: (original: Appearance, current: Appearance) => current.appearance === original.appearance
  } satisfies MaintenanceTask<Appearance>
];

type ScanResult =
  | { status: 'finished' }
  | { status: 'paused', lastKey: IDBValidKey }
  | { status: 'found', key: IDBValidKey, value: any }
  | { status: 'error', lastKey: IDBValidKey | undefined };

/**
 * Continues the maintenance pass where the previous run stopped, for at most
 * `SCHEDULED_TIME_LIMIT` milliseconds. Once a full pass has finished, a new one
 * is only started after `PASS_INTERVAL`.
 */
export async function runScheduledMaintenance() {
  const state = await retrieveGlobal('maintenance');
  if (!state.resume && Date.now() - (state.lastCompleted ?? 0) < PASS_INTERVAL) {
    return;
  }

  const resume = await runTasks(state.resume, Date.now() + SCHEDULED_TIME_LIMIT);
  await storeGlobal('maintenance', resume
    ? { lastCompleted: state.lastCompleted, resume }
    : { lastCompleted: Date.now() });
}

/**
 * Runs an entire maintenance pass without a time limit.
 */
export async function runFullMaintenance() {
  await runTasks(undefined, Infinity);
  await storeGlobal('maintenance', { lastCompleted: Date.now() });
}

/**
 * Runs the tasks from `resume` onwards until they are all finished or the
 * deadline is reached.
 *
 * @returns Where to resume the next time, or `undefined` if all tasks were
 * finished.
 */
async function runTasks(resume: IMaintenance['resume'], deadline: number): Promise<IMaintenance['resume']> {
  const db = await openDatabase();
  try {
    let index = Math.max(0, TASKS.findIndex(task => task.store === resume?.store));
    let lastKey: IDBValidKey | undefined = resume?.after;
    for (; index < TASKS.length; index++) {
      if (Date.now() >= deadline) {
        return { store: TASKS[index].store, after: lastKey as [number, number] };
      }

      lastKey = await runTask(db, TASKS[index], lastKey, deadline);
      if (lastKey !== undefined) {
        return { store: TASKS[index].store, after: lastKey as [number, number] };
      }
    }

    return undefined;
  } finally {
    db.close();
  }
}

/**
 * Reads every record of the task's store after `startAfter`, deletes the ones
 * that can no longer be read and processes the ones that need it.
 *
 * @returns The last handled key if the deadline was reached, or `undefined`
 * if the end of the store was reached.
 */
async function runTask(db: IDBDatabase, task: MaintenanceTask, startAfter: IDBValidKey | undefined, deadline: number): Promise<IDBValidKey | undefined> {
  const { store } = task;
  let lastKey = startAfter;
  while (true) {
    const result = await scanStore(db, task, lastKey, Math.min(deadline, Date.now() + TRANSACTION_TIME_LIMIT));
    if (result.status === 'finished') {
      console.log(`Fully looped through all ${store} data, everything is retrievable`);
      return undefined;
    }

    if (result.status === 'found') {
      await processRecord(db, task, result.key, result.value);
      lastKey = result.key;
    } else if (result.status === 'error') {
      const faultyKey = await findKeyAfter(db, store, result.lastKey);
      if (faultyKey === undefined) {
        // The cursor failed, but there is nothing to remove. Try again in the next pass.
        console.log(`Error reading ${store} after`, result.lastKey, 'but no record found to remove');
        return undefined;
      }

      await deleteRecord(db, store, faultyKey);
      // Continue after the faulty key, even if deleting failed, so a broken
      // record can never stall the scan.
      lastKey = faultyKey;
    } else {
      lastKey = result.lastKey;
    }

    if (Date.now() >= deadline) {
      return lastKey;
    }
  }
}

/**
 * Opens a cursor after `startAfter` and stops at the first record that needs
 * processing, at a read error, or once the deadline is reached.
 */
function scanStore(db: IDBDatabase, task: MaintenanceTask, startAfter: IDBValidKey | undefined, deadline: number) {
  return new Promise<ScanResult>(resolve => {
    let lastKey = startAfter;
    let scanned = 0;
    const range = startAfter === undefined ? null : IDBKeyRange.lowerBound(startAfter, true);
    const request = db.transaction(task.store, 'readonly').objectStore(task.store).openCursor(range);
    request.addEventListener('error', event => {
      console.log(`Error reading ${task.store} after`, lastKey, request.error);
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
      } else if (task.needsProcessing?.(cursor.value)) {
        resolve({ status: 'found', key: cursor.key, value: cursor.value });
      } else {
        lastKey = cursor.key;
        scanned++;
        cursor.continue();
      }
    });
  });
}

/**
 * Processes a record and stores the result, unless the record was changed
 * while processing. Failures are logged and skipped.
 */
async function processRecord(db: IDBDatabase, task: MaintenanceTask, key: IDBValidKey, value: any) {
  let processed: any;
  try {
    processed = await task.process!(value);
  } catch (e) {
    console.log(`Error processing ${task.store} with key`, key, e);
    return;
  }

  if (processed === undefined) {
    return;
  }

  await new Promise<void>(resolve => {
    const transaction = db.transaction(task.store, 'readwrite');
    const objectStore = transaction.objectStore(task.store);
    const request = objectStore.get(key);
    request.addEventListener('success', () => {
      if (request.result && task.isUnchanged?.(value, request.result) !== false) {
        objectStore.put(processed);
      }
    });
    transaction.addEventListener('complete', () => {
      console.log(`Processed ${task.store} with key`, key);
      resolve();
    });
    transaction.addEventListener('error', event => {
      console.log(`Error storing processed ${task.store} with key`, key, transaction.error);
      event.preventDefault();
    });
    transaction.addEventListener('abort', () => resolve());
  });
}

/**
 * Finds the first key after `lastKey`, reading only keys so a broken value is
 * never touched.
 */
function findKeyAfter(db: IDBDatabase, store: MaintainedStore, lastKey: IDBValidKey | undefined) {
  return new Promise<IDBValidKey | undefined>(resolve => {
    const range = lastKey === undefined ? null : IDBKeyRange.lowerBound(lastKey, true);
    const request = db.transaction(store, 'readonly').objectStore(store).getAllKeys(range, 1);
    request.addEventListener('error', event => {
      // Database is more severely broken...
      console.log('Error requesting keys after', lastKey, request.error);
      event.preventDefault();
      resolve(undefined);
    });
    request.addEventListener('success', () => resolve(request.result[0]));
  });
}

function deleteRecord(db: IDBDatabase, store: MaintainedStore, key: IDBValidKey) {
  return new Promise<void>(resolve => {
    const request = db.transaction(store, 'readwrite').objectStore(store).delete(key);
    request.addEventListener('error', event => {
      // Database is more severely broken...
      console.log(`Error deleting ${store} with key`, key, request.error);
      event.preventDefault();
      resolve();
    });
    request.addEventListener('success', () => {
      console.log(`Deleted unreadable ${store} with key`, key);
      resolve();
    });
  });
}

/**
 * Re-encodes an image data URL as WebP, with the same quality the game hook
 * uses. Falls back to a Blob of the original image if the browser can't
 * encode WebP. Works in both documents and workers.
 */
async function convertToWebp(dataUrl: string): Promise<Blob> {
  const original = dataUrlToBlob(dataUrl);
  const bitmap = await createImageBitmap(original);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
    const webp = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
    return webp.type === 'image/webp' ? webp : original;
  } finally {
    bitmap.close();
  }
}

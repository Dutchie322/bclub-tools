import { upgradeDatabase } from "./upgrades";

export type StoreNames = 'appearances' | 'beepMessages' | 'chatRoomLogs' | 'members';
type TransactionModes = Exclude<IDBTransactionMode, 'versionchange'>;

/**
 * Opens a connection to the database, performs upgrades as needed and listens
 * to blocked and error events while wrapping the operation in a convenient
 * promise.
 *
 * @returns The database connection
 */
export function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('bclub-tools', 6);

    request.addEventListener('blocked', () => {
      alert('Could not open database, make sure all tabs are closed and reload.');
      reject(new Error('Open database request blocked'));
    });

    request.addEventListener('error', () => {
      console.error('Error while opening database:', request.error);
      reject(request.error);
    });

    request.addEventListener('upgradeneeded', () => {
      upgradeDatabase(request.result, request.transaction!);
    });

    request.addEventListener('success', () => {
      const db = request.result;
      db.addEventListener('versionchange', () => {
        db.close();
        alert('Database is outdated, please reload the page.');
      });

      resolve(db);
    });
  });
}

/**
 * Opens the database and creates a transaction for a database operation,
 * wrapped in a promise. Also attaches an error handler that simply logs any
 * error that happens inside the transaction.
 *
 * @param storeNames The name(s) of the object store to create a transaction for
 * @param mode Readonly or readwrite transaction
 * @returns The newly created transaction
 */
export async function startTransaction(storeNames: StoreNames | StoreNames[], mode: TransactionModes) {
  const db = await openDatabase();
  const transaction = db.transaction(storeNames, mode);
  transaction.addEventListener('error', () => {
    console.error('Error in transaction', transaction.error);
  });

  return transaction;
}

/**
 * Executes `action` on the given `transaction` and returns the result of
 * `action`. Wraps it all in a promise, with errors causing the promise to be
 * rejected and logging the error.
 *
 * @param transaction The current transaction
 * @param action The action to perform
 * @returns The result of `action`
 */
export function executeRequest<T = any>(transaction: IDBTransaction, action: (transaction: IDBTransaction) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = action(transaction);
    request.addEventListener('success', () => {
      resolve(request.result);
    });
    request.addEventListener('error', () => {
      console.error('Error during request', request.error);
      reject(request.error);
    });
  });
}

/**
 * Creates a transaction and performs the `action`. Mostly a convenience
 * function.
 *
 * @param storeNames The name(s) of the object store to create a transaction for
 * @param mode Readonly or readwrite transaction
 * @param action The action to perform with the opened transaction
 * @returns The result of `action`
 */
export async function executeInTransaction<T = any>(storeNames: StoreNames | StoreNames[], mode: TransactionModes, action: (transaction: IDBTransaction) => IDBRequest<T>): Promise<T> {
  const transaction = await startTransaction(storeNames, mode);
  return executeRequest(transaction, action);
}

/**
 * Performs a key lookup using the specified `query` and either assigns the
 * properties from the partial `value` to the object already in the database or
 * inserts the `value` as-is if there was nothing found for the given `query`.
 *
 * Note that the `query` is only used for lookup, and assumes the store uses
 * in-line keys which means that any update has to contain the key values in
 * the `value` as well.
 *
 * @param transaction The current transaction
 * @param storeName The name of the object store to update
 * @param query The identifying key to search for
 * @param value The value to insert or partial update
 * @returns The value as it is in the database after the operation
 */
export async function upsertValue<T, U extends Partial<T>>(transaction: IDBTransaction, storeName: StoreNames, query: IDBValidKey | IDBKeyRange, value: U): Promise<T | U> {
  const storedValue = await executeRequest(transaction, t => t.objectStore(storeName).get(query) as IDBRequest<T>);
  if (storedValue) {
    const newValue = Object.assign(value, storedValue);
    await executeRequest(transaction, t => t.objectStore(storeName).put(newValue));
    return newValue;
  } else {
    await executeRequest(transaction, t => t.objectStore(storeName).add(value));
    return value;
  }
}

export async function putValue<T>(storeName: StoreNames, value: T): Promise<T> {
  await executeInTransaction(storeName, 'readwrite', t => t.objectStore(storeName).put(value));
  return value;
}

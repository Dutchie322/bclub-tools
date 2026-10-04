/**
 * Wraps an IndexedDB request in a promise.
 */
export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
}

/**
 * Skips `offset` records of the cursor and collects the values of the next
 * `count` records.
 *
 * @param request The request of an opened cursor
 * @param offset The number of records to skip
 * @param count The maximum number of values to return
 */
export function readCursorPage<T>(request: IDBRequest<IDBCursorWithValue | null>, offset: number, count: number): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const values: T[] = [];
    let skipped = offset === 0;
    request.addEventListener('error', () => reject(request.error));
    request.addEventListener('success', () => {
      const cursor = request.result;
      if (!cursor || values.length >= count) {
        resolve(values);
        return;
      }

      if (!skipped) {
        skipped = true;
        cursor.advance(offset);
        return;
      }

      values.push(cursor.value);
      if (values.length < count) {
        cursor.continue();
      } else {
        resolve(values);
      }
    });
  });
}

/**
 * Collects the primary keys of all records in the index range whose index key
 * matches the predicate. Only keys are read, not the values.
 *
 * @param index The index to scan
 * @param range The range of index keys to scan
 * @param predicate Test for the index key
 */
export function findPrimaryKeys<K extends IDBValidKey>(index: IDBIndex, range: IDBKeyRange, predicate: (key: IDBValidKey) => boolean): Promise<K[]> {
  return new Promise((resolve, reject) => {
    const keys: K[] = [];
    const request = index.openKeyCursor(range);
    request.addEventListener('error', () => reject(request.error));
    request.addEventListener('success', () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(keys);
        return;
      }

      if (predicate(cursor.key)) {
        keys.push(cursor.primaryKey as K);
      }
      cursor.continue();
    });
  });
}

/**
 * The range of all keys in a store or index whose (compound) key starts with
 * `first`. Arrays sort after every other key type, so `[first, []]` is beyond
 * any `[first, ...]` key.
 */
export function startsWithRange(first: IDBValidKey): IDBKeyRange {
  return IDBKeyRange.bound([first], [first, []]);
}

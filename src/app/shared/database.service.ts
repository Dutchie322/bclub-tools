import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { openDatabase, StoreNames } from 'models';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private db: IDBDatabase;

  public get objectStoreNames() {
    return this.connect().then(db => {
      return Array.from(db.objectStoreNames) as StoreNames[];
    });
  }

  private async connect(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await openDatabase();
    }

    return this.db;
  }

  public calculateTableSize(storeName: StoreNames) {
    return new Observable<number>(subscriber => {
      let size = 0;
      this.transaction(storeName).then(transaction => {
        const request = transaction.objectStore(storeName)
          .openCursor();

        request.addEventListener('success', event => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const storedObject = cursor.value;
            delete storedObject.id;

            size += this.calculateSize(storedObject);

            subscriber.next(size);
            cursor.continue();
          } else {
            subscriber.next(size);
            subscriber.complete();
          }
        });

        request.addEventListener('error', event => {
          subscriber.error((event.target as IDBRequest<IDBCursorWithValue>).error);
        });
      });
    });
  }

  private calculateSize(value: any, key: any = ''): number {
    if (value === null || value === undefined) {
      return 0;
    }

    let size = String(key).length;

    if (Array.isArray(value)) {
      size += value.reduce((prev, cur, i) => prev + this.calculateSize(cur, i), 0);
    } else if (value instanceof Date && !isNaN(value.getTime())) {
      size += value.toISOString().length;
    } else if (typeof value === 'object' && value !== null) {
      for (const property in value) {
        if (Object.prototype.hasOwnProperty.call(value, property)) {
          size += this.calculateSize(value[property], property);
        }
      }
    } else {
      size += String(value).length;
    }

    return size;
  }

  public async cursor<T>(storeName: StoreNames, range?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): Promise<Observable<T>> {
    const transaction = await this.transaction(storeName, 'readonly');
    return new Observable<T>(subscriber => {
      const request = transaction.objectStore(storeName).openCursor(range, direction);
      request.addEventListener('success', event => {
        const result = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (result) {
          subscriber.next(result.value);
          result.continue();
        } else {
          subscriber.complete();
        }
      });
      request.addEventListener('error', event => {
        subscriber.error(event);
      });
    });
  }

  public async read<T>(storeName: StoreNames, operation: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const transaction = await this.transaction(storeName, 'readonly');
    const objectStore = transaction.objectStore(storeName);
    return this.wrapObjectStore(objectStore, operation);
  }

  public async write<T>(storeName: StoreNames, operation: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const transaction = await this.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    return this.wrapObjectStore(objectStore, operation);
  }

  private async wrapObjectStore<T>(objectStore: IDBObjectStore, operation: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = operation(objectStore);
      request.addEventListener('success', event => {
        resolve((event.target as IDBRequest<T>).result);
      });
      request.addEventListener('error', event => {
        reject(event);
      });
    });
  }

  public async transaction(storeNames: StoreNames | StoreNames[], mode?: IDBTransactionMode): Promise<IDBTransaction> {
    const db = await this.connect();
    return db.transaction(storeNames, mode);
  }
}

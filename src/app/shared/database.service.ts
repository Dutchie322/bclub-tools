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

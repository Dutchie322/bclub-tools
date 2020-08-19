import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { openDatabase } from 'models';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private db: IDBDatabase;

  public get objectStoreNames() {
    return this.connect().then(db => {
      return Array.from(db.objectStoreNames);
    });
  }

  constructor() {}

  private async connect(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await openDatabase();
    }

    return this.db;
  }

  public calculateTableSize(storeName: string) {
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
            const json = JSON.stringify(storedObject, null, 2);
            size += json.length;
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

  public async transaction(storeNames: string | string[], mode?: IDBTransactionMode): Promise<IDBTransaction> {
    const db = await this.connect();
    return db.transaction(storeNames, mode);
  }
}

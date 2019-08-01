import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private db: IDBDatabase;

  constructor() {}

  private connect(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    return new Promise((resolve, reject) => {
      indexedDB
        .open('bclub-tools', 1)
        .addEventListener('success', event => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(this.db);
        });
    });
  }

  public async transaction(storeNames: string | string[], mode?: IDBTransactionMode): Promise<IDBTransaction> {
    const db = await this.connect();
    return db.transaction(storeNames, mode);
  }
}

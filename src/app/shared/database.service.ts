import { Injectable } from '@angular/core';
import { openDatabase } from 'models';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  private db: IDBDatabase;

  constructor() {}

  private async connect(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await openDatabase();
    }

    return this.db;
  }

  public async transaction(storeNames: string | string[], mode?: IDBTransactionMode): Promise<IDBTransaction> {
    const db = await this.connect();
    return db.transaction(storeNames, mode);
  }
}

import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { retrieveGlobal, storeGlobal } from 'models';
import { ChatLogsService } from './chat-logs.service';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  public constructor(
    private chatLogsService: ChatLogsService,
    private databaseService: DatabaseService
  ) {}

  public async runWithCheck(): Promise<void> {
    const lastRun = await retrieveGlobal('lastMaintenanceRun');
    if (new Date().valueOf() - lastRun.valueOf() < 3600000) {
      // Run once per hour
      return;
    }

    this.runImmediately();
  }

  public async runImmediately(): Promise<void> {
    const characters = await this.chatLogsService.findPlayerCharacters();
    for (const character of characters) {
      while (!await this.fixMembers(character.memberNumber));
    }
    await storeGlobal('lastMaintenanceRun', new Date());
  }

  private async fixMembers(memberNumber: number) {
    let transaction = await this.databaseService.transaction('members');
    return new Promise((resolve, reject) => {
      let lastGoodKey: IDBValidKey;
      const request = transaction.objectStore('members').openCursor(IDBKeyRange.bound([memberNumber, 0], [memberNumber, Infinity]));
      request.addEventListener('error', event => {
        console.log('Error requesting key after', lastGoodKey, event, request);
        reject({ lastGoodKey });
      });
      request.addEventListener('success', event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          lastGoodKey = cursor.key;
          cursor.continue();
        } else {
          resolve(true);
        }
      });
    }).then(() => {
      console.log('Fully looped through all data, everything is retrievable for member number', memberNumber);
      return true;
    }, async (err) => {
      transaction = await this.databaseService.transaction('members');
      return new Promise<boolean>(resolve => {
        const request = transaction.objectStore('members').getAllKeys(IDBKeyRange.lowerBound(err.lastGoodKey, true));
        request.addEventListener('error', innerErr => {
          // Database is more severely broken...
          console.log('Error requesting keys after', err.lastGoodKey, innerErr);
          resolve(true);
        });
        request.addEventListener('success', event => {
          const faultyKey = (event.target as IDBRequest<IDBValidKey[]>).result[0];
          this.databaseService.transaction('members', 'readwrite').then(transaction => {
            const request = transaction.objectStore('members').delete(faultyKey);
            request.addEventListener('success', event => {
              console.log('Deleted data with key', faultyKey, event);

              resolve(false);
            });
            request.addEventListener('error', innerErr => {
              // Database is more severely broken...
              console.log('Error deleting key', faultyKey, innerErr);
              resolve(true);
            });
          });
        });
      });
    });
  }
}

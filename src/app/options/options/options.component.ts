import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormControl } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { storeGlobal, ISettings, retrieveGlobal } from 'models';
import { DatabaseService } from 'src/app/shared/database.service';
import { ChatLogsService } from 'src/app/shared/chat-logs.service';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnDestroy {
  private formSubscription: Subscription;

  public settingsForm = new FormGroup({
    notifications: new FormGroup({
      beeps: new FormControl(false),
      friendOnline: new FormControl(false),
      friendOffline: new FormControl(false)
    })
  });
  public chatLogsSize$: Observable<number>;

  constructor(
    private chatLogsService: ChatLogsService,
    private databaseService: DatabaseService,
    private snackBar: MatSnackBar
  ) {
    retrieveGlobal('settings').then(settings => {
      this.settingsForm.setValue(settings, {
        emitEvent: false
      });
    });

    this.formSubscription = this.settingsForm.valueChanges.pipe(
      map(value => ({
        notifications: {
          beeps: value.notifications.beeps,
          friendOnline: value.notifications.friendOnline,
          friendOffline: value.notifications.friendOffline
        }
      } as ISettings)),
      tap(settings => storeGlobal('settings', settings)),
      tap(() => this.showSavedNotice())
    ).subscribe();

    this.chatLogsSize$ = this.chatLogsService.getTotalSize();
  }

  ngOnDestroy() {
    this.formSubscription.unsubscribe();
  }

  public downloadDatabase() {
    this.exportDatabase().then(json => {
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'bondage-club-tools-export-' + new Date().toISOString() + '.json';
      link.click();
    });
  }

  private exportDatabase() {
    return new Promise<string>(async (resolve, reject) => {
      const exportObject = {};
      const objectStoreNames = await this.databaseService.objectStoreNames;
      if (objectStoreNames.length === 0) {
        resolve(JSON.stringify(exportObject));
      } else {
        const transaction = await this.databaseService.transaction(objectStoreNames, 'readonly');
        transaction.onerror = event => {
          reject(event);
        };
        objectStoreNames.forEach(storeName => {
          const allObjects = [];
          transaction.objectStore(storeName).openCursor().onsuccess = event => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
              allObjects.push(cursor.value);
              cursor.continue();
            } else {
              exportObject[storeName] = allObjects;
              if (objectStoreNames.length === Object.keys(exportObject).length) {
                resolve(JSON.stringify(exportObject));
              }
            }
          };
        });
      }
    });
  }

  public uploadDatabase() {
    alert('hello');
  }

  private async clearDatabase() {
    return new Promise(async (resolve, reject) => {
      const objectStoreNames = await this.databaseService.objectStoreNames;
      const transaction = await this.databaseService.transaction(objectStoreNames, 'readwrite');
      transaction.onerror = event => {
        reject(event);
      };
      let count = 0;
      objectStoreNames.forEach(storeName => {
        transaction.objectStore(storeName).clear().onsuccess = () => {
          count++;
          if (count === objectStoreNames.length) {
            // cleared all object stores
            resolve();
          }
        };
      });
    });
  }

  private async importDatabase(jsonString: string) {
    return new Promise(async (resolve, reject) => {
      const objectStoreNames = await this.databaseService.objectStoreNames;
      const transaction = await this.databaseService.transaction(objectStoreNames, 'readwrite');
      transaction.onerror = event => {
        reject(event);
      };
      const importObject = JSON.parse(jsonString);
      objectStoreNames.forEach(storeName => {
        let count = 0;
        importObject[storeName].forEach((toAdd: {}) => {
          const request = transaction.objectStore(storeName).add(toAdd);
          request.onsuccess = () => {
            count++;
            if (count === importObject[storeName].length) {
              // added all objects for this store
              delete importObject[storeName];
              if (Object.keys(importObject).length === 0) {
                // added all object stores
                resolve();
              }
            }
          };
        });
      });
    });
  }

  private showSavedNotice() {
    this.snackBar.open('Preferences saved', undefined, {
      duration: 2000,
    });
  }
}

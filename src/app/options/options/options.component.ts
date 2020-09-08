import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormControl } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { storeGlobal, ISettings, retrieveGlobal, executeForAllGameTabs } from 'models';
import { DatabaseService } from 'src/app/shared/database.service';
import { ChatLogsService } from 'src/app/shared/chat-logs.service';
import { humanFileSize } from 'src/app/shared/utils/human-file-size';

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
    }),
    tools: new FormGroup({
      chatRoomRefresh: new FormControl(true),
      fpsCounter: new FormControl(false)
    })
  });
  public chatLogsSize$: Observable<string>;

  constructor(
    private chatLogsService: ChatLogsService,
    private databaseService: DatabaseService,
    private snackBar: MatSnackBar
  ) {
    retrieveGlobal('settings').then(settings => {
      this.settingsForm.patchValue(settings, {
        emitEvent: false
      });
    });

    this.formSubscription = this.settingsForm.valueChanges.pipe(
      map(value => ({
        notifications: {
          beeps: value.notifications.beeps,
          friendOnline: value.notifications.friendOnline,
          friendOffline: value.notifications.friendOffline
        },
        tools: {
          chatRoomRefresh: value.tools.chatRoomRefresh,
          fpsCounter: value.tools.fpsCounter
        }
      } as ISettings)),
      tap(settings => storeGlobal('settings', settings)),
      tap(() => this.showSavedNotice()),
      tap(settings => executeForAllGameTabs(tab => chrome.tabs.sendMessage(tab.id, settings)))
    ).subscribe();

    this.chatLogsSize$ = this.chatLogsService.getTotalSize().pipe(
      map(value => humanFileSize(value))
    );
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
              const value = cursor.value;
              delete value.id;
              allObjects.push(value);
              cursor.continue();
            } else {
              exportObject[storeName] = allObjects;
              if (objectStoreNames.length === Object.keys(exportObject).length) {
                resolve(JSON.stringify(exportObject, null, 2));
              }
            }
          };
        });
      }
    });
  }

  public uploadDatabase() {
    const input = document.createElement('input') as HTMLInputElement;
    input.accept = 'application/json,.json';
    input.type = 'file';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (file.name.match(/\.(json)$/)) {
        const reader = new FileReader();
        reader.onload = () => {
          console.log(`Loaded file: ${humanFileSize((reader.result as string).length)}`);
          this.importDatabase(reader.result as string)
            .catch(error => {
              console.error(error);
            });
        };
        reader.readAsText(file);
      } else {
        alert('File not supported, .json files only');
      }
    });
    input.click();
  }

  public async clearDatabase() {
    if (chrome.extension.getBackgroundPage().confirm('Are you sure you want to delete everything?')) {
      console.log('Clearing database...');
      const objectStoreNames = await this.databaseService.objectStoreNames;
      const transaction = await this.databaseService.transaction(objectStoreNames, 'readwrite');
      transaction.onerror = event => {
        console.error(event);
      };
      let count = 0;
      objectStoreNames.forEach(storeName => {
        console.log(`Clearing ${storeName}...`);
        transaction.objectStore(storeName).clear().onsuccess = () => {
          count++;
          console.log(`Done ${storeName}`);
          if (count === objectStoreNames.length) {
            console.log('Done with all');
          }
        };
      });
    }
  }

  private async importDatabase(jsonString: string) {
    return new Promise(async (resolve, reject) => {
      console.log('Importing database...');
      const objectStoreNames = await this.databaseService.objectStoreNames;
      const transaction = await this.databaseService.transaction(objectStoreNames, 'readwrite');
      transaction.onerror = event => {
        reject(event);
      };
      const importObject = JSON.parse(jsonString, (_, value) => {
        // tslint:disable-next-line: max-line-length
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3,6}|)Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      });
      objectStoreNames.forEach(storeName => {
        console.log(`Importing ${storeName}...`);
        let count = 0;
        importObject[storeName].forEach((toAdd: any) => {
          if (toAdd.id) {
            delete toAdd.id;
          }
          const request = transaction.objectStore(storeName).add(toAdd);
          request.onsuccess = () => {
            count++;
            if (count === importObject[storeName].length) {
              console.log(`Done ${storeName}`);
              // added all objects for this store
              delete importObject[storeName];
              if (Object.keys(importObject).length === 0) {
                // added all object stores
                console.log('Done with all');
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

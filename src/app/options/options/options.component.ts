import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { Subscription, Observable, combineLatest } from 'rxjs';
import { tap, map, throttleTime } from 'rxjs/operators';
import { storeGlobal, ISettings, retrieveGlobal, executeForAllGameTabs, IMember, IChatLog } from 'models';
import { DatabaseService } from 'src/app/shared/database.service';
import { ChatLogsService } from 'src/app/shared/chat-logs.service';
import { humanFileSize } from 'src/app/shared/utils/human-file-size';
import { MatChipInputEvent } from '@angular/material';
import * as JSZip from 'jszip';
import { MemberService } from 'src/app/shared/member.service';

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
      friendOffline: new FormControl(false),
      actions: new FormControl(false),
      mentions: new FormControl(false),
      whispers: new FormControl(false),
      keywords: new FormControl([])
    }),
    tools: new FormGroup({
      chatRoomRefresh: new FormControl(true),
      fpsCounter: new FormControl(false)
    })
  });
  public databaseSize$: Observable<string>;

  public get notificationControls(): FormGroup {
    return this.settingsForm.get('notifications') as FormGroup;
  }

  public get notifyKeywordsControl(): FormControl {
    return this.notificationControls.get('keywords') as FormControl;
  }

  constructor(
    private chatLogsService: ChatLogsService,
    private databaseService: DatabaseService,
    private memberService: MemberService,
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
          friendOffline: value.notifications.friendOffline,
          actions: value.notifications.actions,
          mentions: value.notifications.mentions,
          whispers: value.notifications.whispers,
          keywords: value.notifications.keywords
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

    this.databaseSize$ = combineLatest(this.chatLogsService.getTotalSize(), this.memberService.getTotalSize()).pipe(
      throttleTime(500),
      map(values => values.reduce((prev, cur) => prev + cur, 0)),
      map(value => humanFileSize(value))
    );
  }

  ngOnDestroy() {
    this.formSubscription.unsubscribe();
  }

  public addKeyword(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      const keywords = this.notifyKeywordsControl.value as string[];
      keywords.push(value);
      this.notifyKeywordsControl.setValue(keywords);
    }

    if (input) {
      input.value = '';
    }
  }

  public removeKeyword(keyword: string) {
    const keywords = this.notifyKeywordsControl.value as string[];
    const index = keywords.indexOf(keyword);
    if (index >= 0) {
      keywords.splice(index, 1);
      this.notifyKeywordsControl.setValue(keywords);
    }
  }

  public downloadDatabase() {
    this.exportDatabase().then(archive => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(archive);
      link.download = 'bondage-club-tools-export-' + new Date().toISOString() + '.zip';
      link.click();
    });
  }

  private exportDatabase() {
    return new Promise<Blob>(async (resolve, reject) => {
      const archive = new JSZip();

      const objectStoreNames = await this.databaseService.objectStoreNames;
      if (objectStoreNames.length === 0) {
        resolve(archive.generateAsync({ type: 'blob' }));
        return;
      }

      const transaction = await this.databaseService.transaction(objectStoreNames, 'readonly');
      transaction.onerror = event => {
        reject(event);
      };
      for (const storeName of objectStoreNames) {
        const folder = archive.folder(storeName);
        switch (storeName) {
          case 'chatRoomLogs':
            await this.exportChatLogs(transaction, folder);
            break;
          case 'members':
            await this.exportMembers(transaction, folder);
            break;
        }
      }
      resolve(archive.generateAsync({ type: 'blob' }));
    });
  }

  private async exportChatLogs(transaction: IDBTransaction, folder: JSZip) {
    return new Promise(resolve => {
      const subfolders = {} as { [key: number]: { folder: JSZip, files: { [name: string]: IChatLog[] } } };
      transaction.objectStore('chatRoomLogs').openCursor().onsuccess = event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const chatLog = cursor.value as IChatLog;
          delete chatLog.id;

          if (!subfolders[chatLog.session.memberNumber]) {
            subfolders[chatLog.session.memberNumber] = {
              folder: folder.folder(String(chatLog.session.memberNumber)),
              files: {}
            };
          }
          const subfolder = subfolders[chatLog.session.memberNumber];

          const fileName = `${chatLog.session.id} - ${chatLog.chatRoom}`;
          if (!subfolder.files[fileName]) {
            subfolder.files[fileName] = [];
          }

          subfolder.files[fileName].push(chatLog);

          cursor.continue();
        } else {
          for (const memberNumber in subfolders) {
            if (subfolders.hasOwnProperty(memberNumber)) {
              for (const file in subfolders[memberNumber].files) {
                if (subfolders[memberNumber].files.hasOwnProperty(file)) {
                  const data = subfolders[memberNumber].files[file];
                  const fileName = `${this.timestampToSortableFileName(data[0].timestamp)} - ${data[0].chatRoom}.json`;
                  subfolders[memberNumber].folder.file(fileName, JSON.stringify(data, undefined, 2), {
                    date: data[data.length - 1].timestamp
                  });
                }
              }
            }
          }
          resolve();
        }
      };
    });
  }

  private timestampToSortableFileName(timestamp: Date) {
    let result = timestamp.getFullYear().toString();
    result += (timestamp.getMonth() + 1).toString().padStart(2, '0');
    result += timestamp.getDate().toString().padStart(2, '0');
    result += '-';
    result += timestamp.getHours().toString().padStart(2, '0');
    result += timestamp.getMinutes().toString().padStart(2, '0');
    return result;
  }

  private async exportMembers(transaction: IDBTransaction, folder: JSZip) {
    return new Promise(resolve => {
      const subfolders = {} as { [key: number]: JSZip };
      transaction.objectStore('members').openCursor().onsuccess = event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const member = cursor.value as IMember;
          if (!subfolders[member.playerMemberNumber]) {
            subfolders[member.playerMemberNumber] = folder.folder(String(member.playerMemberNumber));
          }

          const memberFolder = subfolders[member.playerMemberNumber].folder(String(member.memberNumber));
          if (member.appearance) {
            memberFolder.file('appearance.png', member.appearance.substr(22), {
              base64: true,
              date: member.lastSeen
            });

            delete member.appearance;
          }

          const data = JSON.stringify(member, (_, value) => {
            if (typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
              // Base64 encoded images are too big for JSON stringify.
              // Skip them until I get around to building a better export mechanism.
              return null;
            }
            return value;
          }, 2);
          memberFolder.file('data.json', data, {
            date: member.lastSeen
          });

          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  public uploadDatabase() {
    const input = document.createElement('input') as HTMLInputElement;
    input.accept = 'application/json,.json,application/zip,.zip';
    input.type = 'file';
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file.name.match(/\.(json|zip)$/)) {
        chrome.extension.getBackgroundPage().alert('File not supported, .json or .zip files only');
        return;
      }

      try {
        const fileType = await this.detectFileType(file);
        const reader = new FileReader();
        if (fileType === 'json') {
          reader.addEventListener('load', _ => {
            this.importDatabaseFromJson(reader.result as string);
          });
          reader.readAsText(file);
        } else if (fileType === 'zip') {
          reader.addEventListener('load', _ => {
            this.importDatabaseFromZip(reader.result as ArrayBuffer);
          });
          reader.readAsArrayBuffer(file);
        }
      } catch (e) {
        console.error(e);
        chrome.extension.getBackgroundPage().alert(e);
      }
    });
    input.click();
  }

  private async detectFileType(file: File) {
    return new Promise<'json' | 'zip'>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', _ => {
        const buffer = new Uint8Array(reader.result as ArrayBuffer);
        const header = buffer.reduce((prev, cur) => prev + cur.toString(16).padStart(2, '0'), '');
        console.log(`Loaded file with header ${header}`);

        if (header === '504b0304') {
          resolve('zip');
        } else if (header.substr(0, 2) === '7b') {
          resolve('json');
        } else {
          reject('Unsupported file format');
        }
      });
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
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

  private async importDatabaseFromJson(jsonString: string) {
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
        if (!importObject[storeName]) {
          return;
        }
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

  private async importDatabaseFromZip(buffer: ArrayBuffer) {
    const archive = await JSZip.loadAsync(buffer);
    const promises = [];
    archive.folder('chatRoomLogs').folder(/^[\d]+\/$/).forEach(contextFolder => {
      const context = contextFolder.name.substring('chatRoomLogs/'.length, contextFolder.name.length - 1);
      console.log('Found context: ' + context);

      archive.folder(contextFolder.name).forEach((relativePath, file) => {
        if (!file.name.endsWith('.json')) {
          console.error(`Skipping unexpected file ${file.name}`);
          return;
        }

        console.log('chatRoomLogs: ' + relativePath + ' ' + file.name);
        promises.push(file.async('string').then(jsonString => {
          const data = JSON.parse(jsonString, (_, value) => {
            // tslint:disable-next-line: max-line-length
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3,6}|)Z$/.test(value)) {
              return new Date(value);
            }
            return value;
          }) as IChatLog[];

          return new Promise(async (resolve, reject) => {
            const transaction = await this.databaseService.transaction('chatRoomLogs', 'readwrite');
            transaction.onerror = event => {
              reject(event);
            };

            let count = 0;
            for (const chatLog of data) {
              const request = transaction.objectStore('chatRoomLogs').add(chatLog);
              request.addEventListener('success', _ => {
                count++;
                if (count === data.length) {
                  console.log('Done with ' + relativePath);
                  resolve();
                }
              });
            }
          });
        }));
      });
    });

    archive.folder('members').folder(/^[\d]+\/$/).forEach(contextFolder => {
      const context = contextFolder.name.substring('members/'.length, contextFolder.name.length - 1);
      console.log('Found context: ' + context);

      archive.folder(contextFolder.name).folder(/^[\d]+\/$/).forEach(memberFolder => {
        const memberNumber = memberFolder.name.substring(contextFolder.name.length, memberFolder.name.length - 1);
        console.log('Found member: ' + memberNumber);

        promises.push(new Promise(async (resolve, reject) => {
          const memberPromises = [] as Promise<IMember>[];

          archive.folder(memberFolder.name).forEach((relativePath, file) => {
            switch (relativePath) {
              case 'data.json':
                console.log('Found data for ' + memberFolder.name);
                memberPromises.push(file.async('string').then(jsonString => {
                  return JSON.parse(jsonString, (_, value) => {
                    // tslint:disable-next-line: max-line-length
                    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3,6}|)Z$/.test(value)) {
                      return new Date(value);
                    }
                    return value;
                  }) as IMember;
                }));
                break;

              case 'appearance.png':
                console.log('Found appearance for ' + memberFolder.name);
                memberPromises.push(file.async('base64').then(appearance => {
                  return {
                    appearance: 'data:image/png;base64,' + appearance
                  } as IMember;
                }));

                break;

              default:
                console.error(`Skipping unexpected file ${file.name}`);
                break;
            }
          });

          const data = await Promise.all(memberPromises);
          const member = data.reduce((acc, cur) => Object.assign(acc, cur), {} as IMember);

          const transaction = await this.databaseService.transaction('members', 'readwrite');
          transaction.onerror = event => {
            reject(event);
          };
          const request = transaction.objectStore('members').add(member);
          request.addEventListener('success', _ => {
            console.log('Done with ', member);
            resolve();
          });
        }));
      });
    });

    return Promise.all(promises).then(_ => console.log('Done importing.'));
  }

  private showSavedNotice() {
    this.snackBar.open('Preferences saved', undefined, {
      duration: 2000,
    });
  }
}

import { IChatLog, IMember } from 'models';
import { DatabaseService } from './database.service';
import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';
import { Observable } from 'rxjs';

interface ExportOptions {
  exportAppearances: false;
}

type UpdateCallback = (text: string, progress?: boolean | number) => void;
export interface IExportProgressState {
  progress: number;
  total: number;
  percentage: number;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(private databaseService: DatabaseService) {}

  public exportDatabase(options: ExportOptions): Observable<IExportProgressState | Blob> {
    return new Observable(subscriber => {
      const state = {
        progress: 0,
        total: 0,
        percentage: 0,
        text: ''
      } as IExportProgressState;

      function complete(archive: Blob) {
        subscriber.next(archive);
        subscriber.complete();
      }

      function error(err: any) {
        subscriber.error(err);
      }

      function update(text: string, progress: boolean | number = false) {
        if (typeof progress === 'boolean') {
          state.progress++;
          state.percentage = state.progress / state.total * 50;
        } else {
          state.percentage = 50 + (50 * (progress / 100));
        }
        subscriber.next(Object.assign({}, state, {
          text
        }));
      }

      update('Preparing export');
      this.countTotals().then(result => Object.assign(state, result));
      this.createArchive(options, update).then(complete).catch(error);
    });
  }

  private async countTotals(): Promise<{ total: number }> {
    const objectStoreNames = await this.databaseService.objectStoreNames;
    if (objectStoreNames.length === 0) {
      return { total: 0 };
    }

    return Promise.all(objectStoreNames.map(storeName =>
        this.databaseService.read(storeName, objectStore => objectStore.count())))
      .then(counts => ({
        total: counts.reduce((prev, cur) => prev + cur, 0)
      }));
  }

  private async createArchive(options: ExportOptions, update: UpdateCallback): Promise<Blob> {
    const archive = new JSZip();

    const objectStoreNames = await this.databaseService.objectStoreNames;
    if (objectStoreNames.length === 0) {
      update('Generating archive');
      return archive.generateAsync({ type: 'blob' });
    }

    const transaction = await this.databaseService.transaction(objectStoreNames, 'readonly');
    transaction.onerror = event => {
      throw event;
    };

    for (const storeName of objectStoreNames) {
      const folder = archive.folder(storeName);

      switch (storeName) {
        case 'chatRoomLogs':
          update('Gathering chat logs');
          await this.exportChatLogs(update, transaction, folder);
          break;

        case 'members':
          update('Gathering people');
          await this.exportMembers(options, update, transaction, folder);
          break;
      }
    }

    update('Generating archive');
    return archive.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 1
      }
    }, metadata => update(`Generating archive, processing file ${metadata.currentFile}`, metadata.percent));
  }

  private async exportChatLogs(update: UpdateCallback, transaction: IDBTransaction, folder: JSZip): Promise<void> {
    return new Promise(resolve => {
      const subfolders = {} as { [key: number]: { folder: JSZip, files: { [name: string]: IChatLog[] } } };

      transaction.objectStore('chatRoomLogs').openCursor().addEventListener('success', event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const chatLog = cursor.value as IChatLog;
          delete chatLog.id;

          update(`Gathering logs from ${chatLog.chatRoom}`, true);

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
          update('Generating chat log files');

          for (const memberNumber in subfolders) {
            if (Object.prototype.hasOwnProperty.call(subfolders, memberNumber)) {
              for (const file in subfolders[memberNumber].files) {
                if (Object.prototype.hasOwnProperty.call(subfolders[memberNumber].files, file)) {
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
      });
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

  private async exportMembers(options: ExportOptions, update: UpdateCallback, transaction: IDBTransaction, folder: JSZip) {
    return new Promise<void>(resolve => {
      const subfolders = {} as { [key: number]: JSZip };

      transaction.objectStore('members').openCursor().onsuccess = event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const member = cursor.value as IMember;

          update(`Generating member files for ${member.memberNumber}`, true);

          if (!subfolders[member.playerMemberNumber]) {
            subfolders[member.playerMemberNumber] = folder.folder(String(member.playerMemberNumber));
          }

          const memberFolder = subfolders[member.playerMemberNumber].folder(String(member.memberNumber));
          if (member.appearance) {
            if (options.exportAppearances) {
              memberFolder.file('appearance.png', member.appearance.substring(22), {
                base64: true,
                date: member.lastSeen
              });
            } else {
              delete member.appearanceMetaData;
            }

            delete member.appearance;
          }

          const data = JSON.stringify(member, undefined, 2);
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
}

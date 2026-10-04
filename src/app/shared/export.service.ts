import { Appearance, IBeepMessage, IChatLog, IMember, appearanceImageExtension } from 'models';
import { DatabaseService } from './database.service';
import { Injectable } from '@angular/core';
import { Zip, ZipPassThrough, strToU8 } from 'fflate';
import { Observable } from 'rxjs';
import { decode } from './utils/base64';

interface ExportOptions {
  exportAppearances: false;
  handle: FileSystemFileHandle;
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

  constructor(private databaseService: DatabaseService) { }

  public exportDatabase(options: ExportOptions): Observable<IExportProgressState> {
    return new Observable(subscriber => {
      const state = {
        progress: 0,
        total: 0,
        percentage: 0,
        text: ''
      } as IExportProgressState;

      function complete() {
        subscriber.complete();
      }

      function error(err: unknown) {
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

    return Promise.all(objectStoreNames.filter(storeName => storeName !== 'chatSessions').map(storeName =>
      this.databaseService.read(storeName, objectStore => objectStore.count())))
      .then(counts => ({
        total: counts.reduce((prev, cur) => prev + cur, 0)
      }));
  }

  private async createArchive(options: ExportOptions, update: UpdateCallback): Promise<Zip> {
    const writeable = await options.handle.createWritable({
      keepExistingData: false
    });

    const archive = new Zip((err, data, final) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(data, final);

      writeable.write(data);
      if (final) {
        writeable.close();
      }
    });

    const objectStoreNames = await this.databaseService.objectStoreNames;
    if (objectStoreNames.length === 0) {
      update('Generating archive');
      archive.end();
      return archive;
    }

    const transaction = await this.databaseService.transaction(objectStoreNames, 'readonly');
    transaction.onerror = event => {
      throw event;
    };

    for (const storeName of objectStoreNames) {
      switch (storeName) {
        case 'appearances':
          // Exported separately below, see exportAppearances
          break;

        case 'beepMessages':
          update('Gathering beep messages');
          await this.exportBeepMessages(update, transaction, archive);
          break;

        case 'chatSessions':
          // Derived from chatRoomLogs, recreated on import
          break;

        case 'chatRoomLogs':
          update('Gathering chat logs');
          await this.exportChatLogs(update, transaction, archive);
          break;

        case 'members':
          update('Gathering people');
          await this.exportMembers(options, update, transaction, archive);
          break;
      }
    }

    if (options.exportAppearances && objectStoreNames.includes('appearances')) {
      update('Gathering appearances');
      await this.exportAppearances(archive);
    }

    update('Generating archive');
    archive.end();

    return archive;
  }

  /**
   * Uses its own transaction, because reading Blobs is asynchronous and would
   * cause a shared transaction to be committed prematurely. Legacy data URLs
   * are written immediately, Blobs are read after the cursor is done.
   */
  private async exportAppearances(archive: Zip): Promise<void> {
    const transaction = await this.databaseService.transaction('appearances', 'readonly');
    const blobAppearances = await new Promise<Appearance[]>((resolve, reject) => {
      const results: Appearance[] = [];
      const request = transaction.objectStore('appearances').openCursor();
      request.addEventListener('error', () => reject(request.error));
      request.addEventListener('success', () => {
        const cursor = request.result;
        if (cursor) {
          const appearance = cursor.value as Appearance;
          const image = appearance.appearance;
          if (typeof image === 'string') {
            this.addAppearanceToArchive(archive, appearance, decode(image.substring(image.indexOf(',') + 1)));
          } else {
            results.push(appearance);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      });
    });

    for (const appearance of blobAppearances) {
      const data = new Uint8Array(await (appearance.appearance as Blob).arrayBuffer());
      this.addAppearanceToArchive(archive, appearance, data);
    }
  }

  private addAppearanceToArchive(archive: Zip, appearance: Appearance, data: Uint8Array) {
    const folder = `members/${appearance.contextMemberNumber}/${appearance.memberNumber}`;

    let deflate = new ZipPassThrough(`${folder}/appearance.${appearanceImageExtension(appearance.appearance)}`);
    archive.add(deflate);
    deflate.compression = 0;
    deflate.mtime = appearance.timestamp;
    deflate.push(data, true);

    deflate = new ZipPassThrough(`${folder}/appearance-meta-data.json`);
    archive.add(deflate);
    deflate.mtime = appearance.timestamp;
    deflate.push(strToU8(JSON.stringify({
      ...appearance.appearanceMetaData,
      timestamp: appearance.timestamp
    }, undefined, 2)), true);
  }

  private async exportBeepMessages(update: UpdateCallback, transaction: IDBTransaction, archive: Zip): Promise<void> {
    return new Promise(resolve => {
      const subfolders = {} as {
        [key: number]: {
          files: {
            [name: string]: IBeepMessage[]
          }
        }
      };

      transaction.objectStore('beepMessages').openCursor().addEventListener('success', event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const beepMessage = cursor.value as IBeepMessage;
          delete beepMessage.id;

          if (!subfolders[beepMessage.contextMemberNumber]) {
            subfolders[beepMessage.contextMemberNumber] = {
              files: {}
            };
          }
          const subfolder = subfolders[beepMessage.contextMemberNumber];

          const fileName = beepMessage.memberNumber.toString();
          if (!subfolder.files[fileName]) {
            subfolder.files[fileName] = [];
          }

          subfolder.files[fileName].push(beepMessage);

          cursor.continue();
        } else {
          update('Generating beep message files');

          for (const memberNumber in subfolders) {
            if (!Object.prototype.hasOwnProperty.call(subfolders, memberNumber)) {
              continue;
            }

            for (const fileName in subfolders[memberNumber].files) {
              if (!Object.prototype.hasOwnProperty.call(subfolders[memberNumber].files, fileName)) {
                continue;
              }

              const data = subfolders[memberNumber].files[fileName];

              const deflate = new ZipPassThrough(`beepMessages/${memberNumber}/${fileName}.json`);
              archive.add(deflate);
              deflate.mtime = data[data.length - 1].timestamp;
              deflate.push(strToU8(JSON.stringify(data, undefined, 2)), true);
            }
          }

          resolve();
        }
      });
    });
  }

  private async exportChatLogs(update: UpdateCallback, transaction: IDBTransaction, archive: Zip): Promise<void> {
    return new Promise(resolve => {
      const subfolders = {} as {
        [key: number]: {
          files: {
            [name: string]: IChatLog[]
          }
        }
      };

      transaction.objectStore('chatRoomLogs').openCursor().addEventListener('success', event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const chatLog = cursor.value as IChatLog;
          delete chatLog.id;

          update(`Gathering logs from ${chatLog.chatRoom}`, true);

          if (!subfolders[chatLog.session.memberNumber]) {
            subfolders[chatLog.session.memberNumber] = {
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
            if (!Object.prototype.hasOwnProperty.call(subfolders, memberNumber)) {
              continue;
            }

            for (const file in subfolders[memberNumber].files) {
              if (!Object.prototype.hasOwnProperty.call(subfolders[memberNumber].files, file)) {
                continue;
              }

              const data = subfolders[memberNumber].files[file];
              const fileName = `${this.timestampToSortableFileName(data[0].timestamp)} - ${data[0].chatRoom}.json`;

              const deflate = new ZipPassThrough(`chatRoomLogs/${memberNumber}/${fileName}`);
              archive.add(deflate);
              deflate.mtime = data[data.length - 1].timestamp;
              deflate.push(strToU8(JSON.stringify(data, undefined, 2)), true);
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

  private async exportMembers(options: ExportOptions, update: UpdateCallback, transaction: IDBTransaction, archive: Zip) {
    return new Promise<void>(resolve => {
      transaction.objectStore('members').openCursor().onsuccess = event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const member = cursor.value as IMember;

          update(`Generating member files for ${member.memberNumber}`, true);

          if (member.appearance) {
            if (options.exportAppearances) {
              const deflate = new ZipPassThrough(`members/${member.playerMemberNumber}/${member.memberNumber}/appearance.png`);
              archive.add(deflate);
              deflate.compression = 0;
              deflate.mtime = member.lastSeen;
              deflate.push(decode(member.appearance.substring(22)), true);
            } else {
              delete member.appearanceMetaData;
            }

            delete member.appearance;
          }

          const deflate = new ZipPassThrough(`members/${member.playerMemberNumber}/${member.memberNumber}/data.json`);
          archive.add(deflate);
          deflate.mtime = member.lastSeen;
          deflate.push(strToU8(JSON.stringify(member, undefined, 2)), true);

          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }
}

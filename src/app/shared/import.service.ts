import { IMember, IChatLog, StoreNames } from 'models';
import { DatabaseService } from './database.service';
import { Injectable } from '@angular/core';
import { Unzipped, unzip } from 'fflate';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const ValidStoresForJsonImport = ['members', 'chatRoomLogs'] as StoreNames[];

type UpdateCallback = (text: string, progress?: boolean) => void;
export interface IImportProgressState {
  progress: number;
  total: number;
  percentage: number;
  text: string;
}

type ImportFileType = 'json' | 'zip';

interface JsonExport {
  members: IMember[];
  chatRoomLogs: IChatLog[];
}

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  private static readonly DateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3,6}|)Z$/;
  private static readonly Decoder = new TextDecoder('utf8');

  constructor(private databaseService: DatabaseService) {}

  public importDatabase(uploadedFile: File): Observable<IImportProgressState> {
    return from(this.detectFileType(uploadedFile)).pipe(
      switchMap(fileType => this.readFile(fileType, uploadedFile)
        .then(contents => ({ fileType, contents }))),
      switchMap(file => this.importFromFile(file.fileType, file.contents))
    );
  }

  private async detectFileType(file: File) {
    return new Promise<ImportFileType>((resolve, reject) => {
      if (!file.name.match(/\.(json|zip)$/)) {
        reject('File not supported, .json or .zip files only');
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const buffer = new Uint8Array(reader.result as ArrayBuffer);
        const header = buffer.reduce((prev, cur) => prev + cur.toString(16).padStart(2, '0'), '');
        console.log(`Loaded file with header ${header}`);

        if (header === '504b0304') {
          resolve('zip');
        } else if (header.substring(0, 2) === '7b') {
          resolve('json');
        } else {
          reject('Unsupported file format');
        }
      });
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  }

  private readFile(fileType: ImportFileType, file: File): Promise<JsonExport | Unzipped> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      if (fileType === 'json') {
        reader.addEventListener('load', () => {
          const importObject = JSON.parse(reader.result as string, (__, value) => {
            if (typeof value === 'string' && ImportService.DateTimeRegex.test(value)) {
              return new Date(value);
            }
            return value;
          });
          resolve(importObject as JsonExport);
        });
        reader.readAsText(file);
      } else if (fileType === 'zip') {
        reader.addEventListener('load', () => {
          unzip(new Uint8Array(reader.result as ArrayBuffer), (err, unzipped) => {
            if (err) {
              reject(err);

              return;
            }

            resolve(unzipped);
          });
        });
        reader.readAsArrayBuffer(file);
      } else {
        reject(`Unknown file type ${fileType}`);
      }
    });
  }

  private countSize(fileType: ImportFileType, contents: JsonExport | Unzipped): IImportProgressState {
    const state = {
      progress: 0,
      total: 0,
      percentage: 0,
      text: ''
    } as IImportProgressState;

    function isJson(input: JsonExport | Unzipped): input is JsonExport {
      return fileType === 'json';
    }

    function isZip(input: JsonExport | Unzipped): input is Unzipped {
      return fileType === 'zip';
    }

    if (isJson(contents)) {
      state.total += contents.chatRoomLogs.length;
      state.total += contents.members.length;
    } else if (isZip(contents)) {
      const files = Object.keys(contents);
      files.forEach(name => {
        if (name.match(/^chatRoomLogs\/[\d]+\/.+\.json$/)) {
          state.total++;
        } else if (name.match(/^members\/[\d]+\/[\d]+\/.+$/)) {
          state.total++;
        }
      });
      // contents['chatRoomLogs'].folder(/^[\d]+\/$/).forEach(folder => {
      //   state.total += contents.folder(folder.name).file(/\.json$/).length;
      // });
      // contents['members'].folder(/^[\d]+\/$/).forEach(contextFolder => {
      //   state.total += contents.folder(contextFolder.name).folder(/^[\d]+\/$/).length;
      // });
    }

    return state;
  }

  private importFromFile(fileType: ImportFileType, contents: JsonExport | Unzipped): Observable<IImportProgressState> {
    return new Observable(subscriber => {
      const state = this.countSize(fileType, contents);

      function update(text: string, progress = false) {
        if (progress) {
          state.progress++;
          state.percentage = state.progress / state.total * 100;
        }
        subscriber.next(Object.assign({}, state, {
          text
        }));
      }

      function complete() {
        subscriber.complete();
      }

      function fail(message: string): never {
        const error = new Error(message);
        subscriber.error(error);
        throw error;
      }

      function isJson(input: JsonExport | Unzipped): input is JsonExport {
        return fileType === 'json';
      }

      function isZip(input: JsonExport | Unzipped): input is Unzipped {
        return fileType === 'zip';
      }

      if (isJson(contents)) {
        this.importDatabaseFromJson(update, contents).then(complete);
      } else if (isZip(contents)) {
        this.importDatabaseFromZip(update, contents).then(complete);
      } else {
        fail(`Not all types of contents are implemented`);
      }
    });
  }

  private async importDatabaseFromJson(update: UpdateCallback, importObject: JsonExport) {
    update('Importing database...');
    const transaction = await this.databaseService.transaction(ValidStoresForJsonImport, 'readwrite');

    return new Promise<void>((resolve, reject) => {
      transaction.onerror = event => {
        reject(event);
      };

      ValidStoresForJsonImport.forEach(storeName => {
        update(`Importing ${storeName}...`);
        let count = 0;
        if (!importObject[storeName]) {
          return;
        }

        importObject[storeName].forEach((toAdd: Record<string, unknown>) => {
          if (toAdd.id) {
            delete toAdd.id;
          }

          const request = transaction.objectStore(storeName).add(toAdd);
          request.onsuccess = () => {
            count++;
            update(`Imported object`, true);

            if (count === importObject[storeName].length) {
              update(`Done ${storeName}`);
              // added all objects for this store
              delete importObject[storeName];
              if (Object.keys(importObject).length === 0) {
                // added all object stores
                update('Done with all');
                resolve();
              }
            }
          };
        });
      });
    });
  }

  private async importDatabaseFromZip(update: UpdateCallback, archive: Unzipped) {
    const filePaths = Object.keys(archive);
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      console.log(`Found ${filePath}...`, archive[filePath]);

      if (filePath.startsWith('beepMessages/')) {
        console.log('Not implemented', filePath);
        continue;
      } else if (filePath.startsWith('chatRoomLogs/')) {
        const parts = filePath.split('/', 3);
        if (parts.length !== 3 || parts[2] === '') {
          continue;
        }

        console.log('Valid chatRoomLogs', parts);
        await this.importChatLog(update, parts[2], filePath, archive[filePath]);
      } else if (filePath.startsWith('members/')) {
        const parts = filePath.split('/', 4);
        if (parts.length !== 4 || parts[3] === '') {
          continue;
        }

        console.log('Valid members', parts);
        await this.importMember(update, parseInt(parts[1], 10), parseInt(parts[2], 10), parts[3], filePath, archive[filePath]);
      }
    }

    update('Done importing.');
  }

  private async importChatLog(update: UpdateCallback, fileName: string, filePath: string, entry: Uint8Array) {
    if (!fileName.endsWith('.json')) {
      console.warn(`Skipping unexpected file ${filePath}`);
      return;
    }

    update(`Reading data ${filePath}`);
    const data = JSON.parse(ImportService.Decoder.decode(entry), (_, value) => {
      if (typeof value === 'string' && ImportService.DateTimeRegex.test(value)) {
        return new Date(value);
      }
      return value;
    }) as IChatLog[];

    const transaction = await this.databaseService.transaction('chatRoomLogs', 'readwrite');

    return new Promise<void>((resolve, reject) => {
      transaction.onerror = event => {
        reject(event);
      };

      let count = 0;
      for (const chatLog of data) {
        const request = transaction.objectStore('chatRoomLogs').add(chatLog);
        request.addEventListener('success', () => {
          count++;
          if (count === data.length) {
            update(`Imported ${fileName}`, true);
            resolve();
          }
        });
      }
    });
  }

  private async importMember(update: UpdateCallback, context: number, memberNumber: number, fileName: string, filePath: string, entry: Uint8Array) {
    let data: IMember;
    switch (fileName) {
      case 'data.json':
        update(`Reading data ${filePath}`);
        data = JSON.parse(ImportService.Decoder.decode(entry), (_, value) => {
          if (typeof value === 'string' && ImportService.DateTimeRegex.test(value)) {
            return new Date(value);
          }
          return value;
        }) as IMember;

        break;

      case 'appearance.png':
        update(`Reading appearance ${filePath}`);
        data = {
          playerMemberNumber: context,
          memberNumber,
          appearance: 'data:image/png;base64,' + this.toBase64(entry)
        } as IMember;

        break;

      default:
        console.warn(`Skipping unexpected file ${fileName}`);
        return;
    }

    update(`Importing member`);
    const transaction = await this.databaseService.transaction('members', 'readwrite');

    return new Promise<void>((resolve, reject) => {
      transaction.onerror = event => {
        reject(event);
      };
      const request = transaction.objectStore('members').get([context, memberNumber]);
      request.addEventListener('success', event => {
        const storedMember = (event.target as IDBRequest<IMember>).result;
        if (!storedMember) {
          const request = transaction.objectStore('members').add(data);
          request.addEventListener('success', () => {
            update(`Imported member`, true);
            resolve();
          });
        } else {
          data = Object.assign(data, storedMember);
          const request = transaction.objectStore('members').put(data);
          request.addEventListener('success', () => {
            update(`Updated member`, true);
            resolve();
          });
        }
      });
    });
  }

  private toBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

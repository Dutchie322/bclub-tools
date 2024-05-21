import { IMember, IChatLog, StoreNames } from 'models';
import { DatabaseService } from './database.service';
import { Injectable } from '@angular/core';
import { AsyncUnzipInflate, Unzip, UnzipFile } from 'fflate';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const ValidStoresForJsonImport = ['members', 'chatRoomLogs'] as StoreNames[];

type UpdateCallback = (text: string, progress?: boolean) => void;
export interface IImportProgressState {
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

  private readFile(fileType: ImportFileType, file: File): Promise<JsonExport | ReadableStream<Uint8Array>> {
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
        resolve(file.stream());
      } else {
        reject(`Unknown file type ${fileType}`);
      }
    });
  }

  private importFromFile(fileType: ImportFileType, contents: JsonExport | ReadableStream<Uint8Array>): Observable<IImportProgressState> {
    return new Observable(subscriber => {
      function update(text: string) {
        subscriber.next(Object.assign({}, {
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

      function isJson(input: JsonExport | ReadableStream<Uint8Array>): input is JsonExport {
        return fileType === 'json';
      }

      function isZip(input: JsonExport | ReadableStream<Uint8Array>): input is ReadableStream<Uint8Array> {
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
            update(`Imported object`);

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

  private importDatabaseFromZip(update: UpdateCallback, readableStream: ReadableStream<Uint8Array>) {
    const fileReads: Promise<void>[] = [];
    const reader = readableStream.getReader();
    const archive = new Unzip(file => {
      console.log('Found file in zip file:', file);

      if (file.name.startsWith('beepMessages/')) {
        console.log('Not implemented', file.name);
        return;
      } else if (file.name.startsWith('chatRoomLogs/')) {
        const parts = file.name.split('/', 3);
        if (parts.length !== 3 || parts[2] === '') {
          return;
        }

        if (!parts[2].endsWith('.json')) {
          console.warn(`Skipping unexpected file ${file.name}`);
          return;
        }

        console.log('Valid chatRoomLogs', parts);
        fileReads.push(new Promise<Uint8Array>((resolve, reject) => {
          let data = new Uint8Array(0);

          update(`Reading data ${file.name}`);
          file.ondata = (err, chunk, final) => {
            if (err) {
              reject(err);
              return;
            }

            const length = data.length + chunk.length;
            const mergedData = new Uint8Array(length);
            mergedData.set(data, 0);
            mergedData.set(chunk, data.length);

            data = mergedData;

            if (final) {
              resolve(data);
            }
          };
          file.start();
        }).then(data => {
          return this.importChatLog(update, parts[2], data);
        }).catch(console.error));
      } else if (file.name.startsWith('members/')) {
        const parts = file.name.split('/', 4);
        if (parts.length !== 4 || parts[3] === '') {
          return;
        }

        console.log('Valid members', parts);
        fileReads.push(new Promise<Uint8Array>((resolve, reject) => {
          let data = new Uint8Array(0);

          update(`Reading data ${file.name}`);
          file.ondata = (err, chunk, final) => {
            if (err) {
              reject(err);
              return;
            }

            const length = data.length + chunk.length;
            const mergedData = new Uint8Array(length);
            mergedData.set(data, 0);
            mergedData.set(chunk, data.length);

            data = mergedData;

            if (final) {
              resolve(data);
            }
          };
          file.start();
        }).then(data => {
          return this.importMember(update, parseInt(parts[1], 10), parseInt(parts[2], 10), parts[3], file, data);
        }).catch(console.error));
      }
    });
    archive.register(AsyncUnzipInflate);
    const read = async () => {
      const { done, value } = await reader.read();
      if (done) {
        archive.push(new Uint8Array(), true);
        return;
      }
      archive.push(value);
      read();
    };
    read();

    return Promise.all(fileReads).then(() => {
      update('Done importing.');
    });
  }

  private async importChatLog(update: UpdateCallback, fileName: string, data: Uint8Array) {
    const text = ImportService.Decoder.decode(data);
    const json = JSON.parse(text, (_, value) => {
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
      for (const chatLog of json) {
        const request = transaction.objectStore('chatRoomLogs').add(chatLog);
        request.addEventListener('success', () => {
          count++;
          if (count === json.length) {
            update(`Imported ${fileName}`, true);
            resolve();
          }
        });
      }
    });
  }

  private async importMember(update: UpdateCallback, context: number, memberNumber: number, fileName: string, file: UnzipFile, data1: Uint8Array) {
    let member: IMember;
    switch (fileName) {
      case 'data.json':
        member = JSON.parse(ImportService.Decoder.decode(data1), (_, value) => {
          if (typeof value === 'string' && ImportService.DateTimeRegex.test(value)) {
            return new Date(value);
          }
          return value;
        }) as IMember;

        break;

      case 'appearance.png':
        member = {
          playerMemberNumber: context,
          memberNumber,
          appearance: 'data:image/png;base64,' + this.toBase64(data1)
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
          const request = transaction.objectStore('members').add(member);
          request.addEventListener('success', () => {
            update(`Imported member`, true);
            resolve();
          });
        } else {
          member = Object.assign(member, storedMember);
          const request = transaction.objectStore('members').put(member);
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

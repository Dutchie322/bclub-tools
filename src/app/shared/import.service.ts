import { IMember, IChatLog, StoreNames, Appearance, startTransaction, AppearanceMetaData, IBeepMessage, executeRequest, upsertValue, parseJson } from 'models';
import { Injectable } from '@angular/core';
import { AsyncUnzipInflate, Unzip } from 'fflate';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const ValidStoresForJsonImport = ['members', 'chatRoomLogs'] as StoreNames[];

type UpdateCallback = (text: string) => void;
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
  private static readonly Decoder = new TextDecoder('utf8');

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
          const importObject = parseJson<JsonExport>(reader.result as string);
          resolve(importObject);
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
        console.log('Update:', text);
        subscriber.next(Object.assign({}, {
          text
        }));
      }

      function complete() {
        console.log('Completed');
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
    const transaction = await startTransaction(ValidStoresForJsonImport, 'readwrite');

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
          if (toAdd['id']) {
            delete toAdd['id'];
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

  private async importDatabaseFromZip(update: UpdateCallback, readableStream: ReadableStream<Uint8Array>) {
    const fileReads: Promise<void>[] = [];
    const reader = readableStream.getReader();
    const archive = new Unzip(file => {
      console.log('Found file in zip file:', file);

      if (file.name.startsWith('beepMessages/')) {
        const parts = file.name.split('/', 3);
        if (parts.length !== 3 || parts[2] === '') {
          return;
        }

        if (!parts[2].endsWith('.json')) {
          console.warn(`Skipping unexpected file ${file.name}`);
          return;
        }

        console.log('Valid beepMessages', parts);
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
          return this.importBeepMessages(data);
        }).then(() => {
          update(`Imported ${file.name}`);
        })
        .catch(console.error));

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
          return this.importChatLog(data);
        }).then(() => {
          update(`Imported ${file.name}`);
        })
        .catch(console.error));

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
          return this.importMember(parseInt(parts[1], 10), parseInt(parts[2], 10), parts[3], data);
        }).then(() => {
          update(`Imported ${file.name}`);
        }).catch(console.error));
      }
    });
    archive.register(AsyncUnzipInflate);
    return new Promise<void>(resolve => {
      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          archive.push(new Uint8Array(), true);
          resolve();
          return;
        }
        archive.push(value);
        read();
      };
      read();
    }).then(() => {
      return Promise.all(fileReads);
    }).then(() => {
      update('Done importing.');
    });
  }

  private async importBeepMessages(data: Uint8Array) {
    const beepMessages = parseJson<IBeepMessage[]>(ImportService.Decoder.decode(data));
    const transaction = await startTransaction('beepMessages', 'readwrite');

    for (const beepMessage of beepMessages) {
      await executeRequest(transaction, transaction => transaction.objectStore('beepMessages').add(beepMessage));
    }
  }

  private async importChatLog(data: Uint8Array) {
    const chatLogs = parseJson<IChatLog[]>(ImportService.Decoder.decode(data));
    const transaction = await startTransaction('chatRoomLogs', 'readwrite');

    for (const chatLog of chatLogs) {
      await executeRequest(transaction, transaction => transaction.objectStore('chatRoomLogs').add(chatLog));
    }
  }

  private async importMember(context: number, memberNumber: number, fileName: string, data: Uint8Array) {
    let member: IMember;
    const appearance: Partial<Appearance> = {};
    let appearanceMetaData: AppearanceMetaData & { timestamp: Date };
    const storesToUpdate = new Set<StoreNames>();

    switch (fileName) {
      case 'data.json':
        member = parseJson<IMember>(ImportService.Decoder.decode(data));
        storesToUpdate.add('members');

        if (member.appearanceMetaData) {
          appearance.contextMemberNumber = context;
          appearance.memberNumber = memberNumber;
          appearance.appearanceMetaData = {
            canvasHeight: member.appearanceMetaData.canvasHeight,
            heightModifier: member.appearanceMetaData.heightModifier,
            heightRatio: member.appearanceMetaData.heightRatio,
            heightRatioProportion: member.appearanceMetaData.heightRatioProportion,
            isInverted: member.appearanceMetaData.isInverted
          };

          if (member.lastSeen) {
            appearance.timestamp = member.lastSeen;
          }

          delete member.appearanceMetaData;
          storesToUpdate.add('appearances');
        }

        break;

      case 'appearance.png':
        appearance.contextMemberNumber = context;
        appearance.memberNumber = memberNumber;
        appearance.appearance = 'data:image/png;base64,' + ImportService.toBase64(data);
        storesToUpdate.add('appearances');

        break;

      case 'appearance-meta-data.json':
        appearanceMetaData = parseJson<AppearanceMetaData & { timestamp: Date }>(ImportService.Decoder.decode(data));
        appearance.contextMemberNumber = context;
        appearance.memberNumber = memberNumber;
        appearance.appearanceMetaData = {
          canvasHeight: appearanceMetaData.canvasHeight,
          heightModifier: appearanceMetaData.heightModifier,
          heightRatio: appearanceMetaData.heightRatio,
          heightRatioProportion: appearanceMetaData.heightRatioProportion,
          isInverted: appearanceMetaData.isInverted
        };

        if (appearanceMetaData.timestamp) {
          appearance.timestamp = appearanceMetaData.timestamp;
        }
        storesToUpdate.add('appearances');

        break;

      default:
        console.warn(`Skipping unexpected file ${fileName}`);
        return Promise.resolve();
    }

    const transaction = await startTransaction([...storesToUpdate], 'readwrite');
    const promises = [];
    if (storesToUpdate.has('members')) {
      promises.push(upsertValue(transaction, 'members', [context, memberNumber], member));
    }

    if (storesToUpdate.has('appearances')) {
      promises.push(upsertValue(transaction, 'appearances', [context, memberNumber], appearance));
    }

    return Promise.all(promises);
  }

  public static toBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

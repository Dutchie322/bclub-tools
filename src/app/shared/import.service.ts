import { IMember, IChatLog, StoreNames } from 'models';
import { DatabaseService } from './database.service';
import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const ValidStoresForJsonImport = ['members', 'chatRoomLogs'] as StoreNames[];
const ValidStoresForZipImport = ['members', 'chatRoomLogs'] as StoreNames[];

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

  private readFile(fileType: ImportFileType, file: File): Promise<JsonExport | JSZip> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      if (fileType === 'json') {
        reader.addEventListener('load', _ => {
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
        reader.addEventListener('load', _ => {
          const archive = JSZip.loadAsync(reader.result as ArrayBuffer);
          resolve(archive);
        });
        reader.readAsArrayBuffer(file);
      } else {
        reject(`Unknown file type ${fileType}`);
      }
    });
  }

  private countSize(fileType: ImportFileType, contents: JsonExport | JSZip): IImportProgressState {
    const state = {
      progress: 0,
      total: 0,
      percentage: 0,
      text: ''
    } as IImportProgressState;

    function isJson(input: JsonExport | JSZip): input is JsonExport {
      return fileType === 'json';
    }

    function isZip(input: JsonExport | JSZip): input is JSZip {
      return fileType === 'zip';
    }

    if (isJson(contents)) {
      state.total += contents.chatRoomLogs.length;
      state.total += contents.members.length;
    } else if (isZip(contents)) {
      contents.folder('chatRoomLogs').folder(/^[\d]+\/$/).forEach(folder => {
        state.total += contents.folder(folder.name).file(/\.json$/).length;
      });
      contents.folder('members').folder(/^[\d]+\/$/).forEach(contextFolder => {
        state.total += contents.folder(contextFolder.name).folder(/^[\d]+\/$/).length;
      });
    }

    return state;
  }

  private importFromFile(fileType: ImportFileType, contents: JsonExport | JSZip): Observable<IImportProgressState> {
    return new Observable(subscriber => {
      const state = this.countSize(fileType, contents);

      function update(text: string, progress: boolean = false) {
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

      function isJson(input: JsonExport | JSZip): input is JsonExport {
        return fileType === 'json';
      }

      function isZip(input: JsonExport | JSZip): input is JSZip {
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
    return new Promise(async (resolve, reject) => {
      update('Importing database...');
      const transaction = await this.databaseService.transaction(ValidStoresForJsonImport, 'readwrite');
      transaction.onerror = event => {
        reject(event);
      };

      ValidStoresForJsonImport.forEach(storeName => {
        update(`Importing ${storeName}...`);
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

  private async importDatabaseFromZip(update: UpdateCallback, archive: JSZip) {
    const promises = [];
    archive.folder('chatRoomLogs').folder(/^[\d]+\/$/).forEach(contextFolder => {
      const context = contextFolder.name.substring('chatRoomLogs/'.length, contextFolder.name.length - 1);
      update(`Reading chat logs for ${context}`);

      archive.folder(contextFolder.name).forEach((relativePath, file) => {
        if (!file.name.endsWith('.json')) {
          console.warn(`Skipping unexpected file ${file.name}`);
          return;
        }

        promises.push(file.async('string').then(jsonString => {
          update(`Reading ${relativePath}`);
          const data = JSON.parse(jsonString, (_, value) => {
            if (typeof value === 'string' && ImportService.DateTimeRegex.test(value)) {
              return new Date(value);
            }
            return value;
          }) as IChatLog[];

          return new Promise(async (resolve, reject) => {
            update(`Importing ${relativePath}`);
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
                  update('Imported ' + relativePath, true);
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
      update(`Start importing members for ${context}`);

      archive.folder(contextFolder.name).folder(/^[\d]+\/$/).forEach(memberFolder => {
        const memberNumber = memberFolder.name.substring(contextFolder.name.length, memberFolder.name.length - 1);
        update(`Reading archive for ${memberNumber}`);

        promises.push(new Promise(async (resolve, reject) => {
          const memberPromises = [] as Promise<IMember>[];

          archive.folder(memberFolder.name).forEach((relativePath, file) => {
            switch (relativePath) {
              case 'data.json':
                update(`Reading data for ${memberFolder.name}`);
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
                update(`Reading appearance for ${memberFolder.name}`);
                memberPromises.push(file.async('base64').then(appearance => {
                  return {
                    appearance: 'data:image/png;base64,' + appearance
                  } as IMember;
                }));

                break;

              default:
                console.warn(`Skipping unexpected file ${file.name}`);
                break;
            }
          });

          const data = await Promise.all(memberPromises);
          const member = data.reduce((acc, cur) => Object.assign(acc, cur), {} as IMember);

          update(`Importing member ${member.memberNumber} for ${memberNumber}`);
          const transaction = await this.databaseService.transaction('members', 'readwrite');
          transaction.onerror = event => {
            reject(event);
          };
          const request = transaction.objectStore('members').add(member);
          request.addEventListener('success', _ => {
            update(`Imported member ${member.memberNumber} for ${memberNumber}`, true);
            resolve();
          });
        }));
      });
    });

    return Promise.all(promises).then(_ => update('Done importing.'));
  }
}

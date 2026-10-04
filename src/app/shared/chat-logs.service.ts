import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { SortDirection } from '@angular/material/sort';
import { IChatLog, IChatSessionRecord } from 'models';
import { IChatSession, IPage, IPlayerCharacter } from './models';
import { Observable } from 'rxjs';
import { readCursorPage, requestToPromise, startsWithRange } from './utils/indexed-db';

export type ChatSessionSort = 'start' | 'chatRoom';

@Injectable({
  providedIn: 'root'
})
export class ChatLogsService {

  constructor(private databaseService: DatabaseService) { }

  public async findPlayerCharacters(): Promise<IPlayerCharacter[]> {
    const transaction = await this.databaseService.transaction('chatRoomLogs');
    return new Promise(resolve => {
      const members: IPlayerCharacter[] = [];
      transaction.objectStore('chatRoomLogs')
        .index('sessionMemberNumber_idx')
        .openCursor(null, 'nextunique')
        .addEventListener('success', event => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const chatLog = cursor.value as IChatLog;
            members.push({
              memberNumber: chatLog.session.memberNumber,
              name: chatLog.session.name
            });
            cursor.continue();
          } else {
            resolve(members);
          }
        });
    });
  }

  /**
   * Retrieves one page of the chat sessions of a player character, sorted by
   * the database.
   *
   * @param memberNumber The member number of the player character
   * @param sort The column to sort on
   * @param direction The sort direction, ascending when empty
   * @param pageIndex The page to retrieve
   * @param pageSize The number of sessions per page
   * @returns The sessions of the page and the total number of sessions
   */
  public async findChatSessionsPage(memberNumber: number, sort: ChatSessionSort, direction: SortDirection, pageIndex: number, pageSize: number): Promise<IPage<IChatSession>> {
    const transaction = await this.databaseService.transaction('chatSessions');
    const index = transaction.objectStore('chatSessions')
      .index(sort === 'chatRoom' ? 'member_chatRoom_idx' : 'member_start_idx');
    const range = startsWithRange(memberNumber);

    const [total, records] = await Promise.all([
      requestToPromise(index.count(range)),
      readCursorPage<IChatSessionRecord>(index.openCursor(range, direction === 'desc' ? 'prev' : 'next'), pageIndex * pageSize, pageSize)
    ]);
    return {
      total,
      rows: records.map(record => ({
        sessionId: record.sessionId,
        chatRoom: record.chatRoom,
        start: record.start
      }))
    };
  }

  public findChatReplay(memberNumber: number, sessionId: string, chatRoom: string): Observable<IChatLog> {
    return new Observable(subscriber => {
      this.databaseService.transaction('chatRoomLogs').then(transaction => {
        const request = transaction.objectStore('chatRoomLogs')
          .index('member_session_chatRoom_idx')
          .openCursor([chatRoom, sessionId, memberNumber]);

        request.addEventListener('success', event => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const chatLog = cursor.value as IChatLog;
            subscriber.next(chatLog);
            cursor.continue();
          } else {
            subscriber.complete();
          }
        });

        request.addEventListener('error', event => {
          subscriber.error((event.target as IDBRequest<IDBCursorWithValue>).error);
        });
      });
    });
  }
}

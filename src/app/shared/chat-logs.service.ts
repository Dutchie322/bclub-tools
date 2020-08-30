import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { IChatLog } from 'models';
import { IChatSession, IPlayerMember } from './models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatLogsService {

  constructor(private databaseService: DatabaseService) { }

  public async findMembers(): Promise<IPlayerMember[]> {
    const transaction = await this.databaseService.transaction('chatRoomLogs');
    return new Promise(resolve => {
      const members: IPlayerMember[] = [];
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

  public async findChatRoomsForMemberNumber(memberNumber: number): Promise<IChatSession[]> {
    const transaction = await this.databaseService.transaction('chatRoomLogs');
    return new Promise(resolve => {
      const chatRooms: IChatSession[] = [];
      transaction.objectStore('chatRoomLogs')
        .index('member_session_chatRoom_idx')
        .openCursor(null, 'nextunique')
        .addEventListener('success', event => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const chatLog = cursor.value as IChatLog;
            if (chatLog.session.memberNumber === memberNumber) {
              chatRooms.push({
                sessionId: chatLog.session.id,
                chatRoom: chatLog.chatRoom,
                start: chatLog.timestamp
              });
            }
            cursor.continue();
          } else {
            resolve(chatRooms);
          }
        });
    });
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

  public getTotalSize(): Observable<number> {
    return this.databaseService.calculateTableSize('chatRoomLogs');
  }
}

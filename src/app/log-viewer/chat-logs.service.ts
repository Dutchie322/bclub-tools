import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { IChatLog } from 'models';
import { IChatSession, IMember } from './models';

@Injectable()
export class ChatLogsService {

  constructor(private databaseService: DatabaseService) { }

  public async findMembers(): Promise<IMember[]> {
    const transaction = await this.databaseService.transaction('chatRoomLogs');
    return new Promise(resolve => {
      const members: IMember[] = [];
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
        .index('chatRoom_idx')
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
}

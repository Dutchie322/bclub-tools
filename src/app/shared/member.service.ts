import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { IMember } from 'models';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  public constructor(private databaseService: DatabaseService) {}

  public async findMembersWithName(memberNumber: number) {
    const transaction = await this.databaseService.transaction('members');
    return new Promise<IMember[]>(resolve => {
      const members: IMember[] = [];
      transaction.objectStore('members')
        .openCursor(IDBKeyRange.bound([memberNumber, 0], [memberNumber, Infinity]))
        .addEventListener('success', event => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const member = cursor.value as IMember;
            if (member.memberName) {
              members.push(member);
            }
            cursor.continue();
          } else {
            resolve(members);
          }
        });
    });
  }
}

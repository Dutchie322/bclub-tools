import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { IMember } from 'models';
import { Observable } from 'rxjs';

export type MemberOverviewItem = {
  memberName: string,
  memberNumber: number,
  lastSeen: Date
};

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  public constructor(private databaseService: DatabaseService) {}

  public async findMembersWithName(memberNumber: number) {
    const transaction = await this.databaseService.transaction('members');
    return new Promise<MemberOverviewItem[]>(resolve => {
      const members: MemberOverviewItem[] = [];
      const request = transaction.objectStore('members').openCursor(IDBKeyRange.bound([memberNumber, 0], [memberNumber, Infinity]));
      request.addEventListener('error', event => {
        console.log('request error', event, request);
      });
      request.addEventListener('success', event => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const member = cursor.value as IMember;
          if (member.memberName) {
            members.push({
              memberName: member.nickname || member.memberName,
              memberNumber: member.memberNumber,
              lastSeen: member.lastSeen
            });
          }
          cursor.continue();
        } else {
          resolve(members);
        }
      });
    });
  }

  public retrieveMember(playerMemberNumber: number, memberNumber: number) {
    return new Observable<IMember>(subscriber => {
      this.databaseService.transaction('members').then(transaction => {
        const request = transaction.objectStore('members').get([playerMemberNumber, memberNumber]);

        request.addEventListener('success', event => {
          const member = (event.target as IDBRequest<IMember>).result;
          this.sanitizeData(member);
          subscriber.next(member);
          subscriber.complete();
        });

        request.addEventListener('error', event => {
          subscriber.error((event.target as IDBRequest<IMember>).error);
        });
      });
    });
  }

  public getTotalSize(): Observable<number> {
    return this.databaseService.calculateTableSize('members');
  }

  private sanitizeData(member: IMember) {
    if (typeof member.creation === 'number') {
      member.creation = new Date(member.creation);
    }
  }
}

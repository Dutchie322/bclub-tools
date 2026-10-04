import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { IMember, startTransaction } from 'models';
import { Observable } from 'rxjs';
import { DatabaseService } from './database.service';
import { findPrimaryKeys, requestToPromise, startsWithRange } from './utils/indexed-db';

export type MemberOverviewItem = {
  memberName: string,
  memberNickname?: string,
  memberNormalizedNickname?: string,
  memberNumber: number,
  lastSeen: Date
};

// Primary key of the members store: [playerMemberNumber, memberNumber]
export type MemberKey = [number, number];

export type MemberSort = 'memberName' | 'memberNumber' | 'lastSeen';

export interface MemberFilter {
  // Part of the name, nickname or normalized nickname, case insensitive
  memberName?: string;
  // Part of the member number
  memberNumber?: string;
  lastSeenStart?: Date;
  lastSeenEnd?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  constructor(private databaseService: DatabaseService) { }

  /**
   * Finds the primary keys of the people a player character knows by name,
   * ordered and filtered by the database. Only keys are read, so this stays
   * fast regardless of the size of the member records.
   *
   * @param memberNumber The member number of the player character
   * @param sort The column to sort on
   * @param direction The sort direction, ascending when empty
   * @param filter Optional filters that all have to match
   * @returns The ordered primary keys of the matching members
   */
  public async findMemberKeys(memberNumber: number, sort: MemberSort, direction: SortDirection, filter: MemberFilter = {}): Promise<MemberKey[]> {
    const transaction = await this.databaseService.transaction('members', 'readonly');
    const store = transaction.objectStore('members');
    const range = startsWithRange(memberNumber);

    // Only members with a name are shown, which memberName_idx contains
    const namedKeysRequest = requestToPromise(store.index('memberName_idx').getAllKeys(range) as IDBRequest<MemberKey[]>);
    const sortedKeysRequest =
      sort === 'memberNumber' ? requestToPromise(store.getAllKeys(range) as IDBRequest<MemberKey[]>) :
      sort === 'lastSeen' ? requestToPromise(store.index('lastSeen_idx').getAllKeys(range) as IDBRequest<MemberKey[]>) :
      namedKeysRequest;
    const filterRequests = this.findFilterMatches(store, memberNumber, filter);

    const namedKeys = await namedKeysRequest;
    const named = new Set(namedKeys.map(key => key[1]));
    let keys = (await sortedKeysRequest).filter(key => named.has(key[1]));
    if (sort === 'lastSeen') {
      // Members that were never seen don't have a lastSeen, so they are not in
      // the index. Treat them as the oldest.
      const seen = new Set(keys.map(key => key[1]));
      keys = namedKeys.filter(key => !seen.has(key[1])).concat(keys);
    }
    if (direction === 'desc') {
      keys.reverse();
    }

    for (const matches of await Promise.all(filterRequests)) {
      keys = keys.filter(key => matches.has(key[1]));
    }
    if (filter.memberNumber) {
      keys = keys.filter(key => key[1].toString().includes(filter.memberNumber));
    }

    return keys;
  }

  /**
   * Retrieves the overview data of the given members. Records that can't be
   * read are skipped.
   *
   * @param keys The primary keys of the members to retrieve
   * @returns The members in the order of `keys`
   */
  public async getMemberOverviewItems(keys: MemberKey[]): Promise<MemberOverviewItem[]> {
    if (keys.length === 0) {
      return [];
    }

    const transaction = await this.databaseService.transaction('members', 'readonly');
    const store = transaction.objectStore('members');
    const members = await Promise.all(keys.map(key => new Promise<IMember | undefined>(resolve => {
      const request = store.get(key) as IDBRequest<IMember>;
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', event => {
        console.warn('Could not read member', key, request.error);
        // Don't abort the transaction, so the other members can still be read
        event.preventDefault();
        resolve(undefined);
      });
    })));

    return members.filter(member => member).map(member => ({
      memberName: member.memberName,
      memberNickname: member.nickname,
      memberNormalizedNickname: member.normalizedNickname,
      memberNumber: member.memberNumber,
      lastSeen: member.lastSeen
    }));
  }

  private findFilterMatches(store: IDBObjectStore, memberNumber: number, filter: MemberFilter): Promise<Set<number>>[] {
    const toMemberNumbers = (keys: MemberKey[]) => new Set(keys.map(key => key[1]));
    const requests: Promise<Set<number>>[] = [];

    if (filter.memberName) {
      const name = filter.memberName.toLocaleUpperCase();
      const range = startsWithRange(memberNumber);
      const matchesName = (key: IDBValidKey) => {
        const value = (key as [number, unknown])[1];
        return typeof value === 'string' && value.toLocaleUpperCase().includes(name);
      };
      requests.push(Promise.all(['memberName_idx', 'nickname_idx', 'normalizedNickname_idx']
        .map(indexName => findPrimaryKeys<MemberKey>(store.index(indexName), range, matchesName)))
        .then(results => toMemberNumbers(results.flat())));
    }

    if (filter.lastSeenStart || filter.lastSeenEnd) {
      const range = IDBKeyRange.bound(
        filter.lastSeenStart ? [memberNumber, filter.lastSeenStart] : [memberNumber],
        filter.lastSeenEnd ? [memberNumber, filter.lastSeenEnd] : [memberNumber, []],
        !!filter.lastSeenStart,
        !!filter.lastSeenEnd);
      requests.push(requestToPromise(store.index('lastSeen_idx').getAllKeys(range) as IDBRequest<MemberKey[]>)
        .then(toMemberNumbers));
    }

    return requests;
  }

  public retrieveMember(playerMemberNumber: number, memberNumber: number) {
    return new Observable<IMember>(subscriber => {
      startTransaction('members', 'readonly').then(transaction => {
        const request = transaction.objectStore('members').get([playerMemberNumber, memberNumber]);

        request.addEventListener('success', event => {
          const member = (event.target as IDBRequest<IMember>).result;
          if (!member) {
            subscriber.error(`Member number ${memberNumber} not found.`);
            subscriber.complete();
            return;
          }

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

  private sanitizeData(member: IMember) {
    if (typeof member.creation === 'number') {
      member.creation = new Date(member.creation);
    }
  }
}

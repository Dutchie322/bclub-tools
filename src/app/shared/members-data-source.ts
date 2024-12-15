import { DataSource } from '@angular/cdk/collections';
import { IMember } from 'models';
import { BehaviorSubject, catchError, finalize, from, Observable, of } from 'rxjs';
import { DatabaseService } from './database.service';
import { MemberOverviewItem } from './member.service';
import { MatPaginator } from '@angular/material/paginator';

export type MemberFilters = Partial<{ memberName: string; memberNumber: string; lastSeenRange: Partial<{ start: Date; end: Date; }>; }>;

export class MembersDataSource extends DataSource<MemberOverviewItem> {
  private dataSubject = new BehaviorSubject<MemberOverviewItem[]>([]);
  private searchingSubject = new BehaviorSubject<boolean>(false);

  public searching$ = this.searchingSubject.asObservable();
  public paginator: MatPaginator;

  public constructor(private databaseService: DatabaseService) {
    super();
  }

  connect(): Observable<readonly MemberOverviewItem[]> {
    return this.dataSubject.asObservable();
  }

  disconnect(): void {
    this.dataSubject.complete();
    this.searchingSubject.complete();
  }

  searchMembers(context: number, filter: MemberFilters, pageIndex: number, pageSize: number) {
    this.searchingSubject.next(true);

    from(this.databaseService.transaction('members').then(transaction => {
      return new Promise<MemberOverviewItem[]>((resolve, reject) => {
        const request = transaction.objectStore('members').openCursor(IDBKeyRange.bound([context, 0], [context, Infinity]));
        const result = [] as MemberOverviewItem[];
        const start = pageIndex * pageSize;
        let n = 0;

        request.addEventListener('error', event => {
          console.log('request error', event, request);
          reject(event);
        });
        request.addEventListener('success', event => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (!cursor) {
            this.paginator.length = n;
            if (result.length < pageSize) {
              resolve(result);
            }

            return;
          }

          const member = cursor.value as IMember;

          if (!member.memberName) {
            cursor.continue();

            return;
          }

          if (this.filterPredicate(member, filter)) {
            if (n >= start && result.length < pageSize) {
              result.push({
                memberName: member.memberName,
                memberNumber: member.memberNumber,
                lastSeen: member.lastSeen
              });

              if (result.length == pageSize) {
                resolve(result);
              }
            }

            n++;
          }

          cursor.continue();
        });
      });
    })).pipe(
      catchError(err => {
        console.error('Error while searching members', err);
        return of([]);
      }),
      finalize(() => this.searchingSubject.next(false))
    )
    .subscribe(members => this.dataSubject.next(members));
  }

  private filterPredicate(data: IMember, filter: MemberFilters) {
    let match = true;
    if (filter['memberName']) {
      match = match && data.memberName.toLocaleUpperCase().indexOf(filter['memberName']) !== -1;
    }
    if (filter['memberNumber']) {
      match = match && data.memberNumber.toString().indexOf(filter['memberNumber']) !== -1;
    }
    if (filter['lastSeenRange'] && filter['lastSeenRange'].start) {
      match = match && data.lastSeen && data.lastSeen > filter['lastSeenRange'].start;
    }
    if (filter['lastSeenRange'] && filter['lastSeenRange'].end) {
      match = match && data.lastSeen && data.lastSeen < filter['lastSeenRange'].end;
    }
    return match;
  }

  private sortingDataAccessor(data, sortHeaderId) {
    if (sortHeaderId === 'memberName') {
      return data[sortHeaderId].toLocaleUpperCase();
    }
    return data[sortHeaderId];
  };
}

import { Component, ViewChild, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, map, tap, takeUntil } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ChatLogsService, ChatSessionSort } from '../shared/chat-logs.service';
import { IndexedDbDataSource, PageQueryFunction } from '../shared/indexed-db-data-source';
import { MemberFilter, MemberKey, MemberOverviewItem, MemberService, MemberSort } from '../shared/member.service';
import { IChatSession } from '../shared/models';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { getEndOfDayDate } from '../shared/utils/date';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-chat-sessions',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSortModule,
    MatTableModule,
    MatToolbarModule,
    RouterLink
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-sessions.component.html',
  styleUrls: ['./chat-sessions.component.scss']
})
export class ChatSessionsComponent implements OnDestroy {
  private destroySubject = new Subject<void>();

  @ViewChild('chatSessionsPaginator', { static: true })
  public set chatSessionsPaginator(paginator: MatPaginator) {
    this.chatSessions.paginator = paginator;
  }

  @ViewChild('chatSessionsSort', { static: true })
  public set chatSessionsSort(sort: MatSort) {
    this.chatSessions.sort = sort;
  }

  @ViewChild('membersPaginator', { static: true })
  public set membersPaginator(paginator: MatPaginator) {
    this.members.paginator = paginator;
  }

  @ViewChild('membersSort', { static: true })
  public set membersSort(sort: MatSort) {
    this.members.sort = sort;
  }

  public chatSessions = new IndexedDbDataSource<IChatSession>(null);
  public chatSessionsColumns = ['chatRoom', 'start'];

  public members = new IndexedDbDataSource<MemberOverviewItem, MemberFilter>({});
  public membersColumns = ['memberName', 'memberNumber', 'lastSeen'];
  public memberSearchForm = new FormGroup({
    memberName: new FormControl<string | null>(''),
    memberNumber: new FormControl<string | null>(''),
    lastSeenRange: new FormGroup({
      start: new FormControl<Date | null>(null),
      end: new FormControl<Date | null>(null),
    })
  });

  public get maxDate() {
    return new Date();
  }

  constructor(
    route: ActivatedRoute,
    chatLogsService: ChatLogsService,
    memberService: MemberService,
    title: Title
  ) {
    route.paramMap.pipe(
      map(params => +params.get('memberNumber')),
      tap(memberNumber => title.setTitle(`Sessions & People (${memberNumber}) - Bondage Club Tools`)),
      tap(memberNumber => {
        this.chatSessions.query = ({ sort, pageIndex, pageSize }) =>
          chatLogsService.findChatSessionsPage(memberNumber, sort.active as ChatSessionSort, sort.direction, pageIndex, pageSize);
        this.members.query = this.createMembersQuery(memberService, memberNumber);
      }),
      takeUntil(this.destroySubject)
    )
    .subscribe();

    this.memberSearchForm.valueChanges.pipe(
      // Every change queries the database
      debounceTime(300),
      tap(values => this.members.filter = this.sanitizeFilterValues(values)),
      takeUntil(this.destroySubject)
    ).subscribe();
  }

  ngOnDestroy() {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  clearSearchInputs() {
    this.memberSearchForm.patchValue({
      memberName: null,
      memberNumber: null,
      lastSeenRange: {
        start: null,
        end: null
      }
    });
  }

  /**
   * Creates the query for the people table. The ordered keys of all matching
   * people are kept between page changes, so turning a page only reads the
   * members on that page.
   */
  private createMembersQuery(memberService: MemberService, memberNumber: number): PageQueryFunction<MemberOverviewItem, MemberFilter> {
    let cached: { sortAndFilter: string; keys: Promise<MemberKey[]> } | null = null;
    return async ({ sort, filter, pageIndex, pageSize }) => {
      const sortAndFilter = JSON.stringify([sort, filter]);
      if (cached?.sortAndFilter !== sortAndFilter) {
        const keys = memberService.findMemberKeys(memberNumber, sort.active as MemberSort, sort.direction, filter);
        cached = { sortAndFilter, keys };
        // Don't keep a failed attempt around
        keys.catch(() => cached = null);
      }

      const keys = await cached.keys;
      const offset = pageIndex * pageSize;
      return {
        total: keys.length,
        rows: await memberService.getMemberOverviewItems(keys.slice(offset, offset + pageSize))
      };
    };
  }

  private sanitizeFilterValues(values: Partial<{ memberName: string; memberNumber: string; lastSeenRange: Partial<{ start: Date; end: Date; }>; }>): MemberFilter {
    return {
      memberName: values.memberName || undefined,
      memberNumber: values.memberNumber || undefined,
      lastSeenStart: values.lastSeenRange?.start || undefined,
      lastSeenEnd: (values.lastSeenRange?.end && getEndOfDayDate(values.lastSeenRange.end)) || undefined
    };
  }
}

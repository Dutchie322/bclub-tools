import { Component, ViewChild, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { map, tap, takeUntil } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ChatLogsService } from '../shared/chat-logs.service';
import { MemberOverviewItem, MemberService } from '../shared/member.service';
import { IChatSession } from '../shared/models';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
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
    this.chatSessions.sortingDataAccessor = (data, sortHeaderId) => {
      if (sortHeaderId === 'chatRoom') {
        return data[sortHeaderId].toLocaleUpperCase();
      }
      return data[sortHeaderId];
    };
  }

  @ViewChild('membersPaginator', { static: true })
  public set membersPaginator(paginator: MatPaginator) {
    this.members.paginator = paginator;
  }

  @ViewChild('membersSort', { static: true })
  public set membersSort(sort: MatSort) {
    this.members.sort = sort;
    this.members.sortingDataAccessor = (data, sortHeaderId) => {
      if (sortHeaderId === 'memberName') {
        return data[sortHeaderId].toLocaleUpperCase();
      }
      return data[sortHeaderId];
    };
  }

  public chatSessions = new MatTableDataSource<IChatSession>();
  public chatSessionsColumns = ['chatRoom', 'start'];

  public members = new MatTableDataSource<MemberOverviewItem>();
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
      tap(async memberNumber => this.chatSessions.data = await chatLogsService.findChatRoomsForMemberNumber(memberNumber)),
      tap(async memberNumber => this.members.data = await memberService.findMembersWithName(memberNumber)),
      takeUntil(this.destroySubject)
    )
    .subscribe();

    this.members.filterPredicate = (data, filter) => {
      // filter is actually of type "any" because it's the value from the memberSearchForm
      const anyFilter = filter as unknown as {
        memberName: string | null;
        memberNumber: string | null;
        lastSeenRange: { start: Date | null; end: Date | null; }
      };
      let match = true;
      if (anyFilter['memberName']) {
        match = match && data.memberName.toLocaleUpperCase().indexOf(anyFilter['memberName']) !== -1;
      }
      if (anyFilter['memberNumber']) {
        match = match && data.memberNumber.toString().indexOf(anyFilter['memberNumber']) !== -1;
      }
      if (anyFilter['lastSeenRange'] && anyFilter['lastSeenRange'].start) {
        match = match && data.lastSeen && data.lastSeen > anyFilter['lastSeenRange'].start;
      }
      if (anyFilter['lastSeenRange'] && anyFilter['lastSeenRange'].end) {
        match = match && data.lastSeen && data.lastSeen < anyFilter['lastSeenRange'].end;
      }
      return match;
    };
    this.memberSearchForm.valueChanges.pipe(
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

  private sanitizeFilterValues(values: Partial<{ memberName: string; memberNumber: string; lastSeenRange: Partial<{ start: Date; end: Date; }>; }>): string {
    return {
      memberName: values.memberName && values.memberName.toLocaleUpperCase(),
      memberNumber: values.memberNumber,
      lastSeenRange: {
        start: values.lastSeenRange.start,
        end: values.lastSeenRange.end && getEndOfDayDate(values.lastSeenRange.end)
      }
    } as unknown as string;
  }
}

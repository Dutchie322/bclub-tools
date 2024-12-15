import { Component, ViewChild, OnDestroy, ChangeDetectionStrategy, OnInit, AfterViewInit } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { merge, Subject } from 'rxjs';
import { map, tap, takeUntil, debounceTime } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { ChatLogsService } from '../shared/chat-logs.service';
import { IChatSession } from '../shared/models';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { getEndOfDayDate } from '../shared/utils/date';
import { MemberFilters, MembersDataSource } from '../shared/members-data-source';
import { DatabaseService } from '../shared/database.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatProgressSpinnerModule,
    MatTableModule,
    MatToolbarModule,
    RouterLink
  ],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-sessions.component.html',
  styleUrls: ['./chat-sessions.component.scss']
})
export class ChatSessionsComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroySubject = new Subject<void>();
  private context: number;

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
  public membersPaginator: MatPaginator;

  @ViewChild('membersSort', { static: true })
  public membersSort: MatSort;

  public chatSessions = new MatTableDataSource<IChatSession>();
  public chatSessionsColumns = ['chatRoom', 'start'];

  public members: MembersDataSource;
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
    private route: ActivatedRoute,
    chatLogsService: ChatLogsService,
    private databaseService: DatabaseService
  ) {
    route.paramMap.pipe(
      map(params => +params.get('memberNumber')),
      tap(memberNumber => this.context = memberNumber),
      tap(async memberNumber => this.chatSessions.data = await chatLogsService.findChatRoomsForMemberNumber(memberNumber)),
      takeUntil(this.destroySubject)
    )
    .subscribe();
  }

  ngOnInit() {
    this.members = new MembersDataSource(this.databaseService);
    this.members.paginator = this.membersPaginator;
  }

  ngAfterViewInit() {
    merge(this.route.paramMap, this.memberSearchForm.valueChanges).pipe(
      debounceTime(300),
      tap(() => this.membersPaginator.pageIndex = 0),
      takeUntil(this.destroySubject)
    )
    .subscribe();

    merge(this.route.paramMap, this.memberSearchForm.valueChanges, this.membersPaginator.page).pipe(
      debounceTime(300),
      tap(() => this.searchMembers()),
      takeUntil(this.destroySubject)
    )
    .subscribe();
  }

  ngOnDestroy() {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  searchMembers() {
    this.members.searchMembers(
      this.context,
      this.sanitizeFilterValues(this.memberSearchForm.value),
      this.membersPaginator.pageIndex,
      this.membersPaginator.pageSize);
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

  private sanitizeFilterValues(values: MemberFilters): MemberFilters {
    return {
      memberName: values.memberName && values.memberName.toLocaleUpperCase(),
      memberNumber: values.memberNumber,
      lastSeenRange: {
        start: values.lastSeenRange.start,
        end: values.lastSeenRange.end && getEndOfDayDate(values.lastSeenRange.end)
      }
    };
  }
}

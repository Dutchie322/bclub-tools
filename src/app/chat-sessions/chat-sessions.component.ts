import { Component, ViewChild, OnDestroy } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatLogsService } from '../shared/chat-logs.service';
import { IChatSession } from '../shared/models';
import { MemberOverviewItem, MemberService } from 'src/app/shared/member.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { UntypedFormGroup, UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { map, tap, takeUntil } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-chat-sessions',
    imports: [
      CommonModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatPaginatorModule,
      MatSortModule,
      MatTableModule,
      MatToolbarModule,
      RouterLink
    ],
    templateUrl: './chat-sessions.component.html',
    styleUrls: ['./chat-sessions.component.scss']
})
export class ChatSessionsComponent implements OnDestroy {
  private destroySubject = new Subject<void>();

  @ViewChild('chatSessionsPaginator', { static: true })
  public set chatSessionsPaginator(paginator: MatPaginator) {
    this.chatSessions.paginator = paginator;
  }

  @ViewChild('chatSessionsSort', {static: true})
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

  @ViewChild('membersSort', {static: true})
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
  public memberSearchForm = new UntypedFormGroup({
    memberName: new UntypedFormControl(''),
    memberNumber: new UntypedFormControl('')
  });

  constructor(
    route: ActivatedRoute,
    chatLogsService: ChatLogsService,
    memberService: MemberService
  ) {
    route.paramMap.pipe(
      map(params => +params.get('memberNumber')),
      tap(async memberNumber => this.chatSessions.data = await chatLogsService.findChatRoomsForMemberNumber(memberNumber)),
      tap(async memberNumber => this.members.data = await memberService.findMembersWithName(memberNumber)),
      takeUntil(this.destroySubject)
    )
    .subscribe();

    this.members.filterPredicate = (data, filter) => {
      // filter is actually of type "any" because it's the value from the memberSearchForm
      const anyFilter = filter as unknown as Record<string, string>;
      let match = true;
      if (anyFilter['memberName']) {
        match = match && data.memberName.toLocaleUpperCase().indexOf(anyFilter['memberName'].toLocaleUpperCase()) !== -1;
      }
      if (anyFilter['memberNumber']) {
        match = match && data.memberNumber.toString().indexOf(anyFilter['memberNumber']) !== -1;
      }
      return match;
    };
    this.memberSearchForm.valueChanges.pipe(
      tap(values => this.members.filter = values),
      takeUntil(this.destroySubject)
    ).subscribe();
  }

  ngOnDestroy() {
    this.destroySubject.next();
    this.destroySubject.complete();
  }
}

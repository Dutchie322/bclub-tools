import { Component, ViewChild, OnDestroy } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { ChatLogsService } from '../../shared/chat-logs.service';
import { IChatSession } from '../../shared/models';
import { IMember } from 'models';
import { MemberService } from 'src/app/shared/member.service';
import { MatPaginator } from '@angular/material/paginator';
import { FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { map, tap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chat-sessions',
  templateUrl: './chat-sessions.component.html',
  styleUrls: ['./chat-sessions.component.scss']
})
export class ChatSessionsComponent implements OnDestroy {
  private destroySubject = new Subject();

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

  public memberNumber: number;

  public chatSessions = new MatTableDataSource<IChatSession>();
  public chatSessionsColumns = ['chatRoom', 'start'];

  public members = new MatTableDataSource<IMember>();
  public membersColumns = ['memberName', 'memberNumber', 'lastSeen'];
  public memberSearchForm = new FormGroup({
    memberName: new FormControl(''),
    memberNumber: new FormControl('')
  });

  constructor(
    route: ActivatedRoute,
    chatLogsService: ChatLogsService,
    memberService: MemberService
  ) {
    route.paramMap.pipe(
      map(params => +params.get('memberNumber')),
      tap(memberNumber => this.memberNumber = memberNumber),
      tap(async memberNumber => this.chatSessions.data = await chatLogsService.findChatRoomsForMemberNumber(memberNumber)),
      tap(async memberNumber => this.members.data = await memberService.findMembersWithName(memberNumber)),
      takeUntil(this.destroySubject)
    )
    .subscribe();

    this.members.filterPredicate = (data, filter: any) => {
      let match = true;
      if (filter.memberName) {
        match = match && data.memberName.toLocaleUpperCase().indexOf(filter.memberName.toLocaleUpperCase()) !== -1;
      }
      if (filter.memberNumber) {
        match = match && data.memberNumber.toString().indexOf(filter.memberNumber) !== -1;
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

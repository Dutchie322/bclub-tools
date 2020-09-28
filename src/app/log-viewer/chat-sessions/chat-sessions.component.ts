import { Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { ChatLogsService } from '../../shared/chat-logs.service';
import { IChatSession } from '../../shared/models';
import { IMember, MemberTypeOrder } from 'models';
import { MemberService } from 'src/app/shared/member.service';

@Component({
  selector: 'app-chat-sessions',
  templateUrl: './chat-sessions.component.html',
  styleUrls: ['./chat-sessions.component.scss']
})
export class ChatSessionsComponent {
  @ViewChild('chatSessionsSort', {static: true}) set chatSessionsSort(sort: MatSort) {
    this.chatSessions.sort = sort;
  }
  @ViewChild('membersSort', {static: true}) set membersSort(sort: MatSort) {
    this.members.sort = sort;
  }

  public memberNumber: number;
  public chatSessions = new MatTableDataSource<IChatSession>();
  public members = new MatTableDataSource<IMember>();

  public chatSessionsColumns = ['chatRoom', 'start'];
  public membersColumns = ['memberName', 'memberNumber', 'type', 'lastSeen'];

  constructor(
    route: ActivatedRoute,
    chatLogsService: ChatLogsService,
    memberService: MemberService
  ) {
    route.paramMap.subscribe(async params => {
      this.memberNumber = +params.get('memberNumber');
      this.chatSessions.data = await chatLogsService.findChatRoomsForMemberNumber(this.memberNumber);
      this.members.data = await memberService.findMembersWithName(this.memberNumber);
      this.members.sortingDataAccessor = (data, sortHeaderId) => {
        if (sortHeaderId === 'type') {
          return MemberTypeOrder[data[sortHeaderId]];
        }
        return data[sortHeaderId];
      };
    });
  }
}

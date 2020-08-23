import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { ChatLogsService } from '../../shared/chat-logs.service';
import { IChatSession } from '../../shared/models';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-chat-sessions',
  templateUrl: './chat-sessions.component.html',
  styleUrls: ['./chat-sessions.component.scss']
})
export class ChatSessionsComponent implements OnInit {
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  public memberNumber: number;
  public chatSessions = new MatTableDataSource<IChatSession>();

  public chatSessionsColumns = ['chatRoom', 'start'];

  constructor(
    route: ActivatedRoute,
    chatLogsService: ChatLogsService
  ) {
    route.paramMap.subscribe(params => {
      this.memberNumber = +params.get('memberNumber');
      chatLogsService.findChatRoomsForMemberNumber(this.memberNumber).then(chatSessions => {
        this.chatSessions.data = chatSessions;
      });
    });
  }

  ngOnInit() {
    this.chatSessions.sort = this.sort;
  }
}

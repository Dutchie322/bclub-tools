import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { ChatLogsService } from '../../shared/chat-logs.service';
import { IChatSession } from '../../shared/models';

@Component({
  selector: 'app-chat-sessions',
  templateUrl: './chat-sessions.component.html',
  styleUrls: ['./chat-sessions.component.scss']
})
export class ChatSessionsComponent implements OnInit {
  public memberNumber: number;
  public chatSessions = new MatTableDataSource<IChatSession>();

  public chatSessionsColumns = ['chatRoom', 'date'];

  constructor(
    route: ActivatedRoute,
    chatLogsService: ChatLogsService
  ) {
    route.paramMap.subscribe(params => {
      this.memberNumber = +params.get('memberNumber');
      chatLogsService.findChatRoomsForMemberNumber(this.memberNumber).then(chatSessions => {
        this.chatSessions.data = chatSessions.sort((a, b) => {
          if (a.start > b.start) {
            return -1;
          }
          if (a.start < b.start) {
            return 1;
          }
          return 0;
        });
      });
    });
  }

  ngOnInit() {
  }

}

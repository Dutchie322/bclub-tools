import { Component, OnInit } from '@angular/core';
import { ChatLogsService } from '../chat-logs.service';
import { ActivatedRoute } from '@angular/router';
import { IChatSession } from '../models';

@Component({
  selector: 'app-chat-sessions',
  templateUrl: './chat-sessions.component.html',
  styleUrls: ['./chat-sessions.component.scss']
})
export class ChatSessionsComponent implements OnInit {
  public chatSessions: IChatSession[];

  constructor(
    route: ActivatedRoute,
    chatLogsService: ChatLogsService
  ) {
    route.paramMap.subscribe(params => {
      const memberNumber = +params.get('memberNumber');
      chatLogsService.findChatRoomsForMemberNumber(memberNumber).then(chatSessions => {
        this.chatSessions = chatSessions;
      });
    });
  }

  ngOnInit() {
  }

}

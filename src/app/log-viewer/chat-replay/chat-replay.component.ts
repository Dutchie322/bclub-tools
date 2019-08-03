import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatLogsService } from '../chat-logs.service';
import { IChatLog } from 'models';

@Component({
  selector: 'app-chat-replay',
  templateUrl: './chat-replay.component.html',
  styleUrls: ['./chat-replay.component.scss']
})
export class ChatReplayComponent implements OnInit {
  public chatLogs: IChatLog[];

  constructor(
    route: ActivatedRoute,
    chatLogsService: ChatLogsService
  ) {
    route.paramMap.subscribe(params => {
      const memberNumber = +params.get('memberNumber');
      const sessionId = params.get('sessionId');
      const chatRoom = params.get('chatRoom');
      chatLogsService.findChatReplay(memberNumber, sessionId, chatRoom).then(chatLogs => {
        this.chatLogs = chatLogs;
      });
    });
  }

  ngOnInit() {
  }

}

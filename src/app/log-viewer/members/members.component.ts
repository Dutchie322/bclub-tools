import { Component } from '@angular/core';
import { IChatLog } from 'models';
import { ChatLogsService } from '../chat-logs.service';
import { IMember, IChatSession } from '../models';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class LogViewerComponent {
  public logs: IChatLog[];
  public members: IMember[];
  public chatSessions: IChatSession[];

  constructor(private chatLogsService: ChatLogsService) {
    this.chatLogsService.findMembers().then(members => {
      this.members = members;
      this.chatLogsService.findChatRoomsForMemberNumber(this.members[0].memberNumber).then(sessions => {
        this.chatSessions = sessions;
      });
    });
  }

}

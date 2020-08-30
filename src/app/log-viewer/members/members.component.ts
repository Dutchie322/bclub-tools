import { Component } from '@angular/core';
import { ChatLogsService } from '../../shared/chat-logs.service';
import { IPlayerMember } from '../../shared/models';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class LogViewerComponent {
  public members: IPlayerMember[];

  constructor(private chatLogsService: ChatLogsService) {
    this.chatLogsService.findMembers().then(members => {
      this.members = members;
    });
  }

}

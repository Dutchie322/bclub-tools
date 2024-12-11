import { Component } from '@angular/core';
import { ChatLogsService } from '../shared/chat-logs.service';
import { IPlayerCharacter } from '../shared/models';
import { MatToolbar } from '@angular/material/toolbar';
import { MatList, MatListItem } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-player-characters',
    imports: [
      CommonModule,
      MatList,
      MatListItem,
      MatToolbar,
      RouterLink
    ],
    templateUrl: './player-characters.component.html',
    styleUrls: ['./player-characters.component.scss']
})
export class PlayerCharactersComponent {
  public playerCharacters: IPlayerCharacter[];

  constructor(private chatLogsService: ChatLogsService) {
    this.chatLogsService.findPlayerCharacters().then(characters => {
      this.playerCharacters = characters;
    });
  }

}

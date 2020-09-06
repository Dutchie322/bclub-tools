import { Component } from '@angular/core';
import { ChatLogsService } from '../../shared/chat-logs.service';
import { IPlayerCharacter } from '../../shared/models';

@Component({
  selector: 'app-player-characters',
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

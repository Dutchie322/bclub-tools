import { Routes } from '@angular/router';
import { AppComponent } from './app.component';

import { PlayerCharactersComponent } from './player-characters/player-characters.component';
import { ChatSessionsComponent } from './chat-sessions/chat-sessions.component';
import { ChatReplayComponent } from './chat-replay/chat-replay.component';
import { MemberInfoComponent } from './member-info/member-info.component';

export const routes: Routes = [
  {
    path: '',
    component: PlayerCharactersComponent
  },
  {
    path: ':memberNumber',
    component: ChatSessionsComponent
  },
  {
    path: ':playerCharacter/member/:memberNumber',
    component: MemberInfoComponent
  },
  {
    path: ':memberNumber/:sessionId/:chatRoom',
    component: ChatReplayComponent
  },
  {
    path: '**',
    component: AppComponent
  }
];

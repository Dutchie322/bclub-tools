import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlayerCharactersComponent } from './player-characters/player-characters.component';
import { ChatSessionsComponent } from './chat-sessions/chat-sessions.component';
import { ChatReplayComponent } from './chat-replay/chat-replay.component';
import { MemberInfoComponent } from './member-info/member-info.component';

const routes: Routes = [
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
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LogViewerRoutingModule { }

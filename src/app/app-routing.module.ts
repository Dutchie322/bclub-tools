import { NgModule } from '@angular/core';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';

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
  },
  {
    path: '**',
    component: AppComponent
  }
];

@NgModule({
  declarations: [
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy
    }
  ],
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

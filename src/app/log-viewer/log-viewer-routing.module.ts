import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LogViewerComponent } from './members/members.component';
import { ChatSessionsComponent } from './chat-sessions/chat-sessions.component';
import { ChatReplayComponent } from './chat-replay/chat-replay.component';

const routes: Routes = [
  {
    path: '',
    component: LogViewerComponent
  },
  {
    path: ':memberNumber',
    component: ChatSessionsComponent
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

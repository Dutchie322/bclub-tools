import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

import { LogViewerComponent } from './members/members.component';
import { LogViewerRoutingModule } from './log-viewer-routing.module';
import { ChatSessionsComponent } from './chat-sessions/chat-sessions.component';
import { ChatReplayComponent } from './chat-replay/chat-replay.component';
import { ChatLineComponent } from './chat-replay/chat-line/chat-line.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    LogViewerComponent,
    ChatSessionsComponent,
    ChatReplayComponent,
    ChatLineComponent
  ],
  entryComponents: [
    ChatLineComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    LogViewerRoutingModule,

    MatListModule,
    MatToolbarModule
  ]
})
export class LogViewerModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogViewerComponent } from './members/members.component';
import { LogViewerRoutingModule } from './log-viewer-routing.module';
import { DatabaseService } from './database.service';
import { ChatLogsService } from './chat-logs.service';
import { ChatSessionsComponent } from './chat-sessions/chat-sessions.component';
import { ChatReplayComponent } from './chat-replay/chat-replay.component';
import { ChatLineComponent } from './chat-replay/chat-line/chat-line.component';

@NgModule({
  declarations: [
    LogViewerComponent,
    ChatSessionsComponent,
    ChatReplayComponent,
    ChatLineComponent
  ],
  providers: [
    ChatLogsService,
    DatabaseService
  ],
  entryComponents: [
    ChatLineComponent
  ],
  imports: [
    CommonModule,
    LogViewerRoutingModule
  ]
})
export class LogViewerModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogViewerComponent } from './members/members.component';
import { LogViewerRoutingModule } from './log-viewer-routing.module';
import { DatabaseService } from './database.service';
import { ChatLogsService } from './chat-logs.service';
import { ChatSessionsComponent } from './chat-sessions/chat-sessions.component';
import { ChatReplayComponent } from './chat-replay/chat-replay.component';

@NgModule({
  declarations: [
    LogViewerComponent,
    ChatSessionsComponent,
    ChatReplayComponent
  ],
  providers: [
    ChatLogsService,
    DatabaseService
  ],
  imports: [
    CommonModule,
    LogViewerRoutingModule
  ]
})
export class LogViewerModule { }

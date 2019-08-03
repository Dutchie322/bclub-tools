import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogViewerComponent } from './log-viewer/log-viewer.component';
import { LogViewerRoutingModule } from './log-viewer-routing.module';
import { DatabaseService } from './database.service';
import { ChatLogsService } from './chat-logs.service';

@NgModule({
  declarations: [
    LogViewerComponent
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

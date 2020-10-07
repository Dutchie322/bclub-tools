import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import {
  MatCheckboxModule,
  MatDatepickerModule,
  MatIconModule,
  MatListModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatSnackBarModule,
  MatSortModule,
  MatTableModule,
  MatToolbarModule,
  MatInputModule,
  MatSelectModule,
} from '@angular/material';

import { PlayerCharactersComponent } from './player-characters/player-characters.component';
import { LogViewerRoutingModule } from './log-viewer-routing.module';
import { ChatSessionsComponent } from './chat-sessions/chat-sessions.component';
import { ChatReplayComponent } from './chat-replay/chat-replay.component';
import { ChatLineComponent } from './chat-replay/chat-line/chat-line.component';
import { SharedModule } from '../shared/shared.module';
import { MemberInfoComponent } from './member-info/member-info.component';

@NgModule({
  declarations: [
    ChatSessionsComponent,
    ChatReplayComponent,
    ChatLineComponent,
    PlayerCharactersComponent,
    MemberInfoComponent
  ],
  entryComponents: [
    ChatLineComponent
  ],
  imports: [
    // Angular modules
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,

    // Material modules
    MatCheckboxModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatToolbarModule,

    // Own modules
    SharedModule,
    LogViewerRoutingModule
  ]
})
export class LogViewerModule { }

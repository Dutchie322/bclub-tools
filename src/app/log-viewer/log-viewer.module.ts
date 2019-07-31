import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LogViewerComponent } from './log-viewer/log-viewer.component';
import { LogViewerRoutingModule } from './log-viewer-routing.module';

@NgModule({
  declarations: [
    LogViewerComponent
  ],
  imports: [
    CommonModule,
    LogViewerRoutingModule
  ]
})
export class LogViewerModule { }

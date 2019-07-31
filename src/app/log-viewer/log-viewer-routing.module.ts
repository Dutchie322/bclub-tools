import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LogViewerComponent } from './log-viewer/log-viewer.component';

const routes: Routes = [
  {
    path: '**',
    component: LogViewerComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LogViewerRoutingModule { }

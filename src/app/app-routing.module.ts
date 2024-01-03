import { NgModule } from '@angular/core';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';

const routes: Routes = [
  {
    // TODO Remove lazy loading, not needed anymore
    path: 'log-viewer',
    loadChildren: () => import('./log-viewer/log-viewer.module').then(mod => mod.LogViewerModule)
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

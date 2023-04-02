import { NgModule } from '@angular/core';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';

const routes: Routes = [
  {
    path: 'log-viewer',
    loadChildren: () => import('./log-viewer/log-viewer.module').then(mod => mod.LogViewerModule)
  },
  {
    path: 'options',
    loadChildren: () => import('./options/options.module').then(mod => mod.OptionsModule)
  },
  {
    path: 'popup',
    loadChildren: () => import('./popup/popup.module').then(mod => mod.PopupModule)
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

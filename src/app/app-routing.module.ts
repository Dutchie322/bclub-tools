import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { QueryPathRouterGuard } from './query-path-router.guard';

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
    component: AppComponent,
    canActivate: [QueryPathRouterGuard]
  }
];

@NgModule({
  declarations: [
  ],
  providers: [
    QueryPathRouterGuard
  ],
  imports: [
    // Third party
    RouterModule.forRoot(routes, {
      useHash: false
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

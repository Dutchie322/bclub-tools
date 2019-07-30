import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { QueryPathRouterGuard } from './query-path-router.guard';
import { AppComponent } from './app.component';
import { PopupComponent } from './popup/popup/popup.component';
import { OptionsComponent } from './options/options/options.component';
import { PopupModule } from './popup/popup.module';
import { OptionsModule } from './options/options.module';

const routes: Routes = [
  { path: 'popup', component: PopupComponent },
  { path: 'options', component: OptionsComponent },
  { path: '**', component: AppComponent, canActivate: [QueryPathRouterGuard] }
];

@NgModule({
  declarations: [
  ],
  providers: [
    QueryPathRouterGuard
  ],
  imports: [
    // Third party
    RouterModule.forRoot(routes),

    // Own modules
    OptionsModule,
    PopupModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

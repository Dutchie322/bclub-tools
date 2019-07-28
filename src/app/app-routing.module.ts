import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Guard } from './guard.guard';
import { AppComponent } from './app.component';


const routes: Routes = [
  // { path: 'login', component: LoginComponent },
  // { path: 'options', component: OptionsComponent },
  // { path: 'background', component: BackgroundComponent },
  // { path: '**', component: AppComponent, canActivate: [Guard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

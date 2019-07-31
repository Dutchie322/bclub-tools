import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OptionsComponent } from './options/options.component';
import { OptionsRoutingModule } from './options-routing.module';

@NgModule({
  declarations: [
    OptionsComponent
  ],
  imports: [
    CommonModule,
    OptionsRoutingModule
  ]
})
export class OptionsModule { }

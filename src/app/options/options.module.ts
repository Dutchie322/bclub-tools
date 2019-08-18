import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { OptionsComponent } from './options/options.component';
import { OptionsRoutingModule } from './options-routing.module';

@NgModule({
  declarations: [
    OptionsComponent
  ],
  imports: [
    // Angular modules
    CommonModule,
    OptionsRoutingModule,
    ReactiveFormsModule,

    // Angular Material modules
    MatCheckboxModule,
    MatCardModule,
    MatListModule,
    MatSnackBarModule,
    MatToolbarModule
  ]
})
export class OptionsModule { }

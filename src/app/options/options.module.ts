import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
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
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
    MatSortModule,
    MatToolbarModule
  ]
})
export class OptionsModule { }

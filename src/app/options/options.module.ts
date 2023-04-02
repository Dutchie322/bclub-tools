import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';

import { OptionsComponent } from './options/options.component';
import { OptionsRoutingModule } from './options-routing.module';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';

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
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatToolbarModule
  ]
})
export class OptionsModule { }

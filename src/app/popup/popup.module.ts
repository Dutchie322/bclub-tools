import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';

import { PopupComponent } from './popup/popup.component';

@NgModule({
  declarations: [
    PopupComponent
  ],
  imports: [
    CommonModule,

    // Material design
    MatIconModule,
    MatListModule,
    MatToolbarModule
  ]
})
export class PopupModule { }

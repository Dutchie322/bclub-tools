import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { PopupComponent } from './popup/popup.component';
import { PopupRoutingModule } from './popup-routing.module';

@NgModule({
  declarations: [
    PopupComponent
  ],
  imports: [
    CommonModule,
    PopupRoutingModule,

    // Material design
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTabsModule,
    MatTableModule,
    MatToolbarModule
  ]
})
export class PopupModule { }

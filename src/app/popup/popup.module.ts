import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { PopupComponent } from './popup/popup.component';
import { PopupRoutingModule } from './popup-routing.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    PopupComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    PopupRoutingModule,

    // Material design
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatListModule,
    MatTabsModule,
    MatTableModule,
    MatToolbarModule
  ]
})
export class PopupModule { }

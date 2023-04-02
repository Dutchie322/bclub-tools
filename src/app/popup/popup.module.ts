import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { PopupComponent } from './popup/popup.component';
import { PopupRoutingModule } from './popup-routing.module';
import { SharedModule } from '../shared/shared.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NewVersionNotificationComponent } from './new-version-notification/new-version-notification.component';

@NgModule({
  declarations: [
    PopupComponent,
    NewVersionNotificationComponent
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
    MatSnackBarModule,
    MatSortModule,
    MatTabsModule,
    MatTableModule,
    MatToolbarModule
  ]
})
export class PopupModule { }

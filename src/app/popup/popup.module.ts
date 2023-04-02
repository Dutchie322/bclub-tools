import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { PopupComponent } from './popup/popup.component';
import { PopupRoutingModule } from './popup-routing.module';
import { SharedModule } from '../shared/shared.module';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
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

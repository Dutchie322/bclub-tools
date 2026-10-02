import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_SNACK_BAR_DATA, MatSnackBarModule, MatSnackBarRef } from '@angular/material/snack-bar';

export interface NewVersionNotificationData {
  summary: string | null;
}

@Component({
    selector: 'app-new-version-notification',
    imports: [
      MatButtonModule,
      MatSnackBarModule
    ],
    templateUrl: './new-version-notification.component.html',
    styleUrls: ['./new-version-notification.component.scss']
})
export class NewVersionNotificationComponent {
  public snackBarRef = inject(MatSnackBarRef);
  public data: NewVersionNotificationData = inject(MAT_SNACK_BAR_DATA);
  public extensionVersion = chrome.runtime.getManifest().version;

  public showChangelog() {
    chrome.tabs.create({
      url: 'https://github.com/Dutchie322/bclub-tools/releases/tag/v' + this.extensionVersion
    });
    this.snackBarRef.dismiss();
  }
}

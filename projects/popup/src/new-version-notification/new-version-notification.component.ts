import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
    selector: 'app-new-version-notification',
    imports: [MatButtonModule, MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction],
    templateUrl: './new-version-notification.component.html',
    styleUrls: ['./new-version-notification.component.scss']
})
export class NewVersionNotificationComponent {
  public snackBarRef = inject(MatSnackBarRef);
  public extensionVersion = chrome.runtime.getManifest().version;

  public showChangelog() {
    chrome.tabs.create({
      url: 'https://github.com/Dutchie322/bclub-tools/releases/tag/v' + this.extensionVersion
    });
    this.snackBarRef.dismiss();
  }
}

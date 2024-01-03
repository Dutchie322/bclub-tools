import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-new-version-notification',
  imports: [
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './new-version-notification.component.html',
  styleUrls: ['./new-version-notification.component.scss']
})
export class NewVersionNotificationComponent {

  public extensionVersion: string;

  constructor(public snackBarRef: MatSnackBarRef<NewVersionNotificationComponent>) {
    this.extensionVersion = chrome.runtime.getManifest().version;
  }

  public showChangelog() {
    chrome.tabs.create({
      url: 'https://github.com/Dutchie322/bclub-tools/releases/tag/v' + this.extensionVersion
    });
  }
}

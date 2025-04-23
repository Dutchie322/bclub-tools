import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UntypedFormGroup, UntypedFormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { storeGlobal, ISettings, retrieveGlobal, executeForAllGameTabs, IMember } from 'models';
import { DatabaseService } from 'src/app/shared/database.service';
import { humanFileSize } from 'src/app/shared/utils/human-file-size';
import { ExportService, IExportProgressState } from 'src/app/shared/export.service';
import { ImportService, IImportProgressState } from 'src/app/shared/import.service';
import { MaintenanceService } from 'src/app/shared/maintenance.service';

@Component({
    selector: 'app-options',
    imports: [
        // Angular modules
        CommonModule,
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
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSnackBarModule,
        MatSortModule,
        MatToolbarModule
    ],
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnDestroy {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  public chatRoomRefreshIntervals = [
    0,
    10,
    15,
    30,
    60,
    120,
    300,
    600
  ];

  private formSubscription: Subscription;

  public dataForm = new UntypedFormGroup({
    exportAppearances: new UntypedFormControl(false)
  });
  public settingsForm = new UntypedFormGroup({
    notifications: new UntypedFormGroup({
      keywords: new UntypedFormControl([])
    }),
    tools: new UntypedFormGroup({
      chatRoomRefreshInterval: new UntypedFormControl(0)
    })
  });
  public exportProgress?: IExportProgressState;
  public importProgress?: IImportProgressState;
  public databaseOperationInProgress: boolean;
  public estimatedUsage: Promise<{ usage: string, quota: string }>;

  public get notificationControls(): UntypedFormGroup {
    return this.settingsForm.get('notifications') as UntypedFormGroup;
  }

  public get notifyKeywordsControl(): UntypedFormControl {
    return this.notificationControls.get('keywords') as UntypedFormControl;
  }

  constructor(
    private databaseService: DatabaseService,
    private exportService: ExportService,
    private importService: ImportService,
    private maintenanceService: MaintenanceService,
    private snackBar: MatSnackBar
  ) {
    retrieveGlobal('settings').then(settings => {
      this.settingsForm.patchValue(settings, {
        emitEvent: false
      });
    });

    this.formSubscription = this.settingsForm.valueChanges.pipe(
      map(value => ({
        notifications: {
          keywords: value.notifications.keywords
        },
        tools: {
          chatRoomRefreshInterval: value.tools.chatRoomRefreshInterval
        }
      } as ISettings)),
      tap(settings => storeGlobal('settings', settings)),
      tap(() => this.showSavedNotice()),
      tap(settings => executeForAllGameTabs(tab => chrome.tabs.sendMessage(tab.id, settings)))
    ).subscribe();

    this.updateUsage();
  }

  ngOnDestroy() {
    this.formSubscription.unsubscribe();
  }

  public addKeyword(event: MatChipInputEvent) {
    const input = event.chipInput.inputElement;
    const value = event.value;

    if ((value || '').trim()) {
      const keywords = this.notifyKeywordsControl.value as string[];
      keywords.push(value);
      this.notifyKeywordsControl.setValue(keywords);
    }

    if (input) {
      input.value = '';
    }
  }

  public removeKeyword(keyword: string) {
    const keywords = this.notifyKeywordsControl.value as string[];
    const index = keywords.indexOf(keyword);
    if (index >= 0) {
      keywords.splice(index, 1);
      this.notifyKeywordsControl.setValue(keywords);
    }
  }

  public formatInterval(value: number) {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    let label = '';

    if (minutes > 0) {
      label += `${minutes} minutes `;
    }
    if (seconds > 0) {
      label += `${seconds} seconds`;
    }

    return label.trim();
  }

  public async downloadDatabase() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any Apparently ng build doesn't know `showSaveFilePicker`...
      const handle = await (<any>window).showSaveFilePicker({
        id: 'bctools-export',
        startIn: 'downloads',
        suggestedName: 'bondage-club-tools-export-' + new Date().toISOString() + '.zip',
        types: [
          {
            description: 'ZIP File',
            accept: { 'application/zip': ['.zip'] }
          }
        ]
      });

      this.exportService.exportDatabase({
        exportAppearances: this.dataForm.get('exportAppearances').value,
        handle
      }).subscribe({
        next: update => {
          if (update instanceof Blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(update);
            link.download = 'bondage-club-tools-export-' + new Date().toISOString() + '.zip';
            link.click();
          } else {
            this.exportProgress = update;
          }
        },
        error: error => {
          console.error(error);
          alert(error);
          this.exportProgress = undefined;
        },
        complete: () => this.exportProgress = undefined
      });
    } catch (e) {
      console.warn(e);
    }
  }

  public uploadDatabase() {
    const input = document.createElement('input') as HTMLInputElement;
    input.accept = 'application/json,.json,application/zip,.zip';
    input.type = 'file';
    input.addEventListener('change', async () => {
      const file = input.files[0];
      this.importService.importDatabase(file).subscribe({
        next: update => {
          this.importProgress = update;
        },
        error: error => {
          console.error(error);
          alert(error);
          this.importProgress = undefined;
        },
        complete: () => {
          console.log('upload complete', NgZone.isInAngularZone())
          this.importProgress = undefined;
          this.updateUsage();
        }
      });
    });
    input.click();
  }

  public async fixMembers() {
    this.databaseOperationInProgress = true;
    await this.maintenanceService.runImmediately();
    this.databaseOperationInProgress = false;
  }

  public async clearAppearances() {
    if (!confirm('Are you sure you want to delete all appearances?')) {
      return;
    }

    console.log('Clearing appearances...');
    const transaction = await this.databaseService.transaction('members', 'readwrite');
    transaction.onerror = event => {
      console.error(event);
    };
    const cursorRequest = transaction.objectStore('members').openCursor();
    cursorRequest.addEventListener('success', event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (!cursor) {
        console.log('Appearances cleared.');
        this.updateUsage();
        return;
      }

      const member = cursor.value as IMember;
      delete member.appearance;
      delete member.appearanceMetaData;
      cursor.update(member);
      cursor.continue();
    });
    cursorRequest.addEventListener('error', event => {
      console.error(event);
    });
  }

  public async clearDatabase() {
    if (!confirm('Are you sure you want to delete everything?')) {
      return
    }

    console.log('Clearing database...');
    const objectStoreNames = await this.databaseService.objectStoreNames;
    const transaction = await this.databaseService.transaction(objectStoreNames, 'readwrite');
    transaction.onerror = event => {
      console.error(event);
    };
    let count = 0;
    objectStoreNames.forEach(storeName => {
      console.log(`Clearing ${storeName}...`);
      transaction.objectStore(storeName).clear().onsuccess = () => {
        count++;
        console.log(`Done ${storeName}`);
        if (count === objectStoreNames.length) {
          console.log('Done with all');
        this.updateUsage();
        }
      };
    });
  }

  private showSavedNotice() {
    this.snackBar.open('Preferences saved', undefined, {
      duration: 2000,
    });
  }

  private updateUsage() {
    setTimeout(() => {
      this.estimatedUsage = navigator.storage.estimate().then(estimated => ({
        usage: humanFileSize(estimated.usage),
        quota: humanFileSize(estimated.quota)
      }));
    });
  }
}

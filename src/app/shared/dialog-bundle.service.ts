import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { parse } from 'papaparse';
import { IDialog } from '../../../models/game';

@Injectable({
  providedIn: 'root'
})
export class DialogBundleService {
  private static readonly Activity: { [key: string]: string; }[] = [];
  private static readonly Dialog: IDialog[] = [];

  public constructor(httpClient: HttpClient) {
    const dialogPlayerUrl = chrome.runtime.getURL('assets/Dialog_Player.csv');
    httpClient.get(dialogPlayerUrl, {
      responseType: 'text'
    }).subscribe(value => {
      parse(value, {
        complete: (results: any) => {
          console.log(results);
          DialogBundleService.Dialog.push(...results.data.map(this.mapDialog));
        }
      });
    });

    const activityDictionaryUrl = chrome.runtime.getURL('assets/ActivityDictionary.csv');
    httpClient.get(activityDictionaryUrl, {
      responseType: 'text'
    }).subscribe(value => {
      parse(value, {
        complete: (results: any) => {
          console.log(results);
          for (const activity of results.data) {
            DialogBundleService.Activity[activity[0]] = activity[1];
          }
        }
      });
    });
  }

  private mapDialog(dialog: string[]) {
    return {
      Stage: dialog[0],
      // NextStage: dialog[1],
      // Option: dialog[2],
      Result: dialog[3],
      // Function: dialog[4],
      // Prerequisite: dialog[5],
      // Group: dialog[6],
      // Trait: dialog[7],
    } as IDialog;
  }

  public findActivity(content: string): string {
    return DialogBundleService.Activity[content];
  }

  public findDialog(content: string): string {
    const dialog = DialogBundleService.Dialog.find(line => line.Stage === content);
    return (dialog && dialog.Result.trim()) || content;
  }
}

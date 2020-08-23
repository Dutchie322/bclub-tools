import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { parse } from 'papaparse';
import { IAsset, IDialog } from '../../../models/internal';

@Injectable({
  providedIn: 'root'
})
export class DialogBundleService {
  private static readonly Activity: { [key: string]: string; }[] = [];
  private static readonly Asset: IAsset[] = [];
  private static readonly Dialog: IDialog[] = [];

  public constructor(private httpClient: HttpClient) {
    this.loadDictionary('ActivityDictionary', data => {
      for (const activity of data) {
        DialogBundleService.Activity[activity[0]] = activity[1];
      }
    });
    this.loadDictionary('AssetsDictionary', data => {
      DialogBundleService.Asset.push(...data.map(this.mapAsset));
    });
    this.loadDictionary('Dialog_Player', data => {
      DialogBundleService.Dialog.push(...data.map(this.mapDialog));
    });
  }

  private loadDictionary(fileName: string, processData: (data: any[]) => void) {
    const url = chrome.runtime.getURL(`assets/${fileName}.csv`);
    this.httpClient.get(url, {
      responseType: 'text'
    }).subscribe(value => {
      parse(value, {
        complete: (results: any) => {
          processData(results.data);
        }
      });
    });
  }

  private mapAsset(asset: string[]): IAsset {
    return {
      GroupName: asset[0] && asset[0].trim(),
      ItemName: (asset[1] && asset[1].trim()) || undefined,
      Result: asset[2] && asset[2].trim(),
    };
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
    return DialogBundleService.Activity[content] || content;
  }

  public findAssetGroupName(group: string): string {
    const filtered = DialogBundleService.Asset.filter(asset => asset.GroupName === group && !asset.ItemName);
    if (filtered[0] && filtered[0].Result) {
      return filtered[0].Result.toLowerCase();
    }
    return group;
  }

  public findAssetName(item: string, group?: string): string {
    let filtered = DialogBundleService.Asset.filter(asset => asset.ItemName === item);
    if (group) {
      const filteredByGroup = filtered.filter(asset => asset.GroupName === group);
      if (filteredByGroup.length > 0) {
        filtered = filteredByGroup;
      }
    }
    if (filtered[0] && filtered[0].Result) {
      return filtered[0].Result.toLowerCase();
    }
    return item;
  }

  public findDialog(content: string): string {
    const dialog = DialogBundleService.Dialog.find(line => line.Stage === content);
    return (dialog && dialog.Result.trim()) || content;
  }
}

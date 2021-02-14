import { parse as parseCsv } from 'papaparse';
import { IChatLog } from '../database';
import { IAsset, IDialog } from '../internal';

let loaded = false;
const ActivityNameCache: { [key: string]: string; }[] = [];
const AssetNameCache: IAsset[] = [];
const DialogCache: IDialog[] = [];

export function renderContent(chatLog: IChatLog): string {
  if (!loaded) {
    loadDictionary('ActivityDictionary', data => {
      for (const activity of data) {
        ActivityNameCache[activity[0]] = activity[1];
      }
    });
    loadDictionary('Female3DCG', data => {
      AssetNameCache.push(...data.map(mapAsset));
    });
    loadDictionary('Dialog_Player', data => {
      DialogCache.push(...data.map(mapDialog));
    });
    loaded = true;
  }

  let content = chatLog.content;

  if (chatLog.type === 'Action' || chatLog.type === 'ServerMessage') {
    content = chatLog.type === 'ServerMessage' ? 'ServerMessage' + content : content;
    content = findDialog(content);
    if (chatLog.dictionary) {
      for (const dictionary of chatLog.dictionary) {
        let replacement = String(dictionary.Text);
        if (dictionary.Tag === 'DestinationCharacter') {
          replacement += findDialog('\'s');
        } else if (dictionary.TextToLookUp) {
          replacement = findDialog(dictionary.TextToLookUp);
        } else if (dictionary.AssetName) {
          const entry = chatLog.dictionary.find(kvp => !!kvp.AssetGroupName);
          replacement = findAssetName(dictionary.AssetName, entry && entry.AssetGroupName);
        } else if (dictionary.AssetGroupName) {
          replacement = findAssetGroupName(dictionary.AssetGroupName);
        }

        content = content.replace(dictionary.Tag, replacement);
      }
    }
  }

  if (chatLog.type === 'Activity') {
    content = findActivity(content);
    if (chatLog.dictionary) {
      for (const dictionary of chatLog.dictionary) {
        if (dictionary.Text) {
          content = content.replace(dictionary.Tag, String(dictionary.Text));
        }
      }
    }
  }

  return content;
}


export function findActivity(content: string): string {
  return ActivityNameCache[content] || content;
}

export function findAssetGroupName(group: string): string {
  const filtered = AssetNameCache.filter(asset => asset.GroupName === group && !asset.ItemName);
  if (filtered[0] && filtered[0].Result) {
    return filtered[0].Result.toLowerCase();
  }
  return group;
}

export function findAssetName(item: string, group?: string): string {
  let filtered = AssetNameCache.filter(asset => asset.ItemName === item);
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

export function findDialog(content: string): string {
  const dialog = DialogCache.find(line => line.Stage === content);
  return (dialog && dialog.Result.trim()) || content;
}

async function loadDictionary(fileName: string, processData: (data: any[]) => void) {
  const url = chrome.runtime.getURL(`assets/${fileName}.csv`);
  const response = await fetch(url);
  const value = await response.text();
  parseCsv(value, {
    complete: (results: any) => {
      processData(results.data);
    }
  });
}

function mapAsset(asset: string[]): IAsset {
  return {
    GroupName: asset[0] && asset[0].trim(),
    ItemName: (asset[1] && asset[1].trim()) || undefined,
    Result: asset[2] && asset[2].trim(),
  };
}

function mapDialog(dialog: string[]) {
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

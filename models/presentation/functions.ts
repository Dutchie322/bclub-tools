// tslint:disable-next-line
/// <reference path="./Typedef.d.ts" />

import { parse as parseCsv } from 'papaparse';
import { IChatLog, IMember, retrieveMember, IChatMessageCharacter, IChatMessageCharacters } from '../database';
import { IAsset, IDialog } from '../internal';

interface ChatLogMetaData {
  SourceCharacter?: IChatMessageCharacter;
  TargetCharacter?: IChatMessageCharacter;
  FocusGroup?: { Name: string, Description: string };
}

type ChatLogSubstitution = [string, string];

let loading: Promise<any[]>;
const ActivityNameCache: Record<string, string>[] = [];
const AssetNameCache: IAsset[] = [];
const DialogCache: IDialog[] = [];
const MemberCache: Record<number, Promise<IMember>> = {};

export async function renderContent(chatLog: IChatLog): Promise<string> {
  await loadAndCacheDictionaries();
  let content = chatLog.content;
  if (chatLog.type === 'Action' || chatLog.type === 'ServerMessage') {
    content = chatLog.type === 'ServerMessage' ? 'ServerMessage' + content : content;
    content = findDialog(content);
  }

  if (chatLog.type === 'Activity') {
    content = findActivity(content);
  }

  if (!chatLog.dictionary) {
    return content;
  }

  // Logic has been largely copied from ChatRoomMessageDefaultMetadataExtractor() in ChatRoom.js,
  // minus stuff we don't need for displaying purposes.
  const metadata: ChatLogMetaData = {};
  let substitutions: ChatLogSubstitution[] = [];
  for (const entry of chatLog.dictionary) {
    if (hasSourceCharacter(entry)) {
      metadata.SourceCharacter = await getChatMessageCharacter(chatLog, 'SourceCharacter', entry.SourceCharacter);
    } else if (hasTargetCharacter(entry)) {
      metadata.TargetCharacter = await getChatMessageCharacter(chatLog, 'TargetCharacter', entry.TargetCharacter);
    } else if (hasCharacterReference(entry)) {
      if (entry.Tag === 'SourceCharacter') {
        metadata.SourceCharacter = await getChatMessageCharacter(chatLog, 'SourceCharacter', entry.MemberNumber);
      } else {
        metadata.TargetCharacter = await getChatMessageCharacter(chatLog, 'TargetCharacter', entry.MemberNumber);
      }
    } else if (hasAssetReference(entry)) {
      substitutions.push([entry.Tag, findAssetName(entry.AssetName, entry.GroupName).toLowerCase()]);
    } else if (hasFocusGroup(entry)) {
      metadata.FocusGroup = {
        Name: entry.FocusGroupName,
        Description: findAssetGroupDescription(entry.FocusGroupName)
      };
    } else if (hasAssetGroupName(entry)) {
      metadata.FocusGroup = {
        Name: entry.AssetGroupName,
        Description: findAssetGroupDescription(entry.AssetGroupName)
      };
    } else if (hasText(entry)) {
      substitutions.push([entry.Tag, String(entry.Text)]);
    } else if (hasTextLookup(entry)) {
      substitutions.push([entry.Tag, findDialog(entry.TextToLookUp).toLocaleLowerCase()]);
    }
  }

  if (metadata.SourceCharacter) {
    substitutions.push(['SourceCharacter', metadata.SourceCharacter.Name]);
    substitutions.push(...createPronounSubstitutions(metadata.SourceCharacter, 'Pronoun'));
  }

  if (metadata.TargetCharacter) {
    const name = metadata.TargetCharacter.Name;
    const destinationCharacterName = `${name}${findDialog('\'s')}`;

    substitutions.push(
      ['DestinationCharacter', destinationCharacterName],
      ['DestinationCharacterName', destinationCharacterName],
      ['TargetCharacter', name],
      ['TargetCharacterName', name],
    );
    substitutions.push(...createPronounSubstitutions(metadata.TargetCharacter, 'TargetPronoun'));
  }

  if (metadata.FocusGroup) {
    let description = metadata.FocusGroup.Description;
    if (metadata.TargetCharacter.HasPenis && ['ItemVulva', 'ItemVulvaPiercings'].includes(metadata.FocusGroup.Name)) {
      description = (metadata.FocusGroup.Name === 'ItemVulva'
        ? findDialog('ItemPenis')
        : findDialog('ItemGlans')
      ).toLocaleLowerCase();
    }
    substitutions.push(['FocusAssetGroup', description]);
  }

  substitutions = substitutions.sort((a, b) => b[0].length - a[0].length);
  for (const [tag, subst] of substitutions) {
    while (content !== subst && content.includes(tag)) {
      content = content.replace(tag, subst);
    }
  }

  return content;
}

async function getChatMessageCharacter(
    chatLog: IChatLog,
    key: keyof IChatMessageCharacters,
    memberNumber: number): Promise<IChatMessageCharacter> {
  if (chatLog.characters && chatLog.characters[key]) {
    return chatLog.characters[key];
  }

  const member = await retrieveAndCacheMember(chatLog.session.memberNumber, memberNumber);
  return {
    Name: memberName(member),
    MemberNumber: member.memberNumber,
    // Use fallbacks for older data
    Pronouns: member.pronouns || 'TheyThem',
    HasPenis: false,
    HasVagina: true
  };
}

function retrieveAndCacheMember(contextMemberNumber: number, memberNumber: number) {
  if (!MemberCache[memberNumber]) {
    MemberCache[memberNumber] = retrieveMember(contextMemberNumber, memberNumber);
  }

  return MemberCache[memberNumber];
}

export function hasSourceCharacter(value: ChatMessageDictionaryEntry): value is SourceCharacterDictionaryEntry {
  return isDictionary(value) && typeof (value as any).SourceCharacter !== 'undefined';
}

export function hasTargetCharacter(value: ChatMessageDictionaryEntry): value is TargetCharacterDictionaryEntry {
  return isDictionary(value) && typeof (value as any).TargetCharacter !== 'undefined';
}

export function hasCharacterReference(value: ChatMessageDictionaryEntry): value is CharacterReferenceDictionaryEntry {
  return isDictionary(value) &&
    ((value as any).Tag === 'SourceCharacter' ||
      (value as any).Tag === 'TargetCharacter' ||
      (value as any).Tag === 'TargetCharacterName' ||
      (value as any).Tag === 'DestinationCharacter' ||
      (value as any).Tag === 'DestinationCharacterName') &&
    typeof (value as any).MemberNumber !== 'undefined';
}

function hasAssetReference(value: ChatMessageDictionaryEntry): value is AssetReferenceDictionaryEntry {
  return isDictionary(value) &&
    typeof (value as any).Tag === 'string' &&
    typeof (value as any).GroupName === 'string' &&
    typeof (value as any).AssetName === 'string';
}

function hasFocusGroup(value: ChatMessageDictionaryEntry): value is FocusGroupDictionaryEntry {
  return isDictionary(value) &&
    typeof (value as any).FocusGroupName === 'string' &&
    (!(value as any).Tag || (value as any).Tag === 'FocusAssetGroup');
}

function hasAssetGroupName(value: ChatMessageDictionaryEntry): value is AssetGroupNameDictionaryEntry {
  return isDictionary(value) &&
    typeof (value as any).Tag === 'string' &&
    typeof (value as any).AssetGroupName === 'string';
}

function hasText(value: ChatMessageDictionaryEntry): value is TextDictionaryEntry {
  return isDictionary(value) &&
    (typeof (value as any).Text === 'string' || typeof (value as any).Text === 'number');
}

function hasTextLookup(value: ChatMessageDictionaryEntry): value is TextLookupDictionaryEntry {
  return isDictionary(value) &&
    typeof (value as any).Tag === 'string' &&
    typeof (value as any).TextToLookUp === 'string';
}

function isDictionary(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function createPronounSubstitutions(member: IChatMessageCharacter, dialogKey: string) {
  const substitutions = [];
  for (const pronounType of ['Possessive', 'Self', 'Subject', 'Object']) {
    substitutions.push([dialogKey + pronounType, memberPronoun(member, pronounType)]);
  }
  return substitutions;
}

function memberName(member: IMember) {
  return member.nickname || member.memberName;
}

function memberPronoun(member: IChatMessageCharacter, dialogKey: string) {
  const pronounName = member.Pronouns || 'TheyThem';
  return findDialog(`Pronoun${dialogKey}${pronounName}`);
}

export function findActivity(content: string): string {
  return ActivityNameCache[content] || content;
}

export function findAssetGroupDescription(group: string): string {
  const filtered = AssetNameCache.filter(asset => asset.GroupName === group && !asset.ItemName);
  if (filtered[0] && filtered[0].Description) {
    return filtered[0].Description.toLowerCase();
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
  return filtered[0] ? filtered[0].Description : item;
}

export function findDialog(content: string): string {
  const dialog = DialogCache.find(line => line.Stage === content);
  return (dialog && dialog.Result.trim()) || content;
}

async function loadAndCacheDictionaries() {
  if (!loading) {
    loading = Promise.all([
      loadDictionary('ActivityDictionary', data => {
        for (const activity of data) {
          ActivityNameCache[activity[0]] = activity[1];
        }
      }),
      loadDictionary('Female3DCG', data => {
        AssetNameCache.push(...data.map(mapAsset));
      }),
      loadDictionary('Dialog_Player', data => {
        DialogCache.push(...data.map(mapDialog));
      })
    ]);
  }

  return loading;
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
    Description: asset[2] && asset[2].trim(),
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

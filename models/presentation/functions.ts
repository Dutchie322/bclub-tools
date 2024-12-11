// Needed for ng build, else it will not recognise the game types.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../game/Typedef.d.ts" />

import { parse as parseCsv } from 'papaparse';
import { IChatLog, IMember, retrieveMember, IChatMessageCharacter, IChatMessageCharacters } from '../database';
import { IAsset } from '../internal';

interface ChatLogMetaData {
  SourceCharacter?: IChatMessageCharacter;
  TargetCharacter?: IChatMessageCharacter;
  FocusGroup?: { Name: string, Description: string };
}

type ChatLogSubstitution = [string, string];

let loadingChatLogDictionaries: Promise<void[]>;
let loadingMemberInfoDictionaries: Promise<void[]>;
const ActivityNameCache: Record<string, string>[] = [];
const AssetNameCache: IAsset[] = [];
const InformationSheetTextCache: Record<string, string>[] = [];
const InterfaceTextCache: Record<string, string>[] = [];
const MemberCache: Record<number, Promise<IMember>> = {};

export async function renderContent(chatLog: IChatLog): Promise<string> {
  await loadAndCacheDictionariesForChatLog();
  let content = chatLog.content;
  if (chatLog.type === 'Action' || chatLog.type === 'ServerMessage') {
    content = chatLog.type === 'ServerMessage' ? 'ServerMessage' + content : content;
    content = findInterfaceText(content);
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
      let tag = entry.Tag;
      if (tag.startsWith('MISSING PLAYER DIALOG: ')) {
        tag = tag.substring('MISSING PLAYER DIALOG: '.length);
      } else if (tag.startsWith('MISSING ACTIVITY DESCRIPTION FOR KEYWORD ')) {
        tag = tag.substring('MISSING ACTIVITY DESCRIPTION FOR KEYWORD '.length);
      }

      substitutions.push([tag, String(entry.Text)]);
    } else if (hasTextLookup(entry)) {
      substitutions.push([entry.Tag, findInterfaceText(entry.TextToLookUp).toLocaleLowerCase()]);
    }
  }

  if (metadata.SourceCharacter) {
    substitutions.push(['SourceCharacter', metadata.SourceCharacter.Name]);
    substitutions.push(...createPronounSubstitutions(metadata.SourceCharacter, 'Pronoun'));
  }

  if (metadata.TargetCharacter) {
    const name = metadata.TargetCharacter.Name;
    const destinationCharacterName = `${name}${findInterfaceText('\'s')}`;

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
        ? findInterfaceText('ItemPenis')
        : findInterfaceText('ItemGlans')
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
    Pronouns: member.pronouns || 'SheHer',
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
  return isDictionary(value) && typeof (value as Record<string, unknown>)['SourceCharacter'] !== 'undefined';
}

export function hasTargetCharacter(value: ChatMessageDictionaryEntry): value is TargetCharacterDictionaryEntry {
  return isDictionary(value) && typeof (value as Record<string, unknown>)['TargetCharacter'] !== 'undefined';
}

export function hasCharacterReference(value: ChatMessageDictionaryEntry): value is CharacterReferenceDictionaryEntry {
  return isDictionary(value) &&
    ((value as Record<string, unknown>)['Tag'] === 'SourceCharacter' ||
      (value as Record<string, unknown>)['Tag'] === 'TargetCharacter' ||
      (value as Record<string, unknown>)['Tag'] === 'TargetCharacterName' ||
      (value as Record<string, unknown>)['Tag'] === 'DestinationCharacter' ||
      (value as Record<string, unknown>)['Tag'] === 'DestinationCharacterName') &&
    typeof (value as Record<string, unknown>)['MemberNumber'] !== 'undefined';
}

function hasAssetReference(value: ChatMessageDictionaryEntry): value is AssetReferenceDictionaryEntry {
  return isDictionary(value) &&
    typeof (value as Record<string, unknown>)['Tag'] === 'string' &&
    typeof (value as Record<string, unknown>)['GroupName'] === 'string' &&
    typeof (value as Record<string, unknown>)['AssetName'] === 'string';
}

function hasFocusGroup(value: ChatMessageDictionaryEntry): value is FocusGroupDictionaryEntry {
  return isDictionary(value) &&
    typeof (value as Record<string, unknown>)['FocusGroupName'] === 'string' &&
    (!(value as Record<string, unknown>)['Tag'] || (value as Record<string, unknown>)['Tag'] === 'FocusAssetGroup');
}

function hasAssetGroupName(value: ChatMessageDictionaryEntry): value is AssetGroupNameDictionaryEntry {
  return isDictionary(value) &&
    typeof (value as Record<string, unknown>)['Tag'] === 'string' &&
    typeof (value as Record<string, unknown>)['AssetGroupName'] === 'string';
}

function hasText(value: ChatMessageDictionaryEntry): value is TextDictionaryEntry {
  return isDictionary(value) &&
    (typeof (value as Record<string, unknown>)['Text'] === 'string' || typeof (value as Record<string, unknown>)['Text'] === 'number');
}

function hasTextLookup(value: ChatMessageDictionaryEntry): value is TextLookupDictionaryEntry {
  return isDictionary(value) &&
    typeof (value as Record<string, unknown>)['Tag'] === 'string' &&
    typeof (value as Record<string, unknown>)['TextToLookUp'] === 'string';
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
  const pronounName = member.Pronouns || 'SheHer';
  return findInterfaceText(`Pronoun${dialogKey}${pronounName}`);
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

export function findInterfaceText(content: string): string {
  return InterfaceTextCache[content]?.trim() || content;
}

export async function findTitle(titleCode: string): Promise<string> {
  await loadAndCacheDictionariesForMemberInfo();

  return InformationSheetTextCache[`Title${titleCode}`];
}

function loadAndCacheDictionariesForChatLog() {
  if (!loadingChatLogDictionaries) {
    loadingChatLogDictionaries = Promise.all([
      loadDictionary('ActivityDictionary', data => {
        for (const activity of data) {
          ActivityNameCache[activity[0]] = activity[1];
        }
      }),
      loadDictionary('AssetStrings', data => {
        for (const assetString of data) {
          InterfaceTextCache[assetString[0]] = assetString[1];
        }
      }),
      loadDictionary('Female3DCG', data => {
        AssetNameCache.push(...data.map(mapAsset));
      }),
      loadDictionary('Interface', data => {
        for (const interfaceText of data) {
          InterfaceTextCache[interfaceText[0]] = interfaceText[1];
        }
      })
    ]);
  }

  return loadingChatLogDictionaries;
}

function loadAndCacheDictionariesForMemberInfo() {
  if (!loadingMemberInfoDictionaries) {
    loadingMemberInfoDictionaries = Promise.all([
      loadDictionary('Text_InformationSheet', data => {
        for (const text of data) {
          InformationSheetTextCache[text[0]] = text[1];
        }
      })
    ]);
  }

  return loadingMemberInfoDictionaries;
}

async function loadDictionary(fileName: string, processData: (data: unknown[]) => void) {
  const url = chrome.runtime.getURL(`log-viewer/assets/${fileName}.csv`);
  const response = await fetch(url);
  const value = await response.text();
  parseCsv(value, {
    complete: (results) => {
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

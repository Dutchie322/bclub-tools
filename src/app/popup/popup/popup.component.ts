import { Component, TrackByFunction, ViewChild } from '@angular/core';
import { MatSort, MatTableDataSource, MatSnackBar } from '@angular/material';
import {
  IStoredPlayer,
  retrieve,
  IChatRoomCharacter,
  onChanged,
  IOwnership,
  IReputation,
  IMember,
  retrieveGlobal,
  storeGlobal,
  IMigration,
} from 'models';
import { ChatLogsService } from 'src/app/shared/chat-logs.service';
import { IPlayerCharacter } from 'src/app/shared/models';
import { NewVersionNotificationComponent } from '../new-version-notification/new-version-notification.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent {
  @ViewChild('onlineFriendsSort', { static: true }) set onlineFriendsSort(sort: MatSort) {
    this.onlineFriends.sort = sort;
    this.onlineFriends.sortingDataAccessor = (data, sortHeaderId) => {
      if (sortHeaderId === 'memberName') {
        return data[sortHeaderId].toLocaleUpperCase();
      }
      return data[sortHeaderId];
    };
  }

  public characters = new MatTableDataSource<IChatRoomCharacter>();
  public onlineFriends = new MatTableDataSource<IMember>();
  public player: IStoredPlayer;
  public alternativeCharacters: IPlayerCharacter[];

  public characterColumns = ['name', 'pronouns', 'owner', 'reputation'];
  public chatRoomColumns = ['name', 'creator', 'members', 'description'];
  public onlineFriendColumns = ['memberName', 'chatRoomName', 'chatRoomSpace'];

  get loggedIn() {
    return this.player && this.player.MemberNumber > 0;
  }

  constructor(
    private chatLogsService: ChatLogsService,
    private snackBar: MatSnackBar
  ) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0].id;
      retrieve(tabId, 'player').then(player => this.player = player);
      retrieve(tabId, 'onlineFriends').then(friends => this.onlineFriends.data = friends || []);
      retrieve(tabId, 'chatRoomCharacter').then(characters => this.characters.data = characters);

      onChanged(tabId, (changes, areaName) => {
        if (areaName !== 'local') {
          return;
        }

        if (changes.chatRoomCharacter) {
          this.characters.data = changes.chatRoomCharacter.newValue;
        }

        if (changes.onlineFriends) {
          this.onlineFriends.data = changes.onlineFriends.newValue;
        }

        if (changes.player) {
          this.player = changes.player.newValue;
        }
      });

      chrome.tabs.sendMessage(tabId, {
        type: 'popup',
        event: 'UpdateFriends'
      });
    });

    this.chatLogsService.findPlayerCharacters().then(members => {
      this.alternativeCharacters = members.filter(m => {
        if (this.loggedIn) {
          return m.memberNumber !== this.player.MemberNumber;
        }
        return true;
      });
    });

    this.checkForNewVersion();
  }

  private async checkForNewVersion() {
    const migration = await retrieveGlobal('migration') || {} as IMigration;
    const currentVersion = chrome.runtime.getManifest().version;
    if (migration.readChangelogVersion === currentVersion) {
      return;
    }

    const snackBarRef = this.snackBar.openFromComponent(NewVersionNotificationComponent, {
      politeness: 'off'
    });
    snackBarRef.afterDismissed().pipe(
      take(1)
    ).subscribe(async () => {
      migration.readChangelogVersion = currentVersion;
      await storeGlobal('migration', migration);
    });
  }

  public openLogViewer(memberNumber?: number) {
    let url = '/index.html?page=/log-viewer';
    if (memberNumber) {
      url += '/' + memberNumber;
    } else if (this.loggedIn) {
      url += '/' + this.player.MemberNumber;
    }
    chrome.tabs.create({
      url
    });
  }

  public openOptions() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({
        url: '/index.html?page=/options'
      });
    }
  }

  public characterName(character: IChatRoomCharacter) {
    return character.Nickname ? character.Nickname : character.Name;
  }

  public characterPronouns(character: IChatRoomCharacter) {
    const value = character.Appearance.find(a => a.Group === 'Pronouns').Name;
    switch (value) {
      case 'SheHer':
        return 'She/Her';
      case 'HeHim':
        return 'He/Him';
      default:
        return value;
    }
  }

  public dominantReputationToText(reputation: IReputation[]) {
    let dominant = 0;
    const rep = (reputation || []).find(r => r.Type === 'Dominant');
    if (rep) {
      dominant = rep.Value;
    }

    if (dominant > 0) {
      return `Dominant ${dominant}%`;
    } else if (dominant < 0) {
      return `Submissive ${Math.abs(dominant)}%`;
    }
    return 'Neutral';
  }

  public ownerToText(ownership: IOwnership) {
    if (ownership && ownership.MemberNumber) {
      return `${ownership.Name} (${ownership.MemberNumber}) - ` +
        (ownership.Stage === 0 ? 'On trial for ' : 'Collared for ') +
        Math.floor((new Date().getTime() - ownership.Start) / 86400000).toString() +
        ' days';
    }
    return 'None';
  }

  public permissionToText(permission: number) {
    /*
    PermissionLevel0 Everyone, no exceptions
    PermissionLevel1 Everyone, except blacklist
    PermissionLevel2 Owner, Lover, whitelist & Dominants
    PermissionLevel3 Owner, Lover and whitelist only
    PermissionLevel4 Owner and Lover only
    PermissionLevel5 Owner only
    */
    switch (permission) {
      case 0:
        return 'Everyone, no exceptions';
      case 1:
        return 'Everyone, except blacklist';
      case 2:
        return 'Owner, Lover, whitelist & Dominants';
      case 3:
        return 'Owner, Lover and whitelist only';
      case 4:
        return 'Owner and Lover only';
      case 5:
        return 'Owner only';
      default:
        return permission;
    }
  }

  public formatChatRoomSpace(space: string) {
    switch (space) {
      case '':
        return 'Classic';
      case 'M':
        return 'Men\'s Lounge';
      case 'X':
        return 'Expanded';
      default:
        return space;
    }
  }

  public trackByCharacter: TrackByFunction<IChatRoomCharacter> = (_, character) => character.MemberNumber;
  public trackByFriend: TrackByFunction<IMember> = (_, friend) => friend.memberNumber;
}

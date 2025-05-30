import { AfterViewInit, Component, NgZone, TrackByFunction, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  IStoredPlayer,
  retrieve,
  IChatRoomCharacter,
  onChanged,
  IOwnership,
  IReputation,
  IMember,
  retrieveGlobal,
  storeGlobal
} from 'models';
import { ChatLogsService } from 'src/app/shared/chat-logs.service';
import { IPlayerCharacter } from 'src/app/shared/models';
import { NewVersionNotificationComponent } from '../new-version-notification/new-version-notification.component';
import { requestOnlineFriends } from 'projects/content-script/src/update-friends';

@Component({
    selector: 'app-popup',
    imports: [
        CommonModule,
        // Material design
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatListModule,
        MatSnackBarModule,
        MatSortModule,
        MatTabsModule,
        MatTableModule,
        MatToolbarModule,
    ],
    templateUrl: './popup.component.html',
    styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements AfterViewInit {
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
  public selectedTabIndex = 0;

  public characterColumns = ['name', 'pronouns', 'owner', 'reputation'];
  public chatRoomColumns = ['name', 'creator', 'members', 'description'];
  public onlineFriendColumns = ['memberName', 'chatRoomName', 'chatRoomSpace'];

  get loggedIn() {
    return this.player && this.player.MemberNumber > 0;
  }

  constructor(
    private chatLogsService: ChatLogsService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private viewContainerRef: ViewContainerRef
  ) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0].id;
      retrieve(tabId, 'player').then(player => this.player = player);
      retrieve(tabId, 'onlineFriends').then(friends => this.onlineFriends.data = friends || []);
      retrieve(tabId, 'chatRoomCharacter').then(characters => {
        this.characters.data = characters;
        if (this.characters.data.length == 0) {
          this.selectedTabIndex = 1;
        }
      });

      onChanged(tabId, (changes, areaName) => {
        if (areaName !== 'local') {
          return;
        }

        this.ngZone.run(() => {
          if (changes.chatRoomCharacter) {
            this.characters.data = changes.chatRoomCharacter.newValue;
            if (this.characters.data.length == 0) {
              this.selectedTabIndex = 1;
            }
          }

          if (changes.onlineFriends) {
            this.onlineFriends.data = changes.onlineFriends.newValue;
          }

          if (changes.player) {
            this.player = changes.player.newValue;
          }
        });
      });

      chrome.scripting.executeScript({
        func: requestOnlineFriends,
        target: {
          tabId: tabId
        },
        world: 'MAIN'
      }, results => {
        console.log(`Injection results for requestOnlineFriends():`, results);
      });
    });

    // Disabled for now because it strains large databases
    // this.chatLogsService.findPlayerCharacters().then(members => {
    //   this.alternativeCharacters = members.filter(m => {
    //     if (this.loggedIn) {
    //       return m.memberNumber !== this.player.MemberNumber;
    //     }
    //     return true;
    //   });
    // });
  }

  public ngAfterViewInit(): void {
    this.checkForNewVersion().then(console.log, console.error);
  }

  private async checkForNewVersion() {
    const migration = await retrieveGlobal('migration');
    const currentVersion = chrome.runtime.getManifest().version;
    if (migration.readChangelogVersion === currentVersion) {
      return;
    }

    const snackBarRef = this.snackBar.openFromComponent(NewVersionNotificationComponent, {
      viewContainerRef: this.viewContainerRef
    });
    snackBarRef.afterDismissed()
      .subscribe({
        next(dismissal) {
          if (dismissal.dismissedByAction) {
            migration.readChangelogVersion = currentVersion;
            storeGlobal('migration', migration);
          }
        }
      });
  }

  public createCharacterLink(character: IChatRoomCharacter) {
    return chrome.runtime.getURL(`/log-viewer/index.html#/${this.player.MemberNumber}/member/${character.MemberNumber}`);
  }

  public createFriendLink(friend: IMember) {
    return chrome.runtime.getURL(`/log-viewer/index.html#/${this.player.MemberNumber}/member/${friend.memberNumber}`);
  }

  public openLogViewer(memberNumber?: number) {
    let url = '/log-viewer/index.html';
    if (memberNumber) {
      url += '#/' + memberNumber;
    } else if (this.loggedIn) {
      url += '#/' + this.player.MemberNumber;
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
        url: '/options/index.html'
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

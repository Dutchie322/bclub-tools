import { Component, TrackByFunction } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IAccountQueryResultItem, IPlayer, IChatRoomSearchResult, retrieve, IChatRoomCharacter, onChanged, IOwnership, IReputation } from 'models';
import { ChatLogsService } from 'src/app/shared/chat-logs.service';
import { IMember } from 'src/app/shared/models';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent {
  public characters = new MatTableDataSource<IChatRoomCharacter>();
  public chatRooms = new MatTableDataSource<IChatRoomSearchResult>();
  public onlineFriends = new MatTableDataSource<IAccountQueryResultItem>();
  public player: IPlayer;
  public alternativeCharacters: IMember[];

  public characterColumns = ['name', 'owner', 'permission', 'reputation'];
  public chatRoomColumns = ['name', 'creator', 'members', 'description'];
  public onlineFriendColumns = ['name', 'chatRoom', 'type'];

  get loggedIn() {
    return this.player && this.player.MemberNumber > 0;
  }

  constructor(private chatLogsService: ChatLogsService) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0].id;
      retrieve(tabId, 'chatRoomCharacter').then(characters => this.characters.data = characters);
      retrieve(tabId, 'chatRoomSearchResult').then(chatRooms => this.chatRooms.data = chatRooms);
      retrieve(tabId, 'onlineFriends').then(friends => this.onlineFriends.data = friends);
      retrieve(tabId, 'player').then(player => this.player = player);

      onChanged(tabId, (changes, areaName) => {
        if (areaName !== 'local') {
          return;
        }

        if (changes.chatRoomCharacter) {
          this.characters.data = changes.chatRoomCharacter.newValue;
        }

        if (changes.chatRoomSearchResult) {
          this.chatRooms.data = changes.chatRoomSearchResult.newValue;
        }

        if (changes.onlineFriends) {
          this.onlineFriends.data = changes.onlineFriends.newValue;
        }

        if (changes.player) {
          this.player = changes.player.newValue;
        }
      });
    });

    this.chatLogsService.findMembers().then(members => {
      this.alternativeCharacters = members.filter(m => {
        if (this.loggedIn) {
          return m.memberNumber !== this.player.MemberNumber;
        }
        return true;
      });
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

  public friendTypeToText(friendType: string) {
    if (friendType === 'Submissive') {
      return 'Lover or sub';
    }

    return friendType;
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

  public ownerToText(owner: string, ownership: IOwnership) {
    if (ownership) {
      if (ownership.MemberNumber) {
        return `${ownership.Name} (${ownership.MemberNumber}) - ` +
          (ownership.Stage === 0 ? 'On trial for ' : 'Collared for ') +
          Math.floor((new Date().getTime() - ownership.Start) / 86400000).toString() +
          ' days';
      } else if (ownership.StartTrialOfferedByMemberNumber) {
        return `Offered a trial by ${ownership.StartTrialOfferedByMemberNumber}`;
      } else if (ownership.EndTrialOfferedByMemberNumber) {
        return `Offered a collar by ${ownership.EndTrialOfferedByMemberNumber}`;
      }
    } else if (owner) {
      return owner;
    }
    return 'None';
  }

  public permissionToText(permission: number) {
    /*
    PermissionLevel0	Everyone, no exceptions
    PermissionLevel1	Everyone, except blacklist
    PermissionLevel2	Owner, whitelist & Dominants
    PermissionLevel3	Owner and whitelist only
    PermissionLevel4	Owner only
    */
    switch (permission) {
      case 0:
        return 'Everyone, no exceptions';
      case 1:
        return 'Everyone, except blacklist';
      case 2:
        return 'Owner, whitelist & Dominants';
      case 3:
        return 'Owner and whitelist only';
      case 4:
        return 'Owner only';
      default:
        return permission;
    }
  }

  public trackByCharacter: TrackByFunction<IChatRoomCharacter> = (_, character) => character.MemberNumber;
  public trackByChatRoom: TrackByFunction<IChatRoomSearchResult> = (_, chatRoom) => chatRoom.Name;
  public trackByFriend: TrackByFunction<IAccountQueryResultItem> = (_, friend) => friend.MemberNumber;
}

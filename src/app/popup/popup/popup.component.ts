import { Component, TrackByFunction, ViewChild } from '@angular/core';
import { MatSort, MatTableDataSource } from '@angular/material';
import {
  IStoredPlayer,
  IChatRoomSearchResult,
  retrieve,
  IChatRoomCharacter,
  onChanged,
  IOwnership,
  IReputation,
  IMember,
  MemberTypeOrder,
} from 'models';
import { ChatLogsService } from 'src/app/shared/chat-logs.service';
import { IPlayerCharacter } from 'src/app/shared/models';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent {
  @ViewChild('onlineFriendsSort', { static: true }) set onlineFriendsSort(sort: MatSort) {
    this.onlineFriends.sort = sort;
    this.onlineFriends.sortingDataAccessor = (data, sortHeaderId) => {
      if (sortHeaderId === 'type') {
        return MemberTypeOrder[data[sortHeaderId]];
      }
      if (sortHeaderId === 'memberName') {
        return data[sortHeaderId].toLocaleUpperCase();
      }
      return data[sortHeaderId];
    };
  }

  public characters = new MatTableDataSource<IChatRoomCharacter>();
  public chatRooms = new MatTableDataSource<IChatRoomSearchResult>();
  public onlineFriends = new MatTableDataSource<IMember>();
  public player: IStoredPlayer;
  public alternativeCharacters: IPlayerCharacter[];

  public characterColumns = ['name', 'owner', 'permission', 'reputation'];
  public chatRoomColumns = ['name', 'creator', 'members', 'description'];
  public onlineFriendColumns = ['memberName', 'chatRoomName', 'type'];

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

    this.chatLogsService.findPlayerCharacters().then(members => {
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

  public trackByCharacter: TrackByFunction<IChatRoomCharacter> = (_, character) => character.MemberNumber;
  public trackByChatRoom: TrackByFunction<IChatRoomSearchResult> = (_, chatRoom) => chatRoom.Name;
  public trackByFriend: TrackByFunction<IMember> = (_, friend) => friend.memberNumber;
}

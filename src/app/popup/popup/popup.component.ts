import { Component, TrackByFunction } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IAccountQueryResultItem, IPlayer, IChatRoomSearchResult, retrieve, ICharacter, StorageKeys, onChanged, IOwnership } from 'models';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent {
  public characters = new MatTableDataSource<ICharacter>();
  public chatRooms = new MatTableDataSource<IChatRoomSearchResult>();
  public onlineFriends = new MatTableDataSource<IAccountQueryResultItem>();
  public player: IPlayer;

  public characterColumns = ['name', 'owner', 'permission', 'reputation'];
  public chatRoomColumns = ['name', 'creator', 'members', 'description'];
  public onlineFriendColumns = ['type', 'name', 'chatRoom'];

  get loggedIn() {
    return this.player && this.player.MemberNumber > 0;
  }

  constructor() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0].id;
      retrieve(tabId, 'chatRoomCharacter').then(characters => this.characters.data = characters);
      retrieve(tabId, 'chatRoomSearchResult').then(chatRooms => this.chatRooms.data = chatRooms);
      retrieve(tabId, 'onlineFriends').then(friends => this.onlineFriends.data = friends);
      retrieve(tabId, 'player').then(player => this.player = player);

      onChanged(tabId, (changes, areaName) => {
        console.log(changes);

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

  }

  public openLogViewer() {
    chrome.tabs.create({
      url: '/index.html?page=/log-viewer'
    });
  }

  public dominantReputationToText(character: ICharacter) {
    let dominant = 0;
    const rep = character.Reputation.find(r => r.Type === 'Dominant');
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
      return `${ownership.Name} (${ownership.MemberNumber}) - ` +
        (ownership.Stage === 0 ? 'On trial for ' : 'Collared for ') +
        Math.floor((new Date().getTime() - ownership.Start) / 86400000).toString() +
        ' days';
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

  public trackByCharacter: TrackByFunction<ICharacter> = (_, character) => character.MemberNumber;
  public trackByChatRoom: TrackByFunction<IChatRoomSearchResult> = (_, chatRoom) => chatRoom.Name;
  public trackByFriend: TrackByFunction<IAccountQueryResultItem> = (_, friend) => friend.MemberNumber;
}

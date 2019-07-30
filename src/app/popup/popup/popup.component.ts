import { Component } from '@angular/core';
import { ICharacter, IAccountQueryResultItem, IPlayer } from 'models';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent {
  public character: ICharacter[] = [];
  public onlineFriends: IAccountQueryResultItem[] = [];
  public player: IPlayer = undefined;

  get loggedIn() {
    return this.player && this.player.MemberNumber > 0;
  }

  constructor() {
    // this.getVariables(['Character', 'Player']).then(variables => {
    //   this.character = variables.Character as ICharacter[];
    //   this.player = variables.Player as IPlayer;
    // })
    // .catch(error => {
    //   console.error(error);
    // });
    this.retrieveForCurrentTab<IPlayer>('player').then(player => {
      this.player = player;
    });
    this.retrieveForCurrentTab<IAccountQueryResultItem[]>('online_friends').then(friends => {
      this.onlineFriends = friends;
    });
  }

  private retrieveForCurrentTab<T>(key: string): Promise<T> {
    return new Promise(resolve => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const activeTabId = tabs[0].id;
        const storageKey = `${key}_${activeTabId}`;
        chrome.storage.local.get([storageKey], data => resolve(data[storageKey]));
      });
    });
  }

  private getVariables<T extends string, U = { [K in T]?: unknown }>(names: T[]): Promise<U> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          command: 'get-var',
          variables: names
        }, (response) => {
          if (response) {
            console.log('got response');
            console.log(response);
            resolve(response.variables);
          } else {
            reject(chrome.runtime.lastError);
          }
        });
      });
    });
  }
}

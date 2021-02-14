export interface ISettings {
  notifications: INotificationSettings;
  tools: IToolsSettings;
}

export interface INotificationSettings {
  beeps: boolean;
  friendOnline: boolean;
  friendOffline: boolean;
  actions: boolean;
  mentions: boolean;
  whispers: boolean;
  keywords: string[];
}

export interface IToolsSettings {
  chatRoomRefresh: boolean;
  fpsCounter: boolean;
}

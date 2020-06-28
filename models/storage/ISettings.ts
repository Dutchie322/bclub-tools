export interface ISettings {
  notifications: INotificationSettings;
  tools: IToolsSettings;
}

export interface INotificationSettings {
  beeps: boolean;
  friendOnline: boolean;
  friendOffline: boolean;
}

export interface IToolsSettings {
  fpsCounter: boolean;
}

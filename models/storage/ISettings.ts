export interface ISettings {
  notifications: INotificationSettings;
}

export interface INotificationSettings {
  beeps: boolean;
  friendOnline: boolean;
  friendOffline: boolean;
}

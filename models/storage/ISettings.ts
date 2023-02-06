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
  /**
   * @deprecated No longer used, replaced by chatRoomRefreshInterval
   */
  chatRoomRefresh: boolean;
  chatRoomRefreshInterval: number;
  /**
   * @deprecated Functionality removed
   */
  fpsCounter: boolean;
  /**
   * @deprecated Functionality removed
   */
  wardrobeSize: number;
}

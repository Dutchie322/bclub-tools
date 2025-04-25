export interface ISettings {
  notifications: INotificationSettings;
  tools: IToolsSettings;
}

export interface INotificationSettings {
  /**
   * @deprecated Provided by the game itself nowadays
   */
  beeps?: boolean;
  /**
   * @deprecated Requires spamming the browser console with an error constantly
   */
  friendOnline?: boolean;
  /**
   * @deprecated Requires spamming the browser console with an error constantly
   */
  friendOffline?: boolean;
  /**
   * @deprecated Provided by the game itself nowadays
   */
  actions?: boolean;
  /**
   * @deprecated Provided by the game itself nowadays
   */
  mentions?: boolean;
  /**
   * @deprecated Provided by the game itself nowadays
   */
  whispers?: boolean;
  keywords: string[];
}

export interface IToolsSettings {
  /**
   * @deprecated No longer used, replaced by chatRoomRefreshInterval
   */
  chatRoomRefresh?: boolean;
  chatRoomRefreshInterval: number;
  /**
   * @deprecated Functionality removed
   */
  fpsCounter?: boolean;
  /**
   * @deprecated Functionality removed
   */
  wardrobeSize?: number;
}

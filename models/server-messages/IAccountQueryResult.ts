export type IAccountQueryResult = IAccountQueryOnlineFriendsResult | IAccountQueryEmailResult;

export interface IAccountQueryOnlineFriendsResult {
  Query: 'OnlineFriends';
  Result: IAccountQueryResultOnlineFriend[];
}

export interface IAccountQueryEmailResult {
  Query: 'EmailStatus' | 'EmailUpdate';
  Result: boolean;
}

export interface IAccountQueryResultOnlineFriend {
  ChatRoomName: string;
  ChatRoomSpace: string;
  MemberName: string;
  MemberNumber: number;
  Type: 'Friend' | 'Submissive';
}

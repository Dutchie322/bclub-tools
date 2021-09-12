import { ChatRoomSpace } from 'models';

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
  ChatRoomName: string | null;
  ChatRoomSpace: ChatRoomSpace | null;
  MemberName: string;
  MemberNumber: number;
  Private?: boolean;
  Type: 'Friend' | 'Submissive' | 'Lover';
}

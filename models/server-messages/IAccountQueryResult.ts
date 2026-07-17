import { ChatRoomSpace } from 'models';

export interface IAccountQueryOnlineFriendsResult {
  Query: 'OnlineFriends';
  Result: IAccountQueryResultOnlineFriend[];
}

export interface IAccountQueryEmailResult {
  Query: 'EmailStatus' | 'EmailUpdate';
  Result: boolean;
}

export interface IAccountQueryResultOnlineFriend {
  ChatRoomName?: string;
  ChatRoomSpace?: ChatRoomSpace;
  ChatRoomMemberCount?: number;
  ChatRoomLimit?: number;
  MemberName: string;
  MemberNumber: number;
  Private?: boolean;
  Type: 'Friend' | 'Submissive' | 'Lover';
}

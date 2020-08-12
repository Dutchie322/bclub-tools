export interface IAccountQueryResult {
  Query: 'OnlineFriends';
  Result: IAccountQueryResultItem[];
}

export interface IAccountQueryResultItem {
  ChatRoomName: string;
  ChatRoomSpace: string;
  MemberName: string;
  MemberNumber: number;
  Type: 'Friend' | 'Submissive';
}

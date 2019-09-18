export interface IChatRoomSearchResult {
  Name: string;
  Creator: string;
  MemberCount: number;
  MemberLimit: number;
  Description: string;
  Friends: IChatRoomSearchResultFriend[];
}

export interface IChatRoomSearchResultFriend {
  MemberName: string;
  MemberNumber: number;
  Type: 'Friend' | 'Submissive';
}

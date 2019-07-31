import { ChatRoomMessageType } from 'models';

export interface IChatLog {
  chatRoom: string;
  content: string;
  sender: {
    id: number;
    name: string;
  };
  session: {
    id: string;
    name: string;
    memberNumber: number;
  };
  timestamp: Date;
  type: ChatRoomMessageType;
}

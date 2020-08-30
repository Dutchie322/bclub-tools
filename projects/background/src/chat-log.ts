import {
  IEnrichedChatRoomMessage,
  IChatLog,
  IEnrichedChatRoomChat,
  addOrUpdateObjectStore
} from '../../../models';

export async function writeChatLog(data: IEnrichedChatRoomMessage | IEnrichedChatRoomChat) {
  function isClientWhisper(message: IEnrichedChatRoomMessage | IEnrichedChatRoomChat): message is IEnrichedChatRoomChat {
    return (message as IEnrichedChatRoomChat).Target !== undefined;
  }

  const senderChar = data.ChatRoom.Character.find(c => c.MemberNumber === data.Sender);
  const chatLog = {
    chatRoom: data.ChatRoom.Name,
    content: data.Content,
    dictionary: data.Dictionary,
    sender: {
      id: data.Sender,
      name: senderChar.Name,
      color: senderChar.LabelColor,
    },
    session: {
      id: data.SessionId,
      name: data.PlayerName,
      memberNumber: data.MemberNumber
    },
    timestamp: new Date(data.Timestamp),
    type: data.Type
  } as IChatLog;

  if (isClientWhisper(data)) {
    chatLog.target = {
      name: data.TargetName,
      memberNumber: data.Target
    };
  }

  await addOrUpdateObjectStore('chatRoomLogs', chatLog);
}

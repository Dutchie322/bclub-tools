import {
  IEnrichedChatRoomMessage,
  IChatLog,
  IEnrichedChatRoomChat,
  putValue,
  hasSourceCharacter,
  hasTargetCharacter,
  hasCharacterReference,
  IChatMessageCharacter,
  IChatRoomCharacter
} from '../../../models';

export async function writeChatLog(data: IEnrichedChatRoomMessage | IEnrichedChatRoomChat) {
  function isClientWhisper(message: IEnrichedChatRoomMessage | IEnrichedChatRoomChat): message is IEnrichedChatRoomChat {
    return (message as IEnrichedChatRoomChat).Target !== undefined;
  }

  const senderChar = data.ChatRoom.Character.find(c => c.MemberNumber === data.Sender);
  const chatLog: IChatLog = {
    chatRoom: data.ChatRoom.Name,
    content: data.Content,
    dictionary: data.Dictionary,
    sender: {
      id: data.Sender,
      name: senderChar.Name,
      nickname: senderChar.Nickname,
      color: senderChar.LabelColor,
    },
    session: {
      id: data.SessionId,
      name: data.PlayerName,
      nickname: data.PlayerNickname,
      memberNumber: data.MemberNumber
    },
    timestamp: new Date(data.Timestamp),
    type: data.Type
  };

  if (isClientWhisper(data)) {
    chatLog.target = {
      name: data.TargetName,
      memberNumber: data.Target
    };
  }

  if (chatLog.dictionary) {
    for (const entry of chatLog.dictionary) {
      if (hasSourceCharacter(entry)) {
        const char = data.ChatRoom.Character.find(c => c.MemberNumber === entry.SourceCharacter);
        if (!chatLog.characters) {
          chatLog.characters = {};
        }
        chatLog.characters.SourceCharacter = createChatLogCharacter(char);
      } else if (hasTargetCharacter(entry)) {
        const char = data.ChatRoom.Character.find(c => c.MemberNumber === entry.TargetCharacter);
        if (!chatLog.characters) {
          chatLog.characters = {};
        }
        chatLog.characters.TargetCharacter = createChatLogCharacter(char);
      } else if (hasCharacterReference(entry)) {
        const char = data.ChatRoom.Character.find(c => c.MemberNumber === entry.MemberNumber);
        if (!chatLog.characters) {
          chatLog.characters = {};
        }
        if (entry.Tag === 'SourceCharacter') {
          chatLog.characters.SourceCharacter = createChatLogCharacter(char);
        } else {
          chatLog.characters.TargetCharacter = createChatLogCharacter(char);
        }
      }
    }
  }

  return await putValue('chatRoomLogs', chatLog);
}

function createChatLogCharacter(char: IChatRoomCharacter): IChatMessageCharacter {
  const crotchArea = getItem(char, 'Pussy');
  return {
    Name: char.Name,
    Nickname: char.Nickname,
    MemberNumber: char.MemberNumber,
    Pronouns: char.Appearance.find(a => a.Group === 'Pronouns').Name,
    HasPenis: crotchArea.Name === 'Penis',
    HasVagina: crotchArea.Name.startsWith('Pussy')
  };
}

function getItem(char: IChatRoomCharacter, assetGroup: string) {
  return char.Appearance.find(a => a.Group === assetGroup);
}

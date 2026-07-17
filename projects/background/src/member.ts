import {
  IAccountQueryResultOnlineFriend,
  IChatRoomCharacter,
  IMember,
  putValue,
  decompress,
  retrieveMember,
} from '../../../models';

interface PlayerContext {
  MemberNumber: number;
  Name: string;
}

export enum DataSource {
  Unknown,
  OnlineFriends,
  ChatRoom
}

export async function writeMember(context: PlayerContext, data: IAccountQueryResultOnlineFriend | IChatRoomCharacter, source: DataSource) {
  let member = await retrieveMember(context.MemberNumber, data.MemberNumber);

  member = Object.assign({}, member, {
    playerMemberNumber: context.MemberNumber,
    playerMemberName: context.Name,
    memberNumber: data.MemberNumber
  });

  delete member.type;

  if (source == DataSource.OnlineFriends) {
    member = Object.assign(member, mapAccountQueryResultOnlineFriend(data as IAccountQueryResultOnlineFriend));
  }
  if (source == DataSource.ChatRoom) {
    member = Object.assign(member, mapChatRoomCharacter(data as IChatRoomCharacter));
    member.lastSeen = new Date();
  }

  return await putValue('members', member);
}

function mapAccountQueryResultOnlineFriend(data: IAccountQueryResultOnlineFriend) {
  return {
    memberName: data.MemberName,
    chatRoomName: data.ChatRoomName,
    chatRoomSpace: data.ChatRoomSpace,
    chatRoomMemberCount: data.ChatRoomMemberCount,
    chatRoomLimit: data.ChatRoomLimit,
    isPrivateRoom: data.Private
  };
}

function mapChatRoomCharacter(data: IChatRoomCharacter) {
  const normalizedNickname = data.Nickname?.normalize('NFKC');

  return {
    memberName: data.Name,
    nickname: data.Nickname,
    normalizedNickname: normalizedNickname == data.Nickname ? undefined : normalizedNickname,
    creation: new Date(data.Creation),
    title: data.Title,
    dominant: data.Reputation && data.Reputation.find(r => r.Type === 'Dominant')
      ? data.Reputation.find(r => r.Type === 'Dominant')!.Value
      : 0,
    description: decompress(data.Description),
    difficulty: data.Difficulty as unknown as number, // FIXME more incorrect typings
    labelColor: data.LabelColor,
    lovership: data.Lovership ? data.Lovership.map(lover => ({
      memberNumber: lover.MemberNumber,
      name: lover.Name,
      start: lover.Start ? new Date(lover.Start) : undefined,
      stage: lover.Stage
    })) : undefined,
    ownership: data.Ownership ? {
      memberNumber: data.Ownership.MemberNumber,
      name: data.Ownership.Name,
      start: data.Ownership.Start ? new Date(data.Ownership.Start) : undefined,
      stage: data.Ownership.Stage
    } : undefined,
    pronouns: data.Appearance ? data.Appearance.find(a => a.Group === 'Pronouns')?.Name : undefined
  } as Partial<IMember>;
}

export async function removeChatRoomData(member: IMember) {
  const storedMember = await retrieveMember(member.playerMemberNumber, member.memberNumber);
  delete storedMember.chatRoomName;
  delete storedMember.chatRoomSpace;
  delete storedMember.isPrivateRoom;
  await putValue('members', storedMember);
}

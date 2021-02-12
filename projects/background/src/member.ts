import {
  IAccountQueryResultOnlineFriend,
  IChatRoomCharacter,
  IMember,
  addOrUpdateObjectStore,
  openDatabase,
  MemberType,
  MemberTypeOrder,
  IPlayerWithRelations,
  decompress,
} from '../../../models';

interface PlayerContext {
  MemberNumber: number;
  Name: string;
}

export async function writeMember(context: PlayerContext, data: IAccountQueryResultOnlineFriend | IChatRoomCharacter) {
  function isAccountQueryResultOnlineFriend(input: any): input is IAccountQueryResultOnlineFriend {
    return (input as IAccountQueryResultOnlineFriend).ChatRoomName !== undefined;
  }
  function isChatRoomCharacter(input: any): input is IChatRoomCharacter {
    return (input as IChatRoomCharacter).ID !== undefined;
  }

  let member = await retrieveMember(context.MemberNumber, data.MemberNumber);

  member = Object.assign({}, member, {
    playerMemberNumber: context.MemberNumber,
    playerMemberName: context.Name,
    memberNumber: data.MemberNumber,
    type: determineMemberType(member && member.type, 'Member'),
    lastSeen: new Date()
  });

  if (isAccountQueryResultOnlineFriend(data)) {
    member = Object.assign(member, mapAccountQueryResultOnlineFriend(data), {
      type: determineMemberType(member.type, data.Type, ['Friend', 'Submissive'])
    });
  }
  if (isChatRoomCharacter(data)) {
    member = Object.assign(member, mapChatRoomCharacter(data));
  }

  return await addOrUpdateObjectStore('members', member);
}

function mapAccountQueryResultOnlineFriend(data: IAccountQueryResultOnlineFriend) {
  return {
    memberName: data.MemberName,
    chatRoomName: data.ChatRoomName,
    chatRoomSpace: data.ChatRoomSpace
  };
}

function mapChatRoomCharacter(data: IChatRoomCharacter) {
  return {
    memberName: data.Name,
    creation: new Date(data.Creation),
    title: data.Title,
    dominant: data.Reputation && data.Reputation.find(r => r.Type === 'Dominant')
      ? data.Reputation.find(r => r.Type === 'Dominant').Value
      : 0,
    description: decompress(data.Description),
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
    } : undefined
  };
}

export async function writeFriends(player: IPlayerWithRelations) {
  // TODO update type after removing friend/lover/owner
  if (player.FriendList) {
    await Promise.all(player.FriendList.map(async friend => {
      let member = await retrieveMember(player.MemberNumber, friend);
      member = Object.assign({}, member, {
        playerMemberNumber: player.MemberNumber,
        playerMemberName: player.Name,
        memberNumber: friend,
        type: determineMemberType(member && member.type, 'Friend')
      });
      await addOrUpdateObjectStore('members', member);
    }));
  }
  if (player.Lovership) {
    await Promise.all(player.Lovership.filter(lover => lover.MemberNumber).map(async lover => {
      let member = await retrieveMember(player.MemberNumber, lover.MemberNumber);
      member = Object.assign({}, member, {
        playerMemberNumber: player.MemberNumber,
        playerMemberName: player.Name,
        memberNumber: lover.MemberNumber,
        memberName: lover.Name,
        type: determineMemberType(member && member.type, 'Lover')
      });
      await addOrUpdateObjectStore('members', member);
    }));
  }
  if (player.Ownership && player.Ownership.MemberNumber) {
    let member = await retrieveMember(player.MemberNumber, player.Ownership.MemberNumber);
    member = Object.assign({}, member, {
      playerMemberNumber: player.MemberNumber,
      playerMemberName: player.Name,
      memberNumber: player.Ownership.MemberNumber,
      memberName: player.Ownership.Name,
      type: determineMemberType(member && member.type, 'Owner')
    });
    await addOrUpdateObjectStore('members', member);
  }
}

export async function removeChatRoomData(member: IMember) {
  const storedMember = await retrieveMember(member.playerMemberNumber, member.memberNumber);
  delete storedMember.chatRoomName;
  delete storedMember.chatRoomSpace;
  await addOrUpdateObjectStore('members', storedMember);
}

export async function retrieveMember(playerMemberNumber: number, memberNumber: number) {
  const db = await openDatabase();
  const transaction = db.transaction('members', 'readonly');
  return await new Promise<IMember>((resolve, reject) => {
    const request = transaction.objectStore('members').get([playerMemberNumber, memberNumber]);
    request.addEventListener('error', () => {
      console.error(`Error while reading store members`);
      console.error(request.error);
      reject(request.error);
    });
    request.addEventListener('success', event => {
      resolve((event.target as IDBRequest<IMember>).result);
    });
  });
}

export function determineMemberType(currentType: MemberType | '', newType: MemberType, allowChangeTo?: MemberType[]): MemberType {
  if (!currentType) {
    return newType;
  }
  if (MemberTypeOrder[newType] > MemberTypeOrder[currentType]) {
    return newType;
  }
  if (allowChangeTo && allowChangeTo.includes(currentType) && allowChangeTo.includes(newType)) {
    return newType;
  }
  return currentType;
}

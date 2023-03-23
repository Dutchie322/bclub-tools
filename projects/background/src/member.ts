import {
  IAccountQueryResultOnlineFriend,
  IChatRoomCharacter,
  IMember,
  addOrUpdateObjectStore,
  openDatabase,
  IPlayerWithRelations,
  decompress,
} from '../../../models';

interface PlayerContext {
  MemberNumber: number;
  Name: string;
}

export async function writeMember(context: PlayerContext, data: IAccountQueryResultOnlineFriend | IChatRoomCharacter) {
  function isChatRoomCharacter(input: any): input is IChatRoomCharacter {
    return (input as IChatRoomCharacter).ID !== undefined;
  }

  let member = await retrieveMember(context.MemberNumber, data.MemberNumber);

  member = Object.assign({}, member, {
    playerMemberNumber: context.MemberNumber,
    playerMemberName: context.Name,
    memberNumber: data.MemberNumber,
    lastSeen: new Date()
  });

  delete member.type;

  if (isChatRoomCharacter(data)) {
    member = Object.assign(member, mapChatRoomCharacter(data));
  }

  return await addOrUpdateObjectStore('members', member);
}

function mapChatRoomCharacter(data: IChatRoomCharacter) {
  return {
    memberName: data.Name,
    nickname: data.Nickname,
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
    } : undefined,
    pronouns: data.Appearance ? data.Appearance.find(a => a.Group === 'Pronouns').Name : undefined
  };
}

export async function writeFriends(player: IPlayerWithRelations) {
  if (player.FriendList) {
    await Promise.all(player.FriendList.map(async friend => {
      let member = await retrieveMember(player.MemberNumber, friend);
      member = Object.assign({}, member, {
        playerMemberNumber: player.MemberNumber,
        playerMemberName: player.Name,
        memberNumber: friend
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
        memberName: lover.Name
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
      memberName: player.Ownership.Name
    });
    await addOrUpdateObjectStore('members', member);
  }
}

export async function removeChatRoomData(member: IMember) {
  const storedMember = await retrieveMember(member.playerMemberNumber, member.memberNumber);
  delete storedMember.chatRoomName;
  delete storedMember.chatRoomSpace;
  delete storedMember.isPrivateRoom;
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

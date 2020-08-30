import {
  IAccountQueryResultItem,
  IChatRoomCharacter,
  IMember,
  addOrUpdateObjectStore,
  openDatabase,
  MemberType,
  IPlayer,
} from '../../../models';

interface PlayerContext {
  MemberNumber: number;
  Name: string;
}

export async function writeMember(context: PlayerContext, data: IAccountQueryResultItem | IChatRoomCharacter) {
  function isAccountQueryResultItem(input: any): input is IAccountQueryResultItem {
    return (input as IAccountQueryResultItem).ChatRoomName !== undefined;
  }
  function isChatRoomCharacter(input: any): input is IChatRoomCharacter {
    return (input as IChatRoomCharacter).ID !== undefined;
  }

  if (context.MemberNumber === data.MemberNumber) {
    // No need to store ourselves
    return;
  }

  let member = await retrieveMember(context.MemberNumber, data.MemberNumber);

  member = Object.assign({}, member, {
    playerMemberNumber: context.MemberNumber,
    playerMemberName: context.Name,
    memberNumber: data.MemberNumber,
    lastSeen: new Date()
  });

  if (isAccountQueryResultItem(data)) {
    member = Object.assign(member, {
      memberName: data.MemberName,
      type: determineMemberType(member.type, data.Type)
    });
  }
  if (isChatRoomCharacter(data)) {
    member = Object.assign(member, {
      memberName: data.Name,
      type: determineMemberType(member.type, 'Member'),
      creation: data.Creation,
      title: data.Title,
      description: data.Description,
      labelColor: data.LabelColor,
      lovership: data.Lovership ? data.Lovership.map(lover => ({
        memberNumber: lover.MemberNumber,
        name: lover.Name,
        start: lover.Start,
        stage: lover.Stage
      })) : undefined,
      ownership: data.Ownership ? {
        memberNumber: data.Ownership.MemberNumber,
        name: data.Ownership.Name,
        start: data.Ownership.Start,
        stage: data.Ownership.Stage
      } : undefined
    });
  }

  await addOrUpdateObjectStore('members', member);
}

export async function writeFriends(player: IPlayer) {
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
    await Promise.all(player.Lovership.map(async lover => {
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
  if (player.Ownership) {
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

async function retrieveMember(playerMemberNumber: number, memberNumber: number) {
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

function determineMemberType(currentType: MemberType | '', newType: MemberType): MemberType {
  const order = {
    Member: 0,
    Friend: 1,
    Submissive: 2,
    Lover: 3,
    Owner: 4
  } as { [key in MemberType]: number; };

  if (!currentType || order[newType] > order[currentType]) {
    return newType;
  }
  return currentType;
}

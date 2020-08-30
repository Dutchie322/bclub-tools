import {
  IAccountQueryResultItem,
  IChatRoomCharacter,
  IMember,
  addOrUpdateObjectStore,
  openDatabase,
  MemberType,
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

  const db = await openDatabase();
  const transaction = db.transaction('members', 'readonly');
  let member = await new Promise<IMember>((resolve, reject) => {
    const request = transaction.objectStore('members').get([context.MemberNumber, data.MemberNumber]);
    request.addEventListener('error', () => {
      console.error(`Error while reading store members`);
      console.error(request.error);
      reject(request.error);
    });
    request.addEventListener('success', event => {
      resolve((event.target as IDBRequest<IMember>).result);
    });
  });

  console.log('retrieved:');
  console.log(member);

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
      lovership: data.Lovership.map(lover => ({
        memberNumber: lover.MemberNumber,
        name: lover.Name,
        start: lover.Start,
        stage: lover.Stage
      })),
      ownership: data.Ownership ? {
        memberNumber: data.Ownership.MemberNumber,
        name: data.Ownership.Name,
        start: data.Ownership.Start,
        stage: data.Ownership.Stage
      } : undefined
    });
  }

  console.log('storing:');
  console.log(member);

  await addOrUpdateObjectStore('members', member);
}

function determineMemberType(currentType: MemberType, newType: MemberType): MemberType {
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

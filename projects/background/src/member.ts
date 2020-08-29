import {
  IAccountQueryResultItem,
  IChatRoomCharacter,
  IMember,
  addToObjectStore,
} from '../../../models';

export async function writeMember(data: IAccountQueryResultItem | IChatRoomCharacter) {
  function isAccountQueryResultItem(input: any): input is IAccountQueryResultItem {
    return (input as IAccountQueryResultItem).ChatRoomName !== undefined;
  }
  function isChatRoomCharacter(input: any): input is IChatRoomCharacter {
    return (input as IChatRoomCharacter).ID !== undefined;
  }

  // TODO get existing member data

  let member: IMember;

  const commonData = {
    memberNumber: data.MemberNumber,
    lastSeen: Date.now()
  };

  if (isAccountQueryResultItem(data)) {
    member = Object.assign({}, commonData, {
      memberName: data.MemberName,
      type: data.Type
    });
  }
  if (isChatRoomCharacter(data)) {
    member = Object.assign({}, commonData, {
      memberName: data.Name,
      type: 'Member' as const // TODO use existing type and determine order
    });
  }

  await addToObjectStore('members', member);
}

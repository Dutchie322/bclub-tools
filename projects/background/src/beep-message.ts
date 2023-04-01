import { addOrUpdateObjectStore, IAccountBeep, IBeepMessage, IClientAccountBeep } from '../../../models';

export async function writeBeepMessage(contextMemberNumber: number, data: IAccountBeep | IClientAccountBeep, direction: 'Incoming' | 'Outgoing') {
  var beepMessage = {
    contextMemberNumber,
    memberNumber: data.MemberNumber,
    memberName: data.MemberName,
    message: data.Message,
    direction,
    timestamp: new Date(),
  } as IBeepMessage;

  return await addOrUpdateObjectStore('beepMessages', beepMessage);
}

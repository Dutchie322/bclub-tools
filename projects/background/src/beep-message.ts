import { putValue, IAccountBeep, IBeepMessage, IClientAccountBeep } from '../../../models';

export async function writeBeepMessage(contextMemberNumber: number, data: IAccountBeep | IClientAccountBeep, direction: 'Incoming' | 'Outgoing') {
  const beepMessage: Omit<IBeepMessage, 'id'> = {
    contextMemberNumber,
    memberNumber: data.MemberNumber,
    memberName: data.MemberName,
    message: data.Message,
    direction,
    timestamp: new Date(),
  };

  return await putValue('beepMessages', beepMessage);
}

import { IClientMessage } from 'models';

const charactersToUpdate = {};

export function sendCharacterAppearance(character: any, handshake: string) {
  try {
    if (character && character.MemberNumber) {
      if (charactersToUpdate[character.MemberNumber]) {
        return;
      }

      charactersToUpdate[character.MemberNumber] = setTimeout(() => {
        const canvas = character.Canvas as HTMLCanvasElement;
        const imageData = canvas.toDataURL('image/png');
        const data = {
          MemberNumber: character.MemberNumber,
          CanvasHeight: character.Canvas.height,
          HeightModifier: character.HeightModifier,
          HeightRatio: character.HeightRatio,
          HeightRatioProportion: character.HeightRatioProportion,
          IsInverted: character.IsInverted(),
          ImageData: imageData
        };
        window.postMessage({
          handshake,
          type: 'client',
          event: 'CommonDrawAppearanceBuild',
          data,
        } as IClientMessage<any>, '*');

        delete charactersToUpdate[character.MemberNumber];
      }, 1000);
    }
  } catch (error) {
    console.warn('[Bondage Club Tools] Could not store character appearance. This is only a problem for the extension, game functionality is not affected.', error);
  }
}

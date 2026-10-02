import { IClientMessage } from 'models';

const charactersToUpdate = {};

function warnAppearanceNotStored(error?: unknown) {
  console.warn('[Bondage Club Tools] Could not store character appearance. This is only a problem for the extension, game functionality is not affected.', error);
}

export function sendCharacterAppearance(character: any, handshake: string) {
  try {
    if (character && character.MemberNumber) {
      if (charactersToUpdate[character.MemberNumber]) {
        return;
      }

      charactersToUpdate[character.MemberNumber] = setTimeout(() => {
        delete charactersToUpdate[character.MemberNumber];

        try {
          const canvas = character.Canvas as HTMLCanvasElement;
          const metaData = {
            MemberNumber: character.MemberNumber,
            CanvasHeight: canvas.height,
            HeightModifier: character.HeightModifier,
            HeightRatio: character.HeightRatio,
            HeightRatioProportion: character.HeightRatioProportion,
            IsInverted: character.IsInverted()
          };

          // Encoded asynchronously, so the game is not blocked. Sent as a data
          // URL, because extension messaging can only carry JSON.
          canvas.toBlob(blob => {
            if (!blob) {
              warnAppearanceNotStored('Could not encode canvas');
              return;
            }

            const reader = new FileReader();
            reader.addEventListener('error', () => warnAppearanceNotStored(reader.error));
            reader.addEventListener('load', () => {
              window.postMessage({
                handshake,
                type: 'client',
                event: 'CommonDrawAppearanceBuild',
                data: {
                  ...metaData,
                  ImageData: reader.result as string
                },
              } as IClientMessage<any>, '*');
            });
            reader.readAsDataURL(blob);
          }, 'image/webp', 0.9);
        } catch (error) {
          warnAppearanceNotStored(error);
        }
      }, 1000);
    }
  } catch (error) {
    warnAppearanceNotStored(error);
  }
}

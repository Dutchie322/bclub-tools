import { IClientMessage } from 'models';

export function characterAppearance(handshake: string) {
  const charactersToUpdate = {};
  let proxyEnabled = true;

  const handler = {
    apply(target, thisArg, argumentsList) {
      const returnValue = target.apply(thisArg, argumentsList);

      if (!proxyEnabled) {
        return returnValue;
      }

      try {
        const character = argumentsList[0];
        if (character && character.MemberNumber) {
          if (charactersToUpdate[character.MemberNumber]) {
            return returnValue;
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
        proxyEnabled = false;
      }

      return returnValue;
    }
  } as ProxyHandler<typeof CommonDrawAppearanceBuild>;
  const proxy = new Proxy(CommonDrawAppearanceBuild, handler);
  CommonDrawAppearanceBuild = proxy;

  return () => {
    proxyEnabled = false;
  };
}

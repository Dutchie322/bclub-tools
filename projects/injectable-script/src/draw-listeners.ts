import { IClientMessage } from 'models';

export function characterAppearance(postMessage: PostMessageCallback) {
  const charactersToUpdate = {};
  let proxyEnabled = true;

  const handler = {
    apply(target, thisArg, argumentsList) {
      const returnValue = target.apply(thisArg, argumentsList);

      if (proxyEnabled) {
        try {
          const character = argumentsList[0];
          if (character.MemberNumber) {
            if (charactersToUpdate[character.MemberNumber]) {
              clearTimeout(charactersToUpdate[character.MemberNumber]);
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
              postMessage('client', 'CommonDrawAppearanceBuild', data);

              delete charactersToUpdate[character.MemberNumber];
            }, 1000);
          }
        } catch (error) {
          console.error(error);
          proxyEnabled = false;
        }
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

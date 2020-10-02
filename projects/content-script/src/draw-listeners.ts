import { IClientMessage } from 'models';

export function characterAppearance(handshake: string) {
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
              window.postMessage({
                handshake,
                type: 'client',
                event: 'CommonDrawAppearanceBuild',
                data: {
                  MemberNumber: character.MemberNumber,
                  ImageData: imageData
                },
              } as IClientMessage<any>, '*');

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
  } as ProxyHandler<typeof window.CommonDrawAppearanceBuild>;
  const proxy = new Proxy(window.CommonDrawAppearanceBuild, handler);
  window.CommonDrawAppearanceBuild = proxy;

  return () => {
    proxyEnabled = false;
  };
}

export function frameCounter() {
  let lastKnownFrameRate = 0;
  let ProxyEnabled = true;
  let frames = 0;
  let lastCalculationTime = 0;
  let lastTimestamp = 0;

  const handler = {
    apply(target, thisArg, argumentsList) {
      if (ProxyEnabled) {
        const timestamp = argumentsList[0];
        const timerRunInterval = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        frames++;

        lastCalculationTime += timerRunInterval;
        if (lastCalculationTime >= 1000) {
          lastKnownFrameRate = frames;
          frames = 0;
          lastCalculationTime = 0;
        }

        const text = `${lastKnownFrameRate} FPS`;
        MainCanvas.font = '14px Arial';
        MainCanvas.fillStyle = 'black';
        MainCanvas.fillText(text, 31, 8);
        MainCanvas.fillStyle = 'white';
        MainCanvas.fillText(text, 30, 7);
        MainCanvas.font = '36px Arial';
      }

      return target.apply(thisArg, argumentsList);
    }
  } as ProxyHandler<typeof TimerProcess>;

  const proxy = new Proxy(TimerProcess, handler);
  TimerProcess = proxy;

  return () => {
    console.log('[Bondage Club Tools] Removing frame counter');
    ProxyEnabled = false;
  };
}

/// <reference path="../../../typings/Scripts/Drawing.d.ts" />
/// <reference path="../../../typings/Scripts/Timer.d.ts" />

export function frameCounter() {
  let FPS = 0;
  let ProxyEnabled = true;
  let TimerFrameCalculationCycles = 0;
  let TimerLastFrameCalculation = 0;

  const handler = {
    apply(target, thisArg, argumentsList) {
      if (ProxyEnabled) {
        TimerLastFrameCalculation = Math.floor(TimerLastFrameCalculation + TimerRunInterval);
        if (TimerLastFrameCalculation >= 1000) {
          FPS = TimerCycle - TimerFrameCalculationCycles;
          TimerFrameCalculationCycles = TimerCycle;
          TimerLastFrameCalculation = 0;
        }
        // DrawTextFit(`${FPS} FPS`, 25, 6, 50, 'white');

        const text = `${FPS} FPS`;
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
  window.TimerProcess = proxy;

  return () => {
    console.log('[Bondage Club Tools] Removing frame counter');
    ProxyEnabled = false;
  };
}

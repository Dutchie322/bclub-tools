/// <reference path="../../../typings/Scripts/Drawing.d.ts" />
/// <reference path="../../../typings/Scripts/Timer.d.ts" />

export function frameCounter() {
  let FPS = 0;
  let TimerFrameCalculationCycles = 0;
  let TimerLastFrameCalculation = 0;

  const handler = {
    apply(target, thisArg, argumentsList) {
      TimerLastFrameCalculation = Math.floor(TimerLastFrameCalculation + TimerRunInterval);
      if (TimerLastFrameCalculation >= 1000) {
        FPS = TimerCycle - TimerFrameCalculationCycles;
        TimerFrameCalculationCycles = TimerCycle;
        TimerLastFrameCalculation = 0;
      }
      DrawText(`${FPS} FPS`, 1920, 990, 'white', 'black');

      return target.apply(thisArg, argumentsList);
    }
  } as ProxyHandler<typeof TimerProcess>;

  const proxy = new Proxy(TimerProcess, handler);
  window.TimerProcess = proxy;
}

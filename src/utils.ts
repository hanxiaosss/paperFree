import { unstable_batchedUpdates } from "react-dom";

export const distance = (x: number, y: number) => Math.abs(x - y);

export const resetCursor = (canvas: HTMLCanvasElement | null) => {
  if (canvas) {
    canvas.style.cursor = "";
  }
};

export const getUpdatedTimestamp = () => (false? 1 : Date.now());

export const viewportCoordsToSceneCoords = (
  { clientX, clientY }: { clientX: number; clientY: number },
) => {
  const x = clientX
  const y = clientY


  return { x, y };
};

export const withBatchedUpdatesThrottled = <
  TFunction extends ((event: any) => void) | (() => void),
>(
  func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never,
) => {
  // @ts-ignore
  return throttleRAF<Parameters<TFunction>>(((event) => {
    unstable_batchedUpdates(func, event);
  }) as TFunction);
};

export const withBatchedUpdates = <
  TFunction extends ((event: any) => void) | (() => void),
>(
  func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never,
) =>
  ((event) => {
    unstable_batchedUpdates(func as TFunction, event);
  }) as TFunction;


  export const throttleRAF = (fn,opts)=>{
    let timerId=null as any;
    let lastArgs=null as any;
    let lastArgsTrailing=null as any
    const scheduleFunc = (args) => {
      timerId = window.requestAnimationFrame(() => {
        timerId = null;
        fn(...args);
        lastArgs = null;
        if (lastArgsTrailing) {
          lastArgs = lastArgsTrailing;
          lastArgsTrailing = null;
          scheduleFunc(lastArgs);
        }
      });
    };

    const ret = (...args) => {
      if (process.env.NODE_ENV === "test") {
        fn(...args);
        return;
      }
      lastArgs = args;
      if (timerId === null) {
        scheduleFunc(lastArgs);
      } else if (opts?.trailing) {
        lastArgsTrailing = args;
      }
    };
    ret.flush = () => {
      if (timerId !== null) {
        cancelAnimationFrame(timerId);
        timerId = null;
      }
      if (lastArgs) {
        fn(...(lastArgsTrailing || lastArgs));
        lastArgs = lastArgsTrailing = null;
      }
    };
    ret.cancel = () => {
      lastArgs = lastArgsTrailing = null;
      if (timerId !== null) {
        cancelAnimationFrame(timerId);
        timerId = null;
      }
    };
    return ret
  }

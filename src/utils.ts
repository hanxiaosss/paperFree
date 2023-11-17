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

export const withBatchedUpdates = <
  TFunction extends ((event: any) => void) | (() => void),
>(
  func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never,
) =>
  ((event) => {
    unstable_batchedUpdates(func as TFunction, event);
  }) as TFunction;

import { Point as RoughPoint } from "roughjs/bin/geometry";
import { throttleRAF } from "./utils";

export type Point = Readonly<RoughPoint>;

export type PointerDownState = Readonly<{
  origin: Readonly<{ x: number; y: number }>;  // We need to have these in the state so that we can unsubscribe them
  eventListeners: {
    // It's defined on the initial pointer down event
    onMove: null | ReturnType<typeof throttleRAF>;
    // It's defined on the initial pointer down event
    onUp: null | ((event: PointerEvent) => void);
    // It's defined on the initial pointer down event
    onKeyDown: null | ((event: KeyboardEvent) => void);
    // It's defined on the initial pointer down event
    onKeyUp: null | ((event: KeyboardEvent) => void);
  };
}>;
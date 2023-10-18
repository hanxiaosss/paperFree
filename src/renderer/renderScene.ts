import { RoughCanvas } from "roughjs/bin/canvas";

import {
  viewportCoordsToSceneCoords,
  throttleRAF,
} from "../utils";

export const DEFAULT_SPACING = 2;


export const _renderScene = ({
  elements,
  appState,
  scale,
  rc,
  canvas,
  renderConfig,
}: {
  elements: any[];
  appState: any;
  scale: number;
  rc: RoughCanvas;
  canvas: HTMLCanvasElement;
  renderConfig: any;
}) =>
  // extra options passed to the renderer
  {
    if (canvas === null) {
      return { atLeastOneVisibleElement: false };
    }

    const context = canvas.getContext("2d")!;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.save();
    context.scale(scale, scale)

  };

const renderSceneThrottled = throttleRAF(
  (config: {
    elements: any[];
    appState: any;
    scale: number;
    rc: RoughCanvas;
    canvas: HTMLCanvasElement;
    renderConfig: any;
    callback?: (data: ReturnType<typeof _renderScene>) => void;
  }) => {
    const ret = _renderScene(config);
    config.callback?.(ret);
  },
  { trailing: true },
);

/** renderScene throttled to animation framerate */
export const renderScene = <T extends boolean = false>(
  config: {
    elements: any[];
    appState: any;
    scale: number;
    rc: RoughCanvas;
    canvas: HTMLCanvasElement;
    renderConfig: any;
    callback?: (data: ReturnType<typeof _renderScene>) => void;
  },
  /** Whether to throttle rendering. Defaults to false.
   * When throttling, no value is returned. Use the callback instead. */
  throttle?: T,
): T extends true ? void : ReturnType<typeof _renderScene> => {
  if (throttle) {
    renderSceneThrottled(config);
    return undefined as T extends true ? void : ReturnType<typeof _renderScene>;
  }
  const ret = _renderScene(config);
  config.callback?.(ret);
  return ret as T extends true ? void : ReturnType<typeof _renderScene>;
};



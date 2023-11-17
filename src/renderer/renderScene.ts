import { RoughCanvas } from "roughjs/bin/canvas";
import { renderElement } from "./renderElement";
import { NonDeleteddrawElement, drawElement } from "../element/type";


export const _renderScene = ({
  elements,
  rc,
  canvas,
}: {
  elements: readonly NonDeleteddrawElement[];
  rc: RoughCanvas;
  canvas: HTMLCanvasElement;
}) =>
  // extra options passed to the renderer
  {
    if (canvas === null) {
      return { atLeastOneVisibleElement: false };
    }

    const context = canvas.getContext("2d")!;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.save();
    // Apply zoom
    context.save();

    console.log(elements,'elements.foreach')

    elements.forEach((element) => {
      try {
        renderElement(element, rc, context);
      } catch (error: any) {
        console.error(error);
      }
    });


    context.restore();
    return { atLeastOneVisibleElement: elements.length > 0 };
  };

export const renderScene = <T extends boolean = false>(
  config: {
    elements: readonly NonDeleteddrawElement[];
    rc: RoughCanvas;
    canvas: HTMLCanvasElement;
    callback?: (data: ReturnType<typeof _renderScene>) => void;
  }
): T extends true ? void : ReturnType<typeof _renderScene> => {
  const {elements,rc,canvas}=config
  const ret = _renderScene(config);
  config.callback?.(ret);
  return ret as T extends true ? void : ReturnType<typeof _renderScene>;
};
import { RoughCanvas } from "roughjs/bin/canvas";
import { RoughGenerator } from "roughjs/bin/generator";
import { getStroke, StrokeOptions } from "perfect-freehand";
import {  isPathALoop } from "../math";
import {
  getElementAbsoluteCoords,
} from "../element/bounds";
import { getDefaultAppState } from "../appState";
import {
  getBoundTextElement
} from "../element/textElement";
import rough from "roughjs";
import { isArrowElement, isFreeDrawElement, isInitializedImageElement, isLinearElement } from "../element/typeChecks";
import { distance } from "../utils";
import { BOUND_TEXT_PADDING } from "../constants";
/**
 * Generates the element's shape and puts it into the cache.
 * @param element
 * @param generator
 */

const shapeCache = new WeakMap<any>();
const elementWithCanvasCache = new WeakMap<any>();

const IMAGE_INVERT_FILTER = "invert(100%) hue-rotate(180deg) saturate(1.25)";

const generateElementShape = (
  element: any,
  generator: RoughGenerator,
) => {
  let shape = shapeCache.get(element);

  // `null` indicates no rc shape applicable for this element type
  // (= do not generate anything)
  if (shape === undefined) {
    elementWithCanvasCache.delete(element);

    switch (element.type) {
      case "freedraw": {
        generateFreeDrawShape(element);

        if (isPathALoop(element.points)) {
          // generate rough polygon to fill freedraw shape
          shape = generator.polygon(element.points as [number, number][], {
            ...generateRoughOptions(element),
            stroke: "none",
          });
        } else {
          shape = null;
        }
        setShapeForElement(element, shape);
        break;
      }
    }
  }
};

export const setShapeForElement = <T extends any>(
  element: T,
  shape: any
) => shapeCache.set(element, shape);

const getDashArrayDashed = (strokeWidth: number) => [8, 8 + strokeWidth];
const getDashArrayDotted = (strokeWidth: number) => [1.5, 6 + strokeWidth];

export const generateRoughOptions = (
  element: any,
  continuousPath = false,
): any => {
  const options: any = {
    seed: element.seed,
    strokeLineDash:
      element.strokeStyle === "dashed"
        ? getDashArrayDashed(element.strokeWidth)
        : element.strokeStyle === "dotted"
        ? getDashArrayDotted(element.strokeWidth)
        : undefined,
    // for non-solid strokes, disable multiStroke because it tends to make
    // dashes/dots overlay each other
    disableMultiStroke: element.strokeStyle !== "solid",
    // for non-solid strokes, increase the width a bit to make it visually
    // similar to solid strokes, because we're also disabling multiStroke
    strokeWidth:
      element.strokeStyle !== "solid"
        ? element.strokeWidth + 0.5
        : element.strokeWidth,
    // when increasing strokeWidth, we must explicitly set fillWeight and
    // hachureGap because if not specified, roughjs uses strokeWidth to
    // calculate them (and we don't want the fills to be modified)
    fillWeight: element.strokeWidth / 2,
    hachureGap: element.strokeWidth * 4,
    roughness: element.roughness,
    stroke: element.strokeColor,
    preserveVertices: continuousPath,
  };

  switch (element.type) {
    case "rectangle":
    case "diamond":
    case "ellipse": {
      options.fillStyle = element.fillStyle;
      options.fill =
        element.backgroundColor === "transparent"
          ? undefined
          : element.backgroundColor;
      if (element.type === "ellipse") {
        options.curveFitting = 1;
      }
      return options;
    }
    case "line":
    case "freedraw": {
      if (isPathALoop(element.points)) {
        options.fillStyle = element.fillStyle;
        options.fill =
          element.backgroundColor === "transparent"
            ? undefined
            : element.backgroundColor;
      }
      return options;
    }
    case "arrow":
      return options;
    default: {
      throw new Error(`Unimplemented type ${element.type}`);
    }
  }
};

export function generateFreeDrawShape(element: any) {
  const svgPathData = getFreeDrawSvgPath(element);
  const path = new Path2D(svgPathData);
  pathsCache.set(element, path);
  return path;
}
export function getFreeDrawSvgPath(element: any) {
  // If input points are empty (should they ever be?) return a dot
  const inputPoints = element.simulatePressure
    ? element.points
    : element.points.length
    ? element.points.map(([x, y], i) => [x, y, element.pressures[i]])
    : [[0, 0, 0.5]];

  // Consider changing the options for simulated pressure vs real pressure
  const options: StrokeOptions = {
    simulatePressure: element.simulatePressure,
    size: element.strokeWidth * 4.25,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => Math.sin((t * Math.PI) / 2), // https://easings.net/#easeOutSine
    last: !!element.lastCommittedPoint, // LastCommittedPoint is added on pointerup
  };

  return getSvgPathFromStroke(getStroke(inputPoints as number[][], options));
}

const defaultAppState = getDefaultAppState();
const getCanvasPadding = (element: any) =>
  element.type === "freedraw" ? element.strokeWidth * 12 : 20;

  const cappedElementCanvasSize = (
    element: any,
    zoom: any,
  ): {
    width: number;
    height: number;
    scale: number;
  } => {
    // these limits are ballpark, they depend on specific browsers and device.
    // We've chosen lower limits to be safe. We might want to change these limits
    // based on browser/device type, if we get reports of low quality rendering
    // on zoom.
    //
    // ~ safari mobile canvas area limit
    const AREA_LIMIT = 16777216;
    // ~ safari width/height limit based on developer.mozilla.org.
    const WIDTH_HEIGHT_LIMIT = 32767;
  
    const padding = getCanvasPadding(element);
  
    const [x1, y1, x2, y2] = getElementAbsoluteCoords(element);
    const elementWidth = distance(x1, x2)
    const elementHeight =distance(y1, y2)
       
  
    let width = elementWidth * window.devicePixelRatio + padding * 2;
    let height = elementHeight * window.devicePixelRatio + padding * 2;
  
    let scale: number = zoom.value;
  
    // rescale to ensure width and height is within limits
    if (
      width * scale > WIDTH_HEIGHT_LIMIT ||
      height * scale > WIDTH_HEIGHT_LIMIT
    ) {
      scale = Math.min(WIDTH_HEIGHT_LIMIT / width, WIDTH_HEIGHT_LIMIT / height);
    }
  
    // rescale to ensure canvas area is within limits
    if (width * height * scale * scale > AREA_LIMIT) {
      scale = Math.sqrt(AREA_LIMIT / (width * height));
    }
  
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
  
    return { width, height, scale };
  };

const generateElementCanvas = (
  element: any,
  zoom: any,
  renderConfig: any,
): any => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  const padding = getCanvasPadding(element);

  const { width, height, scale } = cappedElementCanvasSize(element as any, zoom);

  canvas.width = width;
  canvas.height = height;

  let canvasOffsetX = 0;
  let canvasOffsetY = 0;

  if (isLinearElement(element) || isFreeDrawElement(element)) {
    const [x1, y1] = getElementAbsoluteCoords(element);

    canvasOffsetX =
      element.x > x1
        ? distance(element.x, x1) * window.devicePixelRatio * scale
        : 0;

    canvasOffsetY =
      element.y > y1
        ? distance(element.y, y1) * window.devicePixelRatio * scale
        : 0;

    context.translate(canvasOffsetX, canvasOffsetY);
  }

  context.save();
  context.translate(padding * scale, padding * scale);
  context.scale(
    window.devicePixelRatio * scale,
    window.devicePixelRatio * scale,
  );

  const rc = rough.canvas(canvas);

  drawElementOnCanvas(element, rc, context, renderConfig);
  context.restore();

  return {
    element,
    canvas,
    theme: renderConfig.theme,
    scale,
    zoomValue: zoom.value,
    canvasOffsetX,
    canvasOffsetY,
    boundTextElementVersion: getBoundTextElement(element)?.version || null,
  };
};


const generateElementWithCanvas = (
  element: any,
  renderConfig: any,
) => {
  const zoom: any = renderConfig ? renderConfig.zoom : defaultAppState.zoom;
  const prevElementWithCanvas = elementWithCanvasCache.get(element);
  const shouldRegenerateBecauseZoom =
    prevElementWithCanvas &&
    prevElementWithCanvas.canvasZoom !== zoom.value &&
    !renderConfig?.shouldCacheIgnoreZoom;
  const boundTextElementVersion = getBoundTextElement(element)?.version || null;

  if (
    !prevElementWithCanvas ||
    shouldRegenerateBecauseZoom ||
    prevElementWithCanvas.theme !== renderConfig.theme ||
    prevElementWithCanvas.boundTextElementVersion !== boundTextElementVersion
  ) {
    const elementWithCanvas = generateElementCanvas(
      element,
      zoom,
      renderConfig,
    );

    elementWithCanvasCache.set(element, elementWithCanvas);

    return elementWithCanvas;
  }
  return prevElementWithCanvas;
};

export const renderElement = (
  element: any,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: any,
  appState: any,
) => {
  const generator = rc.generator;
  switch (element.type) {
    case "freedraw": {
      generateElementShape(element as any, generator);

      if (renderConfig.isExporting) {
        const [x1, y1, x2, y2] = getElementAbsoluteCoords(element);
        const cx = (x1 + x2) / 2 + renderConfig.scrollX;
        const cy = (y1 + y2) / 2 + renderConfig.scrollY;
        const shiftX = (x2 - x1) / 2 - (element.x - x1);
        const shiftY = (y2 - y1) / 2 - (element.y - y1);
        context.save();
        context.translate(cx, cy);
        context.rotate(element.angle);
        context.translate(-shiftX, -shiftY);
        drawElementOnCanvas(element, rc, context, renderConfig);
        context.restore();
      } else {
        const elementWithCanvas = generateElementWithCanvas(
          element,
          renderConfig,
        );
        drawElementFromCanvas(elementWithCanvas, rc, context, renderConfig);
      }

      break;
    }
  }
};

const isPendingImageElement = (
  element: any,
  renderConfig: any,
) =>
  isInitializedImageElement(element) &&
  !renderConfig.imageCache.has(element.fileId);

const drawElementFromCanvas = (
  elementWithCanvas: any,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: any,
) => {
  const element = elementWithCanvas.element;
  const padding = getCanvasPadding(element);
  const zoom = elementWithCanvas.scale;
  let [x1, y1, x2, y2] = getElementAbsoluteCoords(element);

  // Free draw elements will otherwise "shuffle" as the min x and y change
  if (isFreeDrawElement(element)) {
    x1 = Math.floor(x1);
    x2 = Math.ceil(x2);
    y1 = Math.floor(y1);
    y2 = Math.ceil(y2);
  }

  const cx = ((x1 + x2) / 2 + renderConfig.scrollX) * window.devicePixelRatio;
  const cy = ((y1 + y2) / 2 + renderConfig.scrollY) * window.devicePixelRatio;

  context.save();
  context.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
  const boundTextElement = getBoundTextElement(element);

  if (isArrowElement(element) && boundTextElement) {
    const tempCanvas = document.createElement("canvas");
    const tempCanvasContext = tempCanvas.getContext("2d")!;

    // Take max dimensions of arrow canvas so that when canvas is rotated
    // the arrow doesn't get clipped
    const maxDim = Math.max(distance(x1, x2), distance(y1, y2));
    tempCanvas.width =
      maxDim * window.devicePixelRatio * zoom +
      padding * elementWithCanvas.scale * 10;
    tempCanvas.height =
      maxDim * window.devicePixelRatio * zoom +
      padding * elementWithCanvas.scale * 10;
    const offsetX = (tempCanvas.width - elementWithCanvas.canvas!.width) / 2;
    const offsetY = (tempCanvas.height - elementWithCanvas.canvas!.height) / 2;

    tempCanvasContext.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCanvasContext.rotate(element.angle);

    tempCanvasContext.drawImage(
      elementWithCanvas.canvas!,
      -elementWithCanvas.canvas.width / 2,
      -elementWithCanvas.canvas.height / 2,
      elementWithCanvas.canvas.width,
      elementWithCanvas.canvas.height,
    );

    const [, , , , boundTextCx, boundTextCy] =
      getElementAbsoluteCoords(boundTextElement);

    tempCanvasContext.rotate(-element.angle);

    // Shift the canvas to the center of the bound text element
    const shiftX =
      tempCanvas.width / 2 -
      (boundTextCx - x1) * window.devicePixelRatio * zoom -
      offsetX -
      padding * zoom;

    const shiftY =
      tempCanvas.height / 2 -
      (boundTextCy - y1) * window.devicePixelRatio * zoom -
      offsetY -
      padding * zoom;
    tempCanvasContext.translate(-shiftX, -shiftY);

    // Clear the bound text area
    tempCanvasContext.clearRect(
      -(boundTextElement.width / 2 + BOUND_TEXT_PADDING) *
        window.devicePixelRatio *
        zoom,
      -(boundTextElement.height / 2 + BOUND_TEXT_PADDING) *
        window.devicePixelRatio *
        zoom,
      (boundTextElement.width + BOUND_TEXT_PADDING * 2) *
        window.devicePixelRatio *
        zoom,
      (boundTextElement.height + BOUND_TEXT_PADDING * 2) *
        window.devicePixelRatio *
        zoom,
    );

    context.translate(cx, cy);
    context.drawImage(
      tempCanvas,
      (-(x2 - x1) / 2) * window.devicePixelRatio - offsetX / zoom - padding,
      (-(y2 - y1) / 2) * window.devicePixelRatio - offsetY / zoom - padding,
      tempCanvas.width / zoom,
      tempCanvas.height / zoom,
    );
  } else {
    // we translate context to element center so that rotation and scale
    // originates from the element center
    context.translate(cx, cy);

    context.rotate(element.angle);

    if (
      "scale" in elementWithCanvas.element &&
      !isPendingImageElement(element, renderConfig)
    ) {
      context.scale(
        elementWithCanvas.element.scale[0],
        elementWithCanvas.element.scale[1],
      );
    }



    // revert afterwards we don't have account for it during drawing
    context.translate(-cx, -cy);

    context.drawImage(
      elementWithCanvas.canvas!,
      (x1 + renderConfig.scrollX) * window.devicePixelRatio -
        (padding * elementWithCanvas.scale) / elementWithCanvas.scale,
      (y1 + renderConfig.scrollY) * window.devicePixelRatio -
        (padding * elementWithCanvas.scale) / elementWithCanvas.scale,
      elementWithCanvas.canvas!.width / elementWithCanvas.scale,
      elementWithCanvas.canvas!.height / elementWithCanvas.scale,
    );
  }
  context.restore();

  // Clear the nested element we appended to the DOM
};

const drawElementOnCanvas = (
  element: any,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
  renderConfig: any,
) => {
  context.globalAlpha = element.opacity / 100;
  switch (element.type) {
    case "freedraw": {
      // Draw directly to canvas
      context.save();
      context.fillStyle = element.strokeColor;

      const path = getFreeDrawPath2D(element) as Path2D;
      // const fillShape = getShapeForElement(element);

      // if (fillShape) {
      //   rc.draw(fillShape);
      // }

      context.fillStyle = element.strokeColor;
      context.fill(path);

      context.restore();
      break;
    }
  }
  context.globalAlpha = 1;
};

export const pathsCache = new WeakMap<any>([]);
export function getFreeDrawPath2D(element: any) {
  return pathsCache.get(element);
}

// Trim SVG path data so number are each two decimal points. This
// improves SVG exports, and prevents rendering errors on points
// with long decimals.
const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;

function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) {
    return "";
  }

  const max = points.length - 1;

  return points
    .reduce(
      (acc, point, i, arr) => {
        if (i === max) {
          acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
        } else {
          acc.push(point, med(point, arr[i + 1]));
        }
        return acc;
      },
      ["M", points[0], "Q"],
    )
    .join(" ")
    .replace(TO_FIXED_PRECISION, "$1");
}

function med(A: number[], B: number[]) {
  return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
}
import getStroke, { StrokeOptions } from "perfect-freehand";
import { FreeDrawElement, NonDeleteddrawElement, drawElement } from "../element/type";
import { RoughCanvas } from "roughjs/bin/canvas";
import { RoughGenerator } from "roughjs/bin/generator";
import { Drawable, Options } from "roughjs/bin/core";
import { random } from "nanoid";

type ElementShapes = {
  freedraw: Drawable | null;
};

type ElementShape = Drawable | Drawable[] | null;

export const pathsCache = new WeakMap<FreeDrawElement, Path2D>([]);
const shapeCache = new WeakMap<drawElement, ElementShape>();


export const renderElement = (
  element: NonDeleteddrawElement,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
) => {
  const generator = rc.generator;
  switch (element.type) {
    case "freedraw": {
      console.log('renderElement')
      generateElementShape(element,generator);
      drawElementOnCanvas(element, rc, context);
      break;
    }
    default: {
      throw new Error(`Unimplemented type ${element.type}`);
    }
  }
};

const generateElementShape = (element:drawElement,generator: RoughGenerator,)=>{
  let shape = shapeCache.get(element);
  switch (element.type){
    case "freedraw":
      generateFreeDrawShape(element)
        // generate rough polygon to fill freedraw shape
        shape = generator.polygon(element.points as [number, number][], {
          ...generateRoughOptions(element),
          stroke: "none",
        });
      setShapeForElement(element, shape);
      break;
  }
}

export const generateRoughOptions = (
  element: drawElement,
  continuousPath = false,
): Options => {
  const options: Options = {
    seed: 2335,
    strokeLineDash:[1],
    disableMultiStroke: true,
    strokeWidth:0.5,
    fillWeight: element.strokeWidth / 2,
    hachureGap: element.strokeWidth * 4,
    roughness: element.roughness,
    stroke: element.strokeColor,
    preserveVertices: continuousPath,
  };

  switch (element.type) {
    case "freedraw": {
        options.fill =
          element.backgroundColor === "transparent"
            ? undefined
            : element.backgroundColor;
      }
      return options;
    default: {
      throw new Error(`Unimplemented type ${element.type}`);
    }
  }
};

export function generateFreeDrawShape(element: FreeDrawElement) {
  const svgPathData = getFreeDrawSvgPath(element);
  const path = new Path2D(svgPathData);
  pathsCache.set(element, path);
  return path;
}

export function getFreeDrawSvgPath(element: FreeDrawElement) {
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
  };

  return getSvgPathFromStroke(getStroke(inputPoints as number[][], options));
}

const drawElementOnCanvas = (
  element: NonDeleteddrawElement,
  rc: RoughCanvas,
  context: CanvasRenderingContext2D,
) => {
  context.globalAlpha = element.opacity / 100;
  console.log('drawElementOnCanvas')
  switch (element.type) {
    case "freedraw": {
      // Draw directly to canva
      context.save();
      context.fillStyle = element.strokeColor;

      const path = getFreeDrawPath2D(element) as Path2D;
      const fillShape = getShapeForElement(element) ;
      console.log(JSON.stringify(fillShape),'hxdraw',path,rc)
      if(fillShape){
        rc.draw(fillShape);
      }

      context.fillStyle = element.strokeColor;
      context.fill(path);
      context.restore();
      break;
    }
    default: {
        throw new Error(`Unimplemented type ${element.type}`);  
    }
  }
  context.globalAlpha = 1;
};

export const getShapeForElement = <T extends drawElement>(element: T) =>
  shapeCache.get(element) as T["type"] extends keyof ElementShapes
    ? ElementShapes[T["type"]] | undefined
    : Drawable | null | undefined;

    export const setShapeForElement = <T extends drawElement>(
      element: T,
      shape: T["type"] extends keyof ElementShapes
        ? ElementShapes[T["type"]]
        : Drawable,
    ) => shapeCache.set(element, shape);

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

export function getFreeDrawPath2D(element: FreeDrawElement) {
  return pathsCache.get(element);
}

// Trim SVG path data so number are each two decimal points. This
// improves SVG exports, and prevents rendering errors on points
// with long decimals.
const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;

function med(A: number[], B: number[]) {
  return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
}
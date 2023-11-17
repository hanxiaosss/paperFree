import { randomInteger } from "../random";
import Scene from "../scene/Scene";
import { Point } from "../type";
import { getUpdatedTimestamp } from "../utils";

export const mutateElement = (
  element: any,
  updates: any,
  informMutation = true,
): any => {
  let didChange = false;

  const { points, fileId } = updates as any;

  for (const key in updates) {
    const value = (updates as any)[key];
    if (typeof value !== "undefined") {
      if (
        (element as any)[key] === value &&
        (typeof value !== "object" ||
          value === null ||
          key === "groupIds" ||
          key === "scale")
      ) {
        continue;
      }

      if (key === "scale") {
        const prevScale = (element as any)[key];
        const nextScale = value;
        if (prevScale[0] === nextScale[0] && prevScale[1] === nextScale[1]) {
          continue;
        }
      } else if (key === "points") {
        const prevPoints = (element as any)[key];
        const nextPoints = value;
        if (prevPoints.length === nextPoints.length) {
          let didChangePoints = false;
          let index = prevPoints.length;
          while (--index) {
            const prevPoint: Point = prevPoints[index];
            const nextPoint: Point = nextPoints[index];
            if (
              prevPoint[0] !== nextPoint[0] ||
              prevPoint[1] !== nextPoint[1]
            ) {
              didChangePoints = true;
              break;
            }
          }
          if (!didChangePoints) {
            continue;
          }
        }
      }

      (element as any)[key] = value;
      didChange = true;
    }
  }
  if (!didChange) {
    return element;
  }

  element.version++;
  element.versionNonce = randomInteger();
  element.updated = getUpdatedTimestamp();

  if (informMutation) {
    Scene.getScene(element)?.informMutation();
  }

  return element;
};
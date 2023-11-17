import { Point } from "../type";

type _ElementBase = Readonly<{
  id: string;
  x: number;
  y: number;
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  roundness: number
  roughness: number;
  opacity: number;
  width: number;
  height: number;
  angle: number;
}>;

export type FreeDrawElement = _ElementBase &
  Readonly<{
    type: "freedraw";
    points: readonly Point[];
    pressures: readonly number[];
    simulatePressure: boolean;
    lastCommittedPoint: Point | null;
  }>;

  export type drawElement = FreeDrawElement

  export type NonDeleted<TElement extends drawElement> = TElement & {
    isDeleted: boolean;
  };
  
  export type NonDeleteddrawElement = NonDeleted<drawElement>;
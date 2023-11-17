import { Point as RoughPoint } from "roughjs/bin/geometry";

export type Point = Readonly<RoughPoint>;

export type PointerDownState = Readonly<{
  origin: Readonly<{ x: number; y: number }>;
}>;
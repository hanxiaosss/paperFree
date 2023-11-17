import { randomInteger, randomId } from "../random"; 
import { getUpdatedTimestamp } from "../utils";
export const newFreeDrawElement = (
  opts: {
    x:number,
    y:number,
    type: "freedraw";
    points?: any;
    simulatePressure: boolean;
  } ) => {
  return {
    ..._newElementBase(opts.type, opts),
    points: opts.points || [],
    pressures: [],
    simulatePressure: opts.simulatePressure,
    lastCommittedPoint: null,
  };
};

const _newElementBase = (
  type: any,
  {
    x,
    y,
    width = 0,
    height = 0,
    angle = 0,
    groupIds = [],
    roundness = null,
    boundElements = null,
    link = null,
    ...rest
  }:any,
) => {
  // assign type to guard against excess properties
  const element:any = {
    id: rest.id || randomId(),
    type,
    x,
    y,
    width,
    height,
    angle,
    groupIds,
    roundness,
    seed: rest.seed ?? randomInteger(),
    version: rest.version || 1,
    versionNonce: rest.versionNonce ?? 0,
    isDeleted: false as false,
    boundElements,
    updated: getUpdatedTimestamp(),
    link,
    fillWeight:0.5,
    stroke:"none",
    strokeWidth:1,
    roughness:1
  };
  return element;
};
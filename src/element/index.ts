import { NonDeleteddrawElement, drawElement } from "./type";

export const getNonDeletedElements = (elements: readonly NonDeleteddrawElement[]) =>
elements.filter(
  (element) => !element.isDeleted,
);
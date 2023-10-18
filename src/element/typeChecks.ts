export const isFreeDrawElement = (
  element?: any,
): element is any => {
  return element != null && isFreeDrawElementType(element.type);
};

export const isFreeDrawElementType = (
  elementType: any["type"],
): boolean => {
  return elementType === "freedraw";
};

export const isLinearElement = (
  element?: any,
): element is any => {
  return element != null && isLinearElementType(element.type);
};

export const isLinearElementType = (
  elementType: any,
): boolean => {
  return (
    elementType === "arrow" || elementType === "line" // || elementType === "freedraw"
  );
};

export const isArrowElement = (
  element?: any,
): element is any => {
  return element != null && element.type === "arrow";
};

export const isInitializedImageElement = (
  element: any,
): element is any => {
  return !!element && element.type === "image" && !!element.fileId;
};
export const hasBoundTextElement = (
  element: any,
): element is any => {
  return (
    isTextBindableContainer(element) &&
    !!element.boundElements?.some(({ type }) => type === "text")
  );
};

export const isTextBindableContainer = (
  element: any,
  includeLocked = true,
): element is any => {
  return (
    element != null &&
    (!element.locked || includeLocked === true) &&
    (element.type === "rectangle" ||
      element.type === "diamond" ||
      element.type === "ellipse" ||
      element.type === "image" ||
      isArrowElement(element))
  );
};

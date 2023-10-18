export const getBoundTextElementId = (container: any) => {
  return container?.boundElements?.length
    ? container?.boundElements?.filter((ele) => ele.type === "text")[0]?.id ||
        null
    : null;
};

export const getBoundTextElement = (element: any) => {
  if (!element) {
    return null;
  }
  const boundTextElementId = getBoundTextElementId(element);
  if (boundTextElementId) {
    return (
      (Scene.getScene(element)?.getElement(
        boundTextElementId,
      ) as any) || null
    );
  }
  return null;
};
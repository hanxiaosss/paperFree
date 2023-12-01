import { getNonDeletedElements } from "../element";
import { NonDeleteddrawElement, drawElement } from "../element/type";

const isIdKey = (elementKey: any): elementKey is any => {
  if (typeof elementKey === "string") {
    return true;
  }
  return false;
};
class Scene {
  private elements: readonly any[] = [];
  private nonDeletedElements: NonDeleteddrawElement[] = [];
  private static sceneMapByElement = new WeakMap<any, Scene>();
  private static sceneMapById = new Map<string, Scene>();

  static getScene(elementKey: any): Scene | null {
    if (isIdKey(elementKey)) {
      return this.sceneMapById.get(elementKey) || null;
    }
    return this.sceneMapByElement.get(elementKey) || null;
  }

  getNonDeletedElements(): any[] {
    return this.nonDeletedElements;
  }

  getElementsIncludingDeleted() {
    return this.elements;
  }

  replaceAllElements(nextElements: readonly drawElement[]) {
    console.log(nextElements,'hx')
    this.elements = nextElements;
    this.nonDeletedElements = getNonDeletedElements(this.elements);
  }

}

export default Scene;
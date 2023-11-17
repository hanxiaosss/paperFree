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
  private elementsMap = new Map();
  private nonDeletedElements: NonDeleteddrawElement[] = [];
  private static sceneMapByElement = new WeakMap<any, Scene>();
  private static sceneMapById = new Map<string, Scene>();
  private callbacks: Set<any> = new Set();

  static getScene(elementKey: any): Scene | null {
    if (isIdKey(elementKey)) {
      return this.sceneMapById.get(elementKey) || null;
    }
    return this.sceneMapByElement.get(elementKey) || null;
  }

  getElement<T extends any>(id: any): T | null {
    return (this.elementsMap.get(id) as T | undefined) || null;
  }

  getNonDeletedElements(): any[] {
    return this.nonDeletedElements;
  }

  getElementsIncludingDeleted() {
    return this.elements;
  }
  informMutation() {
    for (const callback of Array.from(this.callbacks)) {
      callback();
    }
  }

  replaceAllElements(nextElements: readonly drawElement[]) {
    this.elements = nextElements;
    this.elementsMap.clear();
    nextElements.forEach((element) => {
      this.elementsMap.set(element.id, element);
      Scene.mapElementToScene(element, this);
    });
    this.nonDeletedElements = getNonDeletedElements(this.elements);
    this.informMutation();
  }

  static mapElementToScene(elementKey: any, scene: Scene) {
    if (isIdKey(elementKey)) {
      // for cases where we don't have access to the element object
      // (e.g. restore serialized appState with id references)
      this.sceneMapById.set(elementKey, scene);
    } else {
      this.sceneMapByElement.set(elementKey, scene);
      // if mapping element objects, also cache the id string when later
      // looking up by id alone
      // this.sceneMapById.set(elementKey.id, scene);
    }
  }

}

export default Scene;
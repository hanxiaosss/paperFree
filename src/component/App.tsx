import React from 'react'
import rough from 'roughjs'
import { renderScene } from '../renderer/renderScene'
import Scene from '../scene/Scene';
import { RoughCanvas } from 'roughjs/bin/canvas';
import { FreeDrawElement } from '../element/type';
import { PointerDownState } from '../type';
import { viewportCoordsToSceneCoords, withBatchedUpdates, withBatchedUpdatesThrottled } from '../utils';
import { getGridPoint } from './math';
import { newFreeDrawElement } from '../element/newElement';
import { mutateElement } from '../element/mutateElement';


class App extends React.Component<any, any> {
  canvas: any = null
  public scene: Scene;
  rc: RoughCanvas | null = null;

  constructor(props: any) {
    super(props)
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      activeTool:{
        type:'freedraw'
      }
    }
    this.scene = new Scene();
  }

  private renderCanvas(cursorData: any) {
    const canvasScale = window.devicePixelRatio
    const { width: canvasDOMWidth, height: canvasDOMHeight } = this.state
    const canvasWidth = canvasDOMWidth * canvasScale
    const canvasHeight = canvasDOMHeight * canvasScale
    return (
      <canvas
        className="board__canvas"
        id="canvas"
        style={{
          width: canvasDOMWidth,
          height: canvasDOMHeight
        }}
        width={canvasWidth}
        height={canvasHeight}
        ref={this.handleCanvasRef}
        onPointerDown={this.handleCanvasPointerDown}
        onPointerMove={this.handleCanvasPointerMove}
      ></canvas>
    )
  }

  private renderScene = () => {

    const renderingElements = this.scene
      .getNonDeletedElements()

    renderScene(
      {
        elements: renderingElements,
        rc: this.rc!,
        canvas: this.canvas!,
      },
    );
  };

  private handleCanvasRef = (canvas: HTMLCanvasElement) => {
    if (canvas !== null) {
      this.canvas = canvas;
      this.rc = rough.canvas(this.canvas);
    } 
  };


  componentDidUpdate(prevProps: any, prevState: any) {
    this.renderScene();
  }

  componentDidMount(): void {
  }

  private initialPointerDownState(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): PointerDownState {
    const origin = viewportCoordsToSceneCoords(event);
    return {
      origin,
      eventListeners: {
        onMove: null,
        onUp: null,
        onKeyUp: null,
        onKeyDown: null,
      },
    };
  }

  private handleCanvasPointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    const pointerDownState = this.initialPointerDownState(event);
    if (
      event.pointerType === "touch" &&
      this.state.draggingElement &&
      this.state.draggingElement.type === "freedraw"
    ) {
      const element = this.state.draggingElement as FreeDrawElement;
      this.updateScene({
        ...(element.points.length < 10
          ? {
              elements: this.scene
                .getElementsIncludingDeleted()
                .filter((el) => el.id !== element.id),
            }
          : {}),
      });
      return;
    }
    if (this.state.activeTool.type === "freedraw") {
      this.handleFreeDrawElementOnPointerDown(
        event,
        this.state.activeTool.type,
        pointerDownState,
      );
    }
    this.props?.onPointerDown?.(this.state.activeTool, pointerDownState);
    const onPointerMove =
    this.onPointerMoveFromPointerDownHandler(pointerDownState);
  
    window.addEventListener('pointermove', onPointerMove);

    pointerDownState.eventListeners.onMove = onPointerMove;
  };

  private onPointerMoveFromPointerDownHandler = ( pointerDownState: PointerDownState,)=>{
    const draggingElement = this.state.draggingElement
    return withBatchedUpdatesThrottled(
      (event)=>{
        const pointerCoords = viewportCoordsToSceneCoords(event);
        if (draggingElement?.type === "freedraw") {
          const points = draggingElement.points;
          const dx = pointerCoords.x - draggingElement.x;
          const dy = pointerCoords.y - draggingElement.y;
    
          const lastPoint = points.length > 0 && points[points.length - 1];
          const discardPoint =
            lastPoint && lastPoint[0] === dx && lastPoint[1] === dy;
    
          if (!discardPoint) {
            const pressures = draggingElement.simulatePressure
              ? draggingElement.pressures
              : [...draggingElement.pressures, [0.5]];
    
            mutateElement(draggingElement, {
              points: [...points, [dx, dy]],
              pressures,
            });
          }
          this.setState({verson:new Date()})
        }
      }
    )

  }

  private handleCanvasPointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    if(this.state.activeTool.type==="freedraw"){
    }

  };

  public updateScene = withBatchedUpdates(
   (sceneData: {
      elements?: any;
      appState?: any;
    }) => {

      if (sceneData.appState) {
        this.setState(sceneData.appState);
      }

      if (sceneData.elements) {
        this.scene.replaceAllElements(sceneData.elements);
      }
    },
  );
  
  private handleFreeDrawElementOnPointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
    elementType: FreeDrawElement["type"],
    pointerDownState: PointerDownState,
  ) => {
    // Begin a mark capture. This does not have to update state yet.
    const [gridX, gridY] = getGridPoint(
      pointerDownState.origin.x,
      pointerDownState.origin.y
    );

    const element = newFreeDrawElement({
      type: elementType,
      x: gridX,
      y: gridY,
      simulatePressure: event.pressure === 0.5,
    });

    mutateElement(element, {
      points: [[gridX, gridY]],
      pressures:[0.5],
    });

    this.scene.replaceAllElements([
      ...this.scene.getElementsIncludingDeleted(),
      element,
    ]);
    this.setState({
      draggingElement: element,
    });
  };

  public render() {
    const { cursorData } = this.props
    return (
      <div>
        <main>{this.renderCanvas(cursorData)}</main>
      </div>
    )
  }
}

export default App

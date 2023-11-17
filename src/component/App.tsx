import React from 'react'
import rough from 'roughjs'
import { renderScene } from '../renderer/renderScene'
import Scene from '../scene/Scene';
import { RoughCanvas } from 'roughjs/bin/canvas';
import { FreeDrawElement } from '../element/type';
import { PointerDownState } from '../type';
import { viewportCoordsToSceneCoords, withBatchedUpdates } from '../utils';
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
        // onPointerMove={this.handleCanvasPointerMove}
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

    const filltype = JSON.parse('{"shape":"polygon","sets":[],"options":{"maxRandomnessOffset":2,"roughness":1,"bowing":1,"stroke":"none","strokeWidth":0.5,"curveTightness":0,"curveFitting":0.95,"curveStepCount":9,"fillStyle":"hachure","fillWeight":0.5,"hachureAngle":-41,"hachureGap":4,"dashOffset":-1,"dashGap":-1,"zigzagOffset":-1,"seed":2335,"disableMultiStroke":true,"disableMultiStrokeFill":false,"preserveVertices":false,"strokeLineDash":[1]}}')

    const canvas = document.getElementById('canvas') as any
    // // console.log(canvas, 'hx')
    // const roughCanvas = rough.canvas(canvas as any)
    // let generator = roughCanvas.generator;

    canvas.addEventListener('pointerdown', (e) => {
     let path: any[] = []
     let isDrawing = true

     this.rc?.draw(filltype)

      // canvas.addEventListener('pointermove', drawLine)
      canvas.addEventListener('pointerup', stopDrawing)

      // function drawLine(e: any) {
      //   if (!isDrawing) return

      //   path.push([e.clientX, e.clientY] as any[])
      //   let curve = generator.curve(path);
      //   console.log(curve,'hx')
      //   roughCanvas.draw(curve)
      // }
      // drawLine(e)
      // let curve = generator.curve(path);
      // roughCanvas.draw(curve)
      
      function stopDrawing() {
        isDrawing = false
        canvas.removeEventListener('pointermove', drawLine)
        canvas.removeEventListener('pointerup', stopDrawing)
      }
    })
  }

  private initialPointerDownState(
    event: React.PointerEvent<HTMLCanvasElement>,
  ): PointerDownState {
    const origin = viewportCoordsToSceneCoords(event);
    return {
      origin,
    };
  }

  private handleCanvasPointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
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
        appState: {
          draggingElement: null,
          editingElement: null,
          startBoundElement: null,
          suggestedBindings: [],
          selectedElementIds: Object.keys(this.state.selectedElementIds)
            .filter((key) => key !== element.id)
            .reduce((obj: { [id: string]: boolean }, key) => {
              obj[key] = this.state.selectedElementIds[key];
              return obj;
            }, {}),
        },
      });
      return;
    }
    const pointerDownState = this.initialPointerDownState(event);
    if (this.state.activeTool.type === "freedraw") {
      this.handleFreeDrawElementOnPointerDown(
        event,
        this.state.activeTool.type,
        pointerDownState,
      );
    }
  };

  private handleCanvasPointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ) => {
    this.savePointer(event.clientX, event.clientY, this.state.cursorButton);
    
    const [element=null] = this.scene.getElementsIncludingDeleted()||[]

    if(element){
    mutateElement(element, {
      points: [[0, 0]],
      pressures:[0.5],
    });
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
    this.setState((prevState) => ({
      selectedElementIds: {
        ...prevState.selectedElementIds,
        [element.id]: false,
      },
    }));

    const pressures = element.simulatePressure
      ? element.pressures
      : [...element.pressures, event.pressure];

    mutateElement(element, {
      points: [[0, 0]],
      pressures,
    });

    this.scene.replaceAllElements([
      ...this.scene.getElementsIncludingDeleted(),
      element,
    ]);
  };

  private savePointer = (x: number, y: number, button: "up" | "down") => {
    if (!x || !y) {
      return;
    }
    const pointer = viewportCoordsToSceneCoords(
      { clientX: x, clientY: y },
    );

    if (isNaN(pointer.x) || isNaN(pointer.y)) {
      // sometimes the pointer goes off screen
    }

    // this.props.onPointerUpdate?.({
    //   pointer,
    //   button,
    //   pointersMap: gesture.pointers,
    // });
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

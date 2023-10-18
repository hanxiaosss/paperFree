import React from 'react'
import rough from 'roughjs'
import Scene from '../scene/Scene'


class App extends React.Component<any, any> {
  canvas: any = null

  public scene: Scene

  constructor(props: any) {
    super(props)
    this.scene = new Scene()
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
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
      ></canvas>
    )
  }


  componentDidUpdate(prevProps: any, prevState: any) {
  }

  componentDidMount(): void {
    const canvas = document.getElementById('canvas') as any
    console.log(canvas, 'hx')
    const roughCanvas = rough.canvas(canvas as any)
    canvas.addEventListener('pointerdown', (e) => {
      let path: any[] = []
      let isDrawing = true

      canvas.addEventListener('pointermove', drawLine)
      canvas.addEventListener('pointerup', stopDrawing)

      // 设置simplification参数以控制粗细一致性
      const simplification = 2

      function drawLine(e: any) {
        if (!isDrawing) return
        console.log(e, 'hx')

        path.push([e.clientX, e.clientY] as any[])
        // roughCanvas.clear();

        // 使用simplification参数来控制点的密度和线条粗细
        const lineOptions = {
          roughness: 1,
          simplification: 2,
          pressures: [0.5],
          bowing: 1,
          curveFitting: 0.95,
          curveStepCount: 9,
          curveTightness: 0,
          dashGap: -1,
          dashOffset: -1,
          disableMultiStroke: false,
          disableMultiStrokeFill: false,
          fillStyle: 'hachure',
          fillWeight: -1,
          hachureAngle: -41,
          hachureGap: -1,
          maxRandomnessOffset: 2,
          preserveVertices: false,
          seed: 0,
          stroke: '#000',
          strokeWidth: 1,
          zigzagOffset: -1
        }
        // roughCanvas.path(path as any, lineOptions);
        roughCanvas.curve(path, lineOptions)
      }

      function stopDrawing() {
        isDrawing = false
        canvas.removeEventListener('pointermove', drawLine)
        canvas.removeEventListener('pointerup', stopDrawing)
      }
    })
  }

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

/**
 * @flow
 */
import React from 'react'
import type { Size, Position } from './Dragzoom'

type Props = {
  imageElement: HTMLImageElement,
  currentSize: Size,
  actualImageSize: Size,
  containerSize: Size,
  currentPosition: Position,
}

type State = {

}

export default class DragzoomCanvas extends React.Component<Props, State> {
  static isDragCanvas = 1

  canvas: HTMLCanvasElement
  context2D: CanvasRenderingContext2D

  componentDidMount() {
    this.initCanvas()
    
  }

  componentWillReceiveProps(nextProps: Props) {
    this.updataCanvas(nextProps)
  }

  componentWillUnmount() {
    
  }

  initCanvas = () => {
    this.context2D = this.canvas.getContext("2d")
    this.updataCanvas(this.props)
  }

  updataCanvas = (props: Props) => {
    const context2D = this.context2D
    const {
      imageElement,
      containerSize,
      currentSize,
      actualImageSize,
      currentPosition,
    } = props
    this.canvas.width = containerSize.width
    this.canvas.height = containerSize.height
    context2D.clearRect(0, 0, containerSize.width, containerSize.height)
    context2D.drawImage(
      imageElement,
      0,
      0,
      actualImageSize.width,
      actualImageSize.height,
      currentPosition.x, // 图像位置x
      currentPosition.y, // 图像位置y
      currentSize.width,
      currentSize.height
    )
  }
  
  render() {
    return (
      <canvas
        ref={(rn: any) => this.canvas = rn}
        style={{ position: 'absolute', top: '0px', left: '0px' }}>
      </canvas>
    )
  }
}
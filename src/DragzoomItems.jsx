/**
 * @flow
 */
import React from 'react'
import type { Size, Point, Position } from './Dragzoom'

function noop() {}

function isEuqal(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}

type Props = {
  currentPosition: Position,
  actualImageSize: Size,
  currentSize: Size,

  pointsDisabled: boolean,
  onDrag: Function,
  onDragStop: Function,
  getChildPosition: Function,
  getActualPosition: Function,
  childProps: {
    onControlledDrag: Function,
  },
  children: any,
}

type State = {
  controlledPositions: {[string]: Point} // 点位信息
}

export default class DragzoomItems extends React.Component<Props, State> {

  static isDragItems = 1
  static defaultProps = {
    pointsDisabled: false,
  }

  state = {
    controlledPositions: {} // 点位信息
  }

  componentWillMount() {
    const { controlledPositions } = this.state
    React.Children.forEach(this.props.children, (child) => {
      const { key: id, props: childProps } = child
      const { position, offset = { top: 0, left: 0} } = childProps
      controlledPositions[id] = this.calculatePosition({...position, offset})
      controlledPositions[id].id = id
    })
    this.setState({controlledPositions})
  }

  componentWillReceiveProps(nextProps: Props) {
    if( !isEuqal(this.props.currentSize, nextProps.currentSize)) {
      this.onParentSizeChange(this.props, nextProps)
    } else if( !isEuqal(this.props.currentPosition, nextProps.currentPosition) ) {
      this.onParentPositionChange(this.props, nextProps)
    }
  }

  /** 
   * 初始化图片位置跟改变图片位置,父容器大小变化的时候调用, 获取图片跟点位位置
   * @param position 图片的最新位置
   * sclakX,sclaKY 为 图片距离上次移动的距离
   * @tooltip 图片位置为发生更改时也会执行，需要修改
   */
  onParentSizeChange = (props: Props, nextProps: Props) => {
    const lastPosition = props.currentPosition
    const position = nextProps.currentPosition
    const lastSize = props.currentSize
    const newSize = nextProps.currentSize

    const { controlledPositions } = this.state
    const positions = Object.keys(controlledPositions)
    if (positions.length > 0) {
      positions.map(id => {
        // 重新进行偏移，将偏移量加回
        let { x: lastX, y: lastY, offset: { top, left } } = controlledPositions[id]
        lastX += left
        lastY += top
        const scaleX = (lastX - lastPosition.x) / lastSize.width
        const scaleY = (lastY - lastPosition.y) / lastSize.height
        const newX = newSize.width * scaleX + position.x
        const newY = newSize.height * scaleY + position.y
        const newPosition = { x: newX - left, y: newY - top }
        controlledPositions[id] = { ...controlledPositions[id], ...newPosition }
      })
    }
    this.setState({ controlledPositions })
  }

  /** 
   * 父元素位置改变时调用
   * sclakX,sclaKY 为 图片距离上次移动的距离
   * @tooltip 图片位置为发生更改时也会执行，需要修改
   */
  onParentPositionChange = (props: Props, nextProps: Props) => {
    const { controlledPositions } = this.state
    const { currentPosition } = props
    const { currentPosition: newCurrentPosition } = nextProps
    const positions = Object.keys(controlledPositions)
    const sclakX = newCurrentPosition.x - currentPosition.x
    const sclakY = newCurrentPosition.y - currentPosition.y
    positions.map((item) => {
      const { x, y, id } = controlledPositions[item]
      controlledPositions[id] = { ...controlledPositions[item], x: x + sclakX, y: y + sclakY }
    })
    this.setState({ controlledPositions })
  }

  /**
   * 进行点位的坐标偏移，点位初始化时需要进行偏移操作，往后操作的都是偏移后的点，
   * 进行缩放时，减去的偏移量需要重新加回后进行计算
   */
  shiftPoint = (point: Point): Point => {
    const { offset } = point
    const x = point.x - offset.left
    const y = point.y - offset.top
    return { ...point, x, y }
  }

  /**
   * 传入未经计算过的点位信息，返回相对于拖动层的图片位置,带偏移量的点需要进行偏移校正
   * @param point 点位信息
   */
  calculatePosition = (point: Point): Point => {
    const { currentPosition, currentSize, actualImageSize } = this.props
    const { x, y, offset } = this.shiftPoint(point)
    // 当前点位距离图片的长宽（位置）
    const width = point.x
    const height = point.y
    // 图片压缩或者放大后的比例
    const scale = currentSize.width / actualImageSize.width
    const newWidth = width * scale
    const newHeight = height * scale

    const newX = newWidth + currentPosition.x - offset.left
    const newY = newHeight + currentPosition.y - offset.top

    return ({ ...point, x: newX, y: newY })
  }


  
  /** 获取边界值 */
  getboundPosition = (id:string): Point => {
    let outBound = false
    const { currentPosition, currentSize } = this.props
    const { controlledPositions } = this.state
    const { width, height } = currentSize
    const { x: parentX, y: parentY } = currentPosition
    let { x, y, offset: { top, left } } = controlledPositions[id]
    const bounds = { top: parentY - top, left: parentX - left, right: parentX + width - left, bottom: parentY + height - top }
    if(x> bounds.right || x <bounds.left){
      x = x> bounds.right? bounds.right : bounds.left
      outBound = true
    }
    if(y> bounds.bottom || y <bounds.top){
      y = y> bounds.bottom? bounds.bottom : bounds.top
      outBound = true
    }
    if(outBound){
      controlledPositions[id] = { ...controlledPositions[id], x, y }
      this.setState({ controlledPositions })
    }
    return controlledPositions[id]
  }

  /**
   * 控制点位的拖动
   * @param id 点位的key(唯一标识符)
   * @param postition 点位的位置
   */
  onDrag = (id: string, position: Position) => {
    const { controlledPositions } = this.state
    controlledPositions[id] = { ...controlledPositions[id], ...position }
    this.setState({ controlledPositions })
    if(this.props.onDrag) {
      const newPoint = this.getActualPosition(controlledPositions[id])
      this.props.onDrag(newPoint)
    }
  }

  /**
   * 获取到点位的真实坐标
   * @param point 点位信息
   */
  getActualPosition = (point: Point) => {
    const { currentPosition, currentSize, actualImageSize } = this.props
    const { x, y, id, offset } = point
    const width = x - currentPosition.x + offset.left
    const height = y - currentPosition.y + offset.top
    const scale = currentSize.width / actualImageSize.width
    const newWidth = width / scale
    const newHeight = height / scale
    return ({ x: Number(newWidth.toFixed(2)), y: Number(newHeight.toFixed(2)), id })
  }

  onDragStop = (id: string ) => {
    const point = this.getboundPosition(id)
    if(this.props.onDragStop) {
      const newPoint = this.getActualPosition(point)
      this.props.onDragStop(newPoint)
    }
  }

  renderItem = (child: any) => {
    const { key: id, props } = child
    const { controlledPositions } = this.state
    const childProps = {
      id,
      position: controlledPositions[id],
      onDrag: this.onDrag,
      onDragStop: this.onDragStop,
      pointsDisabled: this.props.pointsDisabled,
    }
    return React.cloneElement(child, childProps)
  }

  render() {
    return (
      <div style={{ position: 'absolute', top: '0px', left: '0px', height: '0px' }}>
        {React.Children.map(this.props.children, this.renderItem)}
      </div>
    )
  }
}
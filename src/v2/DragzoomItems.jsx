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
  // pointsDisabled: boolean,
  // onDrag: Function,
  // onDragStop: Function,
  // getChildPosition: Function,
  // getActualPosition: Function,
  // childProps: {
  //   onControlledDrag: Function,
  // },
  containersStyle: Object,
//   v2
  scale: number,
  children: any,
  onDragStart: Function,
  onDragStop: Function,
}

type State = {
  controlledPositions: {[string]: Point} // 点位信息
}

export default class DragzoomItems extends React.Component<Props, State> {

  static isDragItems = "DragzoomItems.V2";
  static defaultProps = {
    pointsDisabled: false,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      controlledPositions: this.resetPosition(props) // 点位信息
    };
  }

  resetPosition = (props: Props) => {
    const controlledPositions  = {};
    React.Children.forEach(props.children, (child) => {
      const { key: id, props: childProps } = child;
      const { position, offset = { top: 0, left: 0} } = childProps;
      controlledPositions[id] = this.calculatePosition({...position, offset}, props);
      controlledPositions[id].id = id
    });
    return controlledPositions;
  };
  componentWillReceiveProps(nextProps: Props) {
    if (this.props.children !== nextProps.children || this.props.scale !== nextProps.scale ) {
      this.setState({ controlledPositions: this.resetPosition(nextProps) })
    }
  }

  /**
   * 传入未经计算过的点位信息，返回相对于拖动层的图片位置,带偏移量的点需要进行偏移校正
   * @param point 点位信息
   * @param props props,包含定位信息
   */
  calculatePosition = (point: Point, props: Props = this.props): Point => {
    const { scale } = props;
    const { x, y, offset } = point;
    const newX = x * scale - offset.left;
    const newY = y * scale - offset.top;
    return ({ offset, x: newX, y: newY });
  };

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
    // console.log(child);
    if(child.type && child.type.isDragzoomItem === "DragzoomItem.V2") {
      const { key: id } = child;
      const { controlledPositions } = this.state;
      const childProps = {
        id,
        position: controlledPositions[id],
        // pointsDisabled: this.props.pointsDisabled,
      };
      return React.cloneElement(child, childProps)
    }
    return null;
  };

  render() {
    const { containersStyle } = this.props;
    return (
      <div className="drag-zoom-items-containers" style={{ ...containersStyle }}>
        {React.Children.map(this.props.children, this.renderItem)}
      </div>
    )
  }
}

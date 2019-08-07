/**
 * @flow
 */
import React from 'react';
import type { Point, Position } from './Type';
import connect from './ContextUtils';
function noop() {}
type Props = {
  style: Object,
  scale: number,
  children: any,
  onDrag: (position: Position, e: Event) => null,
  onDragStop: (position: Position, e: Event ) => null,
  currentSize: { width: number, height: number },
}
type State = {
  controlledPositions: {[string]: Point} // 点位信息
}
class DragZoomItems extends React.Component<Props, State> {

  static isDragItems = "DragzoomItems.V2";
  static defaultProps = {
    onDrag: noop,
    onDragStop: noop,
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
   * 返回新点位坐标
   * @param point 点位信息
   * @param props props,包含定位信息
   */
  calculatePosition = (point: Point, props: Props): Point => {
    const { scale, currentSize } = props;
    const { width, height } = currentSize;
    const { x, y, offset } = point;
    const newX = Math.max(0, Math.min(x*scale, width)) - offset.left;
    const newY = Math.max(0, Math.min(y*scale, height)) * scale - offset.top;
    return ({ offset, x: newX, y: newY });
  };

  /**
   * 控制点位的拖动
   * @param id 点位的key(唯一标识符)
   * @param position 点位的位置
   * @param e 事件对象
   */
  onDrag = (id: string, position: Position, e: Event) => {
    e.stopPropagation();
    if(this.props.onDrag) {
      const { actualPoint } = this.getActualPosition(id, position);
      this.props.onDrag(actualPoint, e);
    }
  };

  /**
   * 获取到点位的真实坐标
   * @param id 拖拽点位id
   * @param point 点位信息
   * @return newPoint 新的点位信息
   * @return actualPoint 真实坐标
   */
  getActualPosition = (id: string, point: Position) => {
    const { controlledPositions } = this.state;
    const { scale } = this.props;
    const { offset, x, y } = controlledPositions[id];
    const newX = point.x + x;
    const newY = point.y + y;
    const actualX = (newX + offset.left) / scale;
    const actualY = (newY + offset.top) / scale;
    return ( {newPoint:{ x: newX, y: newY, id }, actualPoint: { x: actualX, y: actualY, id }});
  };

  onDragStop = (id: string, position: Position, e: Event ) => {
    e.stopPropagation();
    const { newPoint, actualPoint } = this.getActualPosition(id, position);
    const { controlledPositions } = this.state;
    controlledPositions[id] = { ...controlledPositions[id], ...newPoint };
    this.setState({ controlledPositions: { ...controlledPositions }});
    if(this.props.onDragStop) {
      this.props.onDragStop(actualPoint, e);
    }
  };

  renderItem = (child: any) => {
    if(child.type && child.type.isDragzoomItem === "DragzoomItem.V2") {
      const { key: id } = child;
      const { controlledPositions } = this.state;
      const childProps = {
        id,
        position: controlledPositions[id] || {},
        onDragStop: this.onDragStop,
        onDrag: this.onDrag,
      };
      return React.cloneElement(child, childProps)
    }
    return null;
  };

  render() {
    const { style } = this.props;
    return (
      <div className="drag-zoom-items-containers" style={{ ...style, position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}>
        {React.Children.map(this.props.children, this.renderItem)}
      </div>
    )
  }
}

export default connect(DragZoomItems);

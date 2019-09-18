/**
 * @flow
 */
import React from 'react';
import type { Point, Position } from './Type';
import connect from './ContextUtils';
import MarkerCluster from './MarkerCluster';
import Draggable from "react-draggable";
function noop() {}
type Props = {
  style: Object,
  scale: number,
  children: any,
  onDrag: (id: string, position: Position, e: Event) => null,
  onDragStop: (id: string, position: Position, e: Event ) => null,
  currentSize: { width: number, height: number },
  renderClusterMarker?: (markers: Array<Object>) => Object,
  polymerization?: boolean,
  gridSize?: number,
  minClusterSize?: number,
}
type State = {
  controlledPositions: {[string]: Point}, // 点位信息
  clusters: Array,
}
class DragZoomItems extends React.Component<Props, State> {

  static isDragItems = "DragzoomItems.V2";
  static defaultProps = {
    onDrag: noop,
    onDragStop: noop,
    polymerization: true,
    gridSize: 60,
    minClusterSize: 2,
  };
  clusters: Object;
  constructor(props: Props) {
    super(props);
    this.state = this.resetPosition(props); // 点位信息
  }

  resetPosition = (props: Props) => {
    const { polymerization } = props;
    this.clusters && this.clusters.clear();
    this.clusters = new MarkerCluster({ gridSize: props.gridSize, minClusterSize: props.minClusterSize });
    const controlledPositions  = {};
    let clusters = [];
    React.Children.forEach(props.children, (child) => {
      if(child) {
        const { key: id, props: childProps } = child;
        const { position, offset = { top: 0, left: 0} } = childProps;
        const newPosition = this.calculatePosition({...position, offset}, props);
        newPosition.id = id;
        if(polymerization) {
          this.clusters.addMarker(newPosition);
        } else {
          controlledPositions[id] = this.calculatePosition({...position, offset}, props);
        }
        // controlledPositions[id] = this.calculatePosition({...position, offset}, props);
        // controlledPositions[id].id = id
      }
    });
    if(polymerization) {
      // this.clusters && this.clusters.clear();
      // this.clusters = new MarkerCluster({ gridSize: props.gridSize, minClusterSize: props.minClusterSize });
      // this.clusters.addMarker(Object.values(controlledPositions));
      this.clusters.initClusters();
      console.log(this.clusters.clusters);
      this.clusters.points.forEach(point => {
        // console.log(point);
        controlledPositions[point.id] = point;
      });
      clusters = [].concat(this.clusters.clusters);
    }
    return {controlledPositions, clusters };
  };
  componentWillReceiveProps(nextProps: Props) {
    if (this.props.children !== nextProps.children || this.props.scale !== nextProps.scale ) {
      this.setState({ ...this.resetPosition(nextProps) })
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
    const newY = Math.max(0, Math.min(y*scale, height)) - offset.top;
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
      this.props.onDrag(id, actualPoint, e);
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
      this.props.onDragStop(id, actualPoint, e);
    }
  };
  renderChildren = () => {
      const { clusters } = this.state;
      const { renderClusterMarker = this.defaultRenderCluster } = this.props;
    return clusters.map((cluster, i) =>           
            <div className="drag-items-cluster" draggable="false" style={{ position: 'absolute', top: cluster.cluster_y, left: cluster.cluster_x }} key={'cluster_' + i}>
        {renderClusterMarker(cluster.childrens)}
    </div>);
  };
  defaultRenderCluster = (childrens: Array) => {
      return <div>{childrens.length}</div>;
  };
  renderItem = (child: any) => {
    if(child.type && child.type.isDragzoomItem === "DragzoomItem.V2") {
      if(this.props.polymerization) {
        
      }
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

  renderCommonItem = (child: any) => {
    const { key: id } = child;
    const { controlledPositions } = this.state;
    const childProps = {
      id,
      position: controlledPositions[id] || {},
      onDragStop: this.onDragStop,
      onDrag: this.onDrag,
    };
    return React.cloneElement(child, childProps)
  };
  render() {
    const { style } = this.props;
    return (
      <div className="drag-zoom-items-containers" style={{ ...style, position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}>
        {React.Children.map(this.props.children, this.renderItem)}
        {this.renderChildren()}
      </div>
    )
  }
}

export default connect(DragZoomItems);

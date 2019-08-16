/**
 * @flow
 */
import React from 'react'
import type { Size, Path, Shape } from './Type';
import { RECTANGLE, CIRCLE, POLYGON } from './Type';
import connect from './ContextUtils';
type Polygon = {
    id: string,
    path: Path,
    color: Object,
    shape: RECTANGLE| CIRCLE | POLYGON,
    vertex: boolean,
    dash: Array<number>,
    custom: boolean,
}
type Props = {
  controlPaint: (context:CanvasRenderingContext2D ,props:{id:string,path:Path,color:Object,shape:string}) => boolean,
  currentSize: Size,
  children: any,
  style: Object,
  scale: number,
  pathStyle: {
    strokeStyle: string,
    fillStyle: string,
    lineWidth: string,
  },
  vertexStyle: {
    strokeStyle: string,
    fillStyle: string,
    lineWidth: string,
  },
  polygons: Array<Polygon>,
}

type State = {

}

class DragZoomPolygon extends React.Component<Props, State> {
  static Polygon = () => null;
  static isDragCanvasPolygon = "DragzoomPolygon_V2";
  static defaultProps = {
    controlPaint: () => false,
    currentSize: { width: 0, height: 0 },
    style: {},
    scale: 1,
    pathStyle: {
      fillStyle: 'rgba(0, 132, 255, 0.2)',
      strokeStyle: '#4C98FF',
      lineWidth: 2,
    },
    vertexStyle: {
      fillStyle: 'rgb(255,255,255)',
      strokeStyle: 'green',
      lineWidth: 3,
    },
    polygons: [],
  };

  canvasRef: Object;
  constructor(props: Props) {
    super(props);
    this.state = {};
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.redrawCanvas(this.props);
  }

  componentWillReceiveProps(nextProps: Props) {
    if(this.props.polygons !== nextProps.polygons || this.props.scale !== nextProps.scale) { // TODO: 判断有误 会多次更新
      this.redrawCanvas(nextProps);
    }
  }

  renderPolygons = (paths: Array<{ path: Path, shape: Shape, dash: Array<number> }>) => {
    if(!paths.length) {
      return;
    }
    const context2D = this.canvasRef.current.getContext("2d");
    const { pathStyle } = this.props;
    context2D.strokeStyle = pathStyle.strokeStyle;
    context2D.fillStyle = pathStyle.fillStyle;
    context2D.lineWidth = pathStyle.lineWidth;
    const len = paths.length;
    for(let i = 0; i < len; i++) {
      context2D.beginPath();
      const { path, shape, dash = [] } = paths[i];
      context2D.setLineDash(dash);
      switch (shape) {
        case RECTANGLE:
          context2D.rect(path[0][0], path[0][1], path[1][0] - path[0][0], path[1][1] - path[0][1]);
          break;
        case CIRCLE:
          context2D.arc(
              path[0][0],
              path[0][1],
              ~~Math.sqrt(Math.pow(path[1][0] - path[0][0], 2) + Math.pow(path[1][1] - path[0][1], 2)),
              0,
              Math.PI * 2
          );
          break;
        case POLYGON:
          path.forEach((point, index) => {
            const [x, y] = point;
            if (index === 0) context2D.moveTo(x, y);
            else context2D.lineTo(x, y);
            if (path.length === index + 1) context2D.lineTo(path[0][0], path[0][1]);
          });
          break;
        default:
          path.forEach((point, index) => {
            const [x, y] = point;
            if (index === 0) context2D.moveTo(x, y);
            else context2D.lineTo(x, y);
          });
          break;
      }
      context2D.stroke();
      context2D.fill();
      context2D.closePath();
    }
  };

  renderPoint = (paths: Array<Path>) => {
    if(!paths.length) {
      return;
    }
    const context2D = this.canvasRef.current.getContext("2d");
    const { vertexStyle } = this.props;
    context2D.strokeStyle = vertexStyle.strokeStyle;
    context2D.fillStyle = vertexStyle.fillStyle;
    context2D.lineWidth = vertexStyle.lineWidth;
    context2D.setLineDash([]);
    context2D.beginPath();
    paths.forEach(path => {
      path.forEach(point => {
        const [x, y] = point;
        context2D.moveTo(x,y);
        context2D.arc(x,y,3,0,2*Math.PI);
      });
    });
    context2D.closePath();
    context2D.stroke();
    context2D.fill();
  };
  redrawCanvas = (props: Props) => {
    const canvas = this.canvasRef.current;
    if(!canvas) {
      throw(new Error("can't get canvas context"));
    }
    const { currentSize: {width, height}, controlPaint, polygons } = props;
    canvas.width = width;
    canvas.height = height;
    const context2D = canvas.getContext('2d');
    context2D.clearRect(0, 0, width, height);
    const paths = [];
    const points = [];
    polygons.forEach(polygon => {
        const { path: oldPath, color, shape, vertex = true, dash, id, custom } = polygon;
        const path = this.getAllDrawPosition(oldPath, props);
        if(!custom) {
          if(vertex) {
            points.push(path);
          }
          paths.push({ path, shape, dash });
        } else {
          controlPaint(context2D, { id, path, color, shape, vertex, dash });
        }
    });
    this.renderPolygons(paths);
    this.renderPoint(points);
  };
  /** 转换成绘制坐标，取整 */
  getAllDrawPosition = (position: Path, props: Props = this.props) => {
    const { scale, currentSize } = props;
    const { width, height } = currentSize;
    return position.map(([pointX, pointY]) => [Math.max(0, Math.min(~~(pointX * scale), width)), Math.max(0, Math.min(~~(pointY * scale), height))]);
  };
  render() {
    const { style, currentSize } = this.props;
    return (
      <canvas
        ref={this.canvasRef}
        style={{ ...style, position: 'absolute', top: '0px', left: '0px', width: currentSize.width, height: currentSize.height }}>
      </canvas>
    )
  }
}
const WarpComponent = connect(DragZoomPolygon);
WarpComponent.Polygon = DragZoomPolygon.Polygon;
export default WarpComponent;

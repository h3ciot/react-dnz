/**
 * @flow
 */
import React from 'react'
import type { Size, Position, Path } from './Type';
import { offsetXYFromParent } from './utils';
import connect from './ContextUtils';
type Props = {
  capture: boolean,
  onMouseMove: (position: Position, e: Event) => null,
  onDoubleClick: (position: Position, e: Event) => null,
  onClick: (position: Position, e: Event) => null,
  controlPaint: (context:CanvasRenderingContext2D ,props:{id:string,path:Path,color:string,shape:string}) => mixed,
  currentSize: Size,
  children: any,
  scale: number,
}

type State = {

}
// 该组件的使用必须由用户自己控制如何绘制组件
// 用于绘制变化部分
class DragZoomCanvas extends React.Component<Props, State> {
  static isDragCanvas= "DragZoomCanvas_V2";
  static Path = () => null;
  static defaultProps = {
    controlPaint: () => false,
    currentSize: { width: 0, height: 0 },
    scale: 1,
    onMouseMove: () => null,
    onClick: () => null,
    onDoubleClick: () => null,
    capture: false,
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
    // TODO props变更时重新渲染
    if(this.props.children !== nextProps.children || this.props.scale !== nextProps.scale) { // TODO: 判断有误 会多次更新
      this.redrawCanvas(nextProps);
    }
  }

  redrawCanvas = (props: Props) => {
    const canvas = this.canvasRef.current;
    if(!canvas) {
      throw(new Error("can't get canvas context"));
    }
    const { currentSize: {width, height} } = props;
    canvas.width = width;
    canvas.height = height;
    const context2D = canvas.getContext('2d');
    context2D.clearRect(0, 0, width, height);
    React.Children.forEach(props.children, child => {
      if(child && child.type === DragZoomCanvas.Path) {
        let { path, color, shape } = child.props;
        const id = child.key;
        this.props.controlPaint(context2D, {id: child.key, ...child.props, path: this.getAllDrawPosition(path, props)});
      }
    });
  };
  /** 转换成绘制坐标，取整 */
  getAllDrawPosition = (position: Path, props: Props = this.props) => {
    const { scale } = props;
    return position.map(([pointX, pointY]) => [~~(pointX * scale), ~~(pointY * scale)]);
  };
  capture = (e: MouseEvent, cb: Function) => {
    if(this.props.capture && typeof e.button === 'number' && e.button === 0) {
      e.stopPropagation();
      return cb(this.getActualPosition(e), e);
    }
  };
  getActualPosition = (e: MouseEvent) => {
    const { scale } = this.props;
    const { x, y } = offsetXYFromParent(e, this.canvasRef.current.offsetParent);
    return [Math.max(~~(x / scale), 0), Math.max(~~(y / scale),0)];
  };
  render() {
    const { currentSize, capture } = this.props;
    return (
      <canvas
        className="drawCanvas"
        ref={this.canvasRef}
        onMouseDown={e => this.capture(e, () => null)}
        onMouseUp={e => this.capture(e, () => null)}
        onMouseMove={e => this.capture(e, this.props.onMouseMove)}
        onClick={e => this.capture(e, this.props.onClick)}
        onDoubleClick={e => this.capture(e, this.props.onDoubleClick)}
        style={{ position: 'absolute', top: '0px', left: '0px', width: currentSize.width, height: currentSize.height, zIndex: capture ? 1 : undefined }}>
      </canvas>
    )
  }
}
const WarpComponent = connect(DragZoomCanvas);
WarpComponent.Path = DragZoomCanvas.Path;
export default WarpComponent;

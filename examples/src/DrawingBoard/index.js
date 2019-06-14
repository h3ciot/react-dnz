/**
 * @flow
 * @author yangjie kf7216
 */

import React from 'react';
import fetch from 'isomorphic-fetch';
import Dragzoom, { DragzoomPolygon, DragzoomItems, DragzoomItem } from 'react-dnz';
import { message, Spin } from 'antd';
import { getExploreName } from '@alpha/utils/browser';
import './style/index.less';
import { getActualPosition } from '@alpha/utils/mapUtils';
const { Polygon } = DragzoomPolygon;
const DRAWING_POINT = 'point'; // 鼠标点模式
const DRAWING_LINE = 'line'; // 鼠标画线模式
const DRAWING_CIRCLE = 'circle'; // 鼠标画圆模式
const DRAWING_RECTANGLE = 'rectangle'; // 鼠标画矩形模式
const DRAWING_POLYGON = 'polygon'; // 鼠标画多边形模式
const DRAWING_COLOR = 'color'; // 鼠标画多边形模式

function stopRightKey(e) {
  const e1 = e || window.event;
  try {
    e1.preventDefault();
  } catch (e2) {
    // 阻止冒泡
    e2.cancelBubble = true;
    // 阻止触发默认事件
    e2.returnValue = false;
  }
  return false;
}

export {
  DRAWING_POINT,
  DRAWING_LINE,
  DRAWING_CIRCLE,
  DRAWING_RECTANGLE,
  DRAWING_POLYGON,
  DRAWING_COLOR,
};

type Props = {
  drawType: string,
  imgUrl: string,
  dragzoomData: Array<any>,
  pointModel: boolean,
  lineModel: boolean,
  graphData: Array<any>,
  drawable: boolean,
  isClearCurrentPath: boolean,
  getCurrentPoints: Function,
  onDragStop: Function,
  getSVGSize?: Function,
  origin: Object,
  referenceInfo: Object,
  scale: number,
  showCurrentPoint: boolean,
  initScale: number,
  setCenterPoint: boolean,
  showAxis: boolean,
  maxZoom: number,
  gridColor: string,
  showGrid: boolean,
  gridInterval: number,
  onSizeChange: Function,
};

type State = {
  polygonDragDisabled: boolean,
  capture: boolean,
  drawingPath: Array<any>,
  polygonList: Array<any>,
  shape: string,
  actualWidth: number,
  actualHeight: number,
  actualScale: number,
  actualImgUrl: string,
  imgLoading: boolean,
  imagePosition: {
    x: number,
    y: number,
  },
};

class drawingBoard extends React.Component<Props, State> {
  imgLoadingUrl: string;
  static defaultProps = {
    drawType: 'rectangle',
    imgUrl: '',
    dragzoomData: [],
    pointModel: false,
    lineModel: false,
    graphData: [],
    drawable: false,
    showAxis: false,
    isClearCurrentPath: false,
    getCurrentPoints: () => null,
    onDragStop: () => null,
    origin: { x: 0, y: 0 },
    referenceInfo: { x: 0, y: 0 },
    scale: 1,
    showCurrentPoint: false,
    initScale: 1,
    setCenterPoint: false,
    actualImgUrl: '',
    maxZoom: 2,
    gridColor: '#ff0200',
    showGrid: false,
    gridInterval: 0.5,
  };
  imageObject = null;
  canvasInstance = null;
  drawRef = React.createRef();
  dawingContainer = HTMLElement;
  startPosition = null;
  onceDrag = [];
  imgWidth: number = 0;
  imgHeight: number = 0;
  state = {
    polygonDragDisabled: true,
    capture: false,
    drawingPath: [],
    polygonList: [],
    shape: 'rectangle',
    actualHeight: 0,
    actualWidth: 0,
    actualScale: 1,
    imgLoading: false,
    dragOrigin: this.props.origin,
    imagePosition: {
      x: 0,
      y: 0,
    },
  };

  componentWillMount() {
    const { drawable, imgUrl, drawType } = this.props;
    if (drawable) {
      this.setState({ polygonDragDisabled: false, capture: true, shape: drawType });
    }
    if (imgUrl) {
      this.setState({ actualImgUrl: '', imgLoading: true });
      this.imgLoadingUrl = imgUrl;
      this.changeSVGToBase64(imgUrl, url => {
        const img = new Image();
        img.src = url;
        this.imageObject = img;
        img.onload = () => {
          if (imgUrl !== this.imgLoadingUrl) {
            return;
          }
          this.imgWidth = img.width;
          this.imgHeight = img.height;

          this.setState({ imgHeight: img.height, imgWidth: img.width, actualImgUrl: url });
          this.changeImgLoading(imgUrl);
        };
        img.onerror = () => {
          this.changeImgLoading(imgUrl);
        };
      });
    }
  }

  changeImgLoading = url => {
    if (url === this.imgLoadingUrl) {
      this.setState({ imgLoading: false });
    }
  };
  changeSVGToBase64 = (imgUrl, callback) => {
    if (imgUrl === '') {
      this.setState({ imgHeight: 0, imgWidth: 0, actualImgUrl: '', imgLoading: false });
      return;
    }
    if (imgUrl.endsWith('.svg') || imgUrl.endsWith('.SVG')) {
      fetch(imgUrl)
        .then(r => {
          r.blob().then(b => {
            const blob = new Blob([b], { type: 'image/svg+xml' });
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              callback(reader.result);
            });
            reader.readAsDataURL(blob);
          });
        })
        .catch(error => {
          this.changeImgLoading(imgUrl);
          message.error('图片加载失败!', 1.5);
          console.log(error);
        });
    } else {
      setTimeout(() => callback(imgUrl), 0);
    }
  };
  componentDidMount() {
    this.dawingContainer.oncontextmenu = stopRightKey;
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.drawable !== this.props.drawable) {
      if (nextProps.drawable) {
        this.setState({ polygonDragDisabled: false, capture: true });
      } else {
        this.setState({ polygonDragDisabled: true, capture: false });
      }
    }
    if (nextProps.setCenterPoint !== this.props.setCenterPoint) {
      this.setState({ dragOrigin: nextProps.origin });
    }
    if (nextProps.drawType !== this.state.shape) {
      this.onShapeChange(nextProps.drawType);
    }
    if (nextProps.isClearCurrentPath) {
      this.setState({ drawingPath: [], polygonList: [] });
      this.onceDrag = [];
    }
    if (nextProps.imgUrl !== this.props.imgUrl) {
      const imageUrl = nextProps.imgUrl;
      this.setState({ actualImgUrl: '', imgLoading: true });
      this.imgLoadingUrl = imageUrl;
      this.changeSVGToBase64(imageUrl, url => {
        const img = new Image();
        img.src = url;
        this.imageObject = img;
        img.onload = () => {
          if (imageUrl !== this.imgLoadingUrl) {
            return;
          }
          this.imgWidth = img.width;
          this.imgHeight = img.height;
          this.setState({ imgHeight: img.height, imgWidth: img.width, actualImgUrl: url });
          this.changeImgLoading(imageUrl);
        };
        img.onerror = () => {
          this.changeImgLoading(imageUrl);
        };
      });
    }
  }

  // 选择形状
  onShapeChange = shape => {
    this.setState({ shape: shape, drawingPath: [] });
    this.onceDrag = [];
  };
  drawAxis = (
    context,
    imagePosition = this.state.imagePosition,
    actualHeight = this.state.actualHeight,
    actualWidth = this.state.actualWidth
  ) => {
    const { imgHeight, imgWidth } = this.state;
    const actualXScale = actualWidth / imgWidth || 1;
    const actualYScale = actualHeight / imgHeight || 1;
    const { origin, scale, gridInterval, gridColor } = this.props;
    // TODO 实际的间隔距离
    const size = (1 / scale) * gridInterval;
    const left = imagePosition.x;
    const top = imagePosition.y;
    context.strokeStyle = gridColor;
    context.lineWidth = 1;
    context.fillStyle = gridColor;
    context.textAlign = 'center';
    context.save();
    context.beginPath();
    context.arc(
      left + origin.x * actualXScale,
      top + origin.y * actualYScale,
      3,
      0,
      2 * Math.PI,
      false
    );
    context.stroke();
    context.closePath();
    // y
    context.moveTo(left + origin.x * actualXScale, top);
    context.lineTo(left + origin.x * actualXScale, top + actualHeight);
    context.moveTo(left + origin.x * actualXScale, top + actualHeight);
    context.lineTo(left + origin.x * actualXScale - 5, top + actualHeight - 5);
    context.lineTo(left + origin.x * actualXScale + 5, top + actualHeight - 5);
    context.lineTo(left + origin.x * actualXScale, top + actualHeight);
    context.fill();
    // x
    context.moveTo(left, top + origin.y * actualYScale);
    context.lineTo(left + actualWidth, top + origin.y * actualYScale);
    context.moveTo(left + actualWidth, top + origin.y * actualYScale);
    context.lineTo(left + actualWidth - 5, top + origin.y * actualYScale - 5);
    context.lineTo(left + actualWidth - 5, top + origin.y * actualYScale + 5);
    context.lineTo(left + actualWidth, top + origin.y * actualYScale);
    context.fill();
    context.fillStyle = '#000000';
    context.textBaseline = 'alphabetic';
    for (let { x } = origin, i = 0; x <= imgWidth; x += size, i++) {
      context.moveTo(left + x * actualXScale, top);
      context.lineTo(left + x * actualXScale, top + actualHeight);
      context.fillText(i * gridInterval, left + x * actualXScale, top - 2);
    }
    for (let { x } = origin, i = 0; x > 0; x -= size, i--) {
      context.moveTo(left + x * actualXScale, top);
      context.lineTo(left + x * actualXScale, top + actualHeight);
      context.fillText(i * gridInterval, left + x * actualXScale, top - 2);
    }
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    for (let y = origin.y + size, i = 1; y < imgHeight; y += size, i++) {
      context.moveTo(left, top + y * actualYScale);
      context.lineTo(left + actualWidth, top + y * actualYScale);
      context.fillText(i * gridInterval, left, top + y * actualYScale);
    }
    for (let { y } = origin, i = 0; y > 0; y -= size, i--) {
      context.moveTo(left, top + y * actualYScale);
      context.lineTo(left + actualWidth, top + y * actualYScale);
      context.fillText(i * gridInterval, left, top + y * actualYScale);
    }
    context.restore();
  };
  exportMap = (fileName, treePath) => {
    if (!this.imageObject) {
      return false;
    }
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.save();
    context.font = '20px sans-serif';
    const treePathWidth = context.measureText(treePath).width;
    const fontSize = Math.ceil(treePathWidth / this.state.imgWidth);
    const fontHeight = fontSize * 20;
    canvas.width = this.state.imgWidth + 80;
    canvas.height = this.state.imgHeight + 50 + fontHeight;
    context.textBaseline = 'top';
    context.textAlign = 'center';
    context.fillStyle = '#000000';
    const font = context.font;
    context.font = '20px sans-serif';
    for (
      let i = 0, size = Math.ceil(treePath.length / fontSize), x = canvas.width / 2;
      i < fontSize;
      i++
    ) {
      context.fillText(treePath.slice(i * size, size * (i + 1)), x, 20 * i + 5);
    }
    context.font = font;
    context.restore();
    context.drawImage(
      this.imageObject,
      40,
      fontHeight + 25,
      this.state.imgWidth,
      this.state.imgHeight
    );
    this.drawAxis(
      context,
      { x: 40, y: fontHeight + 25 },
      this.state.imgHeight,
      this.state.imgWidth
    );
    context.stroke();
    const fileLink = canvas.toDataURL('image/png');
    const exploreName = getExploreName();
    if (exploreName.indexOf('IE') !== -1) {
      return window.navigator.msSaveBlob(this.base64ToBlob(fileLink), fileName);
    } else {
      const dlLink = document.createElement('a');
      dlLink.hidden = true;
      dlLink.download = fileName;
      dlLink.href = URL.createObjectURL(this.base64ToBlob(fileLink));
      document.body.appendChild(dlLink);
      dlLink.click();
      document.body.removeChild(dlLink);
    }
    return true;
  };
  base64ToBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
  // 图形绘制控制
  controlPaint = (
    context: CanvasRenderingContext2D,
    {
      id,
      path,
      color,
      shape = this.state.shape,
    }: {
      id: string,
      path: Array<[number, number]>,
      color: { strokeColor: string, fillColor: string },
      shape: string,
    }
  ) => {
    const { drawable } = this.props;
    context.strokeStyle = '#4C98FF';
    if (color && color.strokeColor) {
      context.strokeStyle = color.strokeColor;
    }
    context.fillStyle = 'rgba(0, 132, 255, 0.2)';
    if (color && color.fillColor) {
      context.fillStyle = color.fillColor;
    }
    context.lineWidth = 2;
    if (drawable && shape === DRAWING_RECTANGLE && id === 'drawPolygon' && path.length >= 2) {
      context.rect(path[0][0], path[0][1], path[1][0] - path[0][0], path[1][1] - path[0][1]);
      return 1;
    }
    if (shape === DRAWING_CIRCLE && path.length === 2) {
      context.arc(
        path[0][0],
        path[0][1],
        Math.sqrt(Math.pow(path[1][0] - path[0][0], 2) + Math.pow(path[1][1] - path[0][1], 2)),
        0,
        Math.PI * 2
      );
      return 1;
    }
    path.forEach((point, index) => {
      const [x, y] = point;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
      if (path.length === index + 1) context.lineTo(path[0][0], path[0][1]);
    });
    if (path.length === 0 && this.props.showGrid) {
      this.drawAxis(context);
    }
    return 1;
  };

  controlRender = (
    context: CanvasRenderingContext2D,
    {
      id,
      path,
      color,
      shape,
    }: {
      id: string,
      path: Array<[number, number]>,
      color: { strokeColor: string, fillColor: string },
      shape: string,
    }
  ) => {
    if (shape !== DRAWING_CIRCLE) {
      return 0;
    } else {
      context.arc(
        path[0][0],
        path[0][1],
        Math.sqrt(Math.pow(path[1][0] - path[0][0], 2) + Math.pow(path[1][1] - path[0][1], 2)),
        0,
        Math.PI * 2
      );
      return 1;
    }
  };
  // 图形拖动时绘制控制
  dragControlPaint = (
    context: CanvasRenderingContext2D,
    {
      id,
      path,
      color,
    }: {
      id: string,
      path: Array<[number, number]>,
      color: { strokeColor: string, fillColor: string },
    }
  ) => {
    context.strokeStyle = '#4C98FF';
    if (color && color.strokeColor) {
      context.strokeStyle = color.strokeColor;
    }
    context.fillStyle = 'rgba(0, 132, 255, 0.2)';
    if (color && color.fillColor) {
      context.fillStyle = color.fillColor;
    }
    context.lineWidth = 3;
    path.forEach((point, index) => {
      const [x, y] = point;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
      if (path.length === index + 1) context.lineTo(path[0][0], path[0][1]);
    });
    return 1;
  };

  isNotRepeat = (data: Array<any>, point: Array<any>) => {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item[0] === point[0] && item[1] === point[1]) {
        return false;
      }
    }
    return true;
  };

  // 捕获点位
  capturePosition = (p: Array<any>, e) => {
    const { shape, polygonList } = this.state;
    const { pointModel, drawable } = this.props;
    if (drawable && this.dispatchEventToDrag(e)) {
      return;
    }
    if (p[0] < 0) {
      p[0] = 0;
    }
    if (p[1] < 0) {
      p[1] = 0;
    }
    if (p[0] > this.imgWidth) {
      p[0] = this.imgWidth;
    }
    if (p[1] > this.imgHeight) {
      p[1] = this.imgHeight;
    }
    if (this.isNotRepeat(this.onceDrag, p)) {
      if (pointModel) {
        polygonList.push([p]);
        this.setState({ polygonList });
        this.props.getCurrentPoints({
          shape: DRAWING_POINT,
          points: [parseFloat(p[0].toFixed(1)), parseFloat(p[1].toFixed(1))],
          isComplete: true,
        });
        return;
      }
      if (shape === DRAWING_RECTANGLE && this.onceDrag.length === 1) {
        const pp = this.onceDrag[0];
        const arr = [pp, [p[0], pp[1]], p, [pp[0], p[1]]];
        polygonList.push(arr);
        const points = arr.map(item => [
          parseFloat(item[0].toFixed(1)),
          parseFloat(item[1].toFixed(1)),
        ]);
        this.props.getCurrentPoints({ shape, points, isComplete: true });
        this.onceDrag = [];
        this.setState({
          polygonList,
          drawingPath: [],
        });
        return;
      }
      if (shape === DRAWING_CIRCLE && this.onceDrag.length === 1) {
        const pp = this.onceDrag[0];
        const arr = [pp, p];
        polygonList.push(arr);
        const points = arr.map(item => [
          parseFloat(item[0].toFixed(1)),
          parseFloat(item[1].toFixed(1)),
        ]);
        this.props.getCurrentPoints({ shape, points, isComplete: true });
        this.onceDrag = [];
        this.setState({
          shape: DRAWING_CIRCLE,
          polygonList,
          drawingPath: [],
        });
        return;
      }
      this.setState({ drawingPath: [...this.onceDrag, p] });
      this.startPosition = p;
      this.onceDrag.push(p);
      const points = this.onceDrag.map(item => [
        parseFloat(item[0].toFixed(1)),
        parseFloat(item[1].toFixed(1)),
      ]);
      if (this.onceDrag.length >= 20) {
        this.props.getCurrentPoints({ shape, points, isComplete: true });
      } else {
        this.props.getCurrentPoints({ shape, points, isComplete: false });
      }
    }
  };

  startMove = (p: Array<any>, e) => {
    const { drawable } = this.props;
    if (drawable) {
      // console.log('mousemove')
      if (p[1][0] < 0) {
        p[1][0] = 0;
      }
      if (p[1][1] < 0) {
        p[1][1] = 0;
      }
      if (p[1][0] > this.imgWidth) {
        p[1][0] = this.imgWidth;
      }
      if (p[1][1] > this.imgHeight) {
        p[1][1] = this.imgHeight;
      }
      this.setState({ drawingPath: [...this.onceDrag, p[1]], currentPoint: p[1] });
    }
  };

  stopMove = (p: Array<any>, e) => {
    const { drawable } = this.props;
    if (drawable) {
      if (p[0] < 0) {
        p[0] = 0;
      }
      if (p[1] < 0) {
        p[1] = 0;
      }
      if (p[0] > this.imgWidth) {
        p[0] = this.imgWidth;
      }
      if (p[1] > this.imgHeight) {
        p[1] = this.imgHeight;
      }
      this.dispatchEventToDrag(e);
      // if (JSON.stringify(this.startPosition) !== JSON.stringify(p)) {
      //   this.onceDrag.push(p)
      // }
      // console.log('mouseup')
      // this.setState({ drawingPath: this.onceDrag })
    }
  };
  dispatchEventToDrag = e => {
    if (e.button !== 0) {
      const newEvent = new MouseEvent(e.type, e);
      newEvent &&
        this.drawRef.current &&
        this.drawRef.current.dragRef &&
        this.drawRef.current.dragRef.dispatchEvent(newEvent);
      return true;
    }
  };
  generateAxis = () => {
    const { origin, setCenterPoint } = this.props;
    const { actualWidth, actualHeight, imgHeight, imgWidth, dragOrigin } = this.state;
    const actualScale = actualWidth / imgWidth || 1;
    const position = !setCenterPoint ? origin : dragOrigin;
    position.x = position.x ? Math.max(Math.min(position.x, imgWidth || 0), 0) : 0;
    position.y = position.y ? Math.max(Math.min(position.y, imgHeight || 0), 0) : 0;
    return (
      <DragzoomItems key="origin-point-axis" onDrag={this.onAxisDrag} onDragStop={this.onDragStop}>
        <DragzoomItem
          key="origin-point-center"
          position={{ x: position.x, y: position.y }}
          disabled={!setCenterPoint}
        >
          <div className="origin" />
        </DragzoomItem>
        <DragzoomItem key="origin-axis-x-y" position={{ x: 0, y: 0 }} disabled={true}>
          <div
            className="origin-axis axis-y"
            style={{
              width: 1,
              left: position.x * actualScale,
              height: actualHeight,
            }}
          />
          <div
            className="origin-axis axis-x"
            style={{
              width: actualWidth,
              top: position.y * actualScale,
              height: 1,
            }}
          />
        </DragzoomItem>
      </DragzoomItems>
    );
  };
  doubleClick = () => {
    const { drawable, lineModel } = this.props;
    const { shape, polygonList, drawingPath } = this.state;
    if (drawable && shape === DRAWING_POLYGON && !lineModel) {
      let thePath = [];
      if (!drawingPath.length) {
        return false;
      }
      const lastPoint = drawingPath.pop();
      if (this.isNotRepeat(drawingPath, lastPoint)) {
        thePath = [...drawingPath, lastPoint];
      } else {
        thePath = drawingPath;
      }
      if (thePath.length < 3) {
        if (this.isNotRepeat(drawingPath, lastPoint)) {
          drawingPath.push(lastPoint);
        }
        return;
      }
      polygonList.push(thePath);
      const points = thePath.map(item => [
        parseFloat(item[0].toFixed(1)),
        parseFloat(item[1].toFixed(1)),
      ]);
      this.props.getCurrentPoints({ shape, points, isComplete: true });
      this.onceDrag = [];
      this.setState({
        polygonList,
        drawingPath: [],
      });
    }
  };

  onDragStop = (p: Object) => {
    this.props.onDragStop(p);
  };

  onAxisDrag = (p: Object) => {
    const { imgWidth, imgHeight } = this.state;
    const pos = { id: p.id };
    pos.x = p.x > imgWidth ? imgWidth : p.x;
    pos.y = p.y > imgHeight ? imgHeight : p.y;
    this.setState({ dragOrigin: pos });
  };
  // 生成图形数据
  generateGraph = (data: Array<any>) => {
    const PolygonArr = [];
    for (let i = 0; i < data.length; i++) {
      const graph = data[i];
      if (graph.shape === DRAWING_POLYGON || graph.shape === DRAWING_CIRCLE) {
        PolygonArr.push(
          <Polygon
            polygonDrag={graph.draggable}
            key={graph.id}
            id={graph.id}
            path={graph.points}
            color={graph.color}
            shape={graph.shape}
            vertex={graph.shape !== DRAWING_CIRCLE}
          />
        );
      }
    }
    return PolygonArr;
  };

  // 生成点位数据
  generateDragzoom = (data: Array<any>) => {
    const arr = [];
    let key = 'yj';
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      key = `${key}${item.x}${item.y}`;
      arr.push(
        <DragzoomItem
          key={item.id}
          position={{ x: item.x || 0, y: item.y || 0 }}
          offset={item.offset}
          disabled={item.disabled}
        >
          <div
            className="dragzoom-icon"
            style={{
              ...item.style,
              backgroundColor: item.icon ? '' : 'red',
              display: item.hidden ? 'none' : 'block',
              zIndex: item.highLight ? 2 : 1,
            }}
          >
            {item.icon}
          </div>
        </DragzoomItem>
      );
    }
    return (
      <DragzoomItems key={key} pointsDisabled={false} onDragStop={this.onDragStop}>
        {arr}
      </DragzoomItems>
    );
  };
  clearCurrentPath = () => {
    this.onceDrag = [];
    this.setState({
      polygonList: [],
      drawingPath: [],
    });
  };
  onSizeChange = newSize => {
    // console.log(newSize);
    this.setState({
      actualWidth: newSize.width,
      actualHeight: newSize.height,
      imagePosition: newSize.currentPosition,
    });
    this.props.onSizeChange && this.props.onSizeChange(newSize);
  };
  getSVGSize = size => {
    this.imgHeight = size.height;
    this.imgWidth = size.width;
    this.props.getSVGSize && this.props.getSVGSize(size);
    this.setState({ imgHeight: size.height, imgWidth: size.width });
  };
  onDrag = position => {
    this.setState({ imagePosition: position });
  };
  fixContent = (position, placement) => {
    this.drawRef.current &&
      this.drawRef.current.fixContent &&
      this.drawRef.current.fixContent(position, placement);
    this.forceUpdate();
  };
  render() {
    const {
      graphData,
      drawable,
      dragzoomData,
      origin,
      scale,
      referenceInfo,
      showCurrentPoint,
      setCenterPoint,
      initScale,
      showAxis,
    } = this.props;
    const {
      polygonDragDisabled,
      shape,
      capture,
      drawingPath,
      polygonList,
      currentPoint = [0, 0],
      actualImgUrl,
      imgLoading,
    } = this.state;
    const { x, y } = getActualPosition(
      { positionX: currentPoint[0], positionY: currentPoint[1] },
      {
        scale,
        originPointX: origin.x,
        originPointY: origin.y,
        referencePointX: referenceInfo.x,
        referencePointY: referenceInfo.y,
      }
    );
    return (
      <div
        className="drawing-board5200"
        ref={(ele?: Object) => {
          ele ? (this.dawingContainer = ele) : null;
        }}
      >
        <Spin spinning={imgLoading}>
          {drawable &&
            showCurrentPoint && (
              <div className="current-point">
                <i className="iconfont icon-dingwei" />
                {currentPoint && `（X：${x} m, Y：${y} m）`}
              </div>
            )}
          <Dragzoom
            img={actualImgUrl}
            ref={this.drawRef}
            getSVGSize={this.getSVGSize}
            polygonDragDisabled={true}
            controlPaint={this.controlPaint}
            dragControlPaint={this.dragControlPaint}
            initScale={initScale}
            onSizeChange={this.onSizeChange}
            onDrag={this.onDrag}
            onDragStop={this.onDrag}
            allowAnyClickToDrag={true}
            // onPolygonDragStop={this.onPolygonDragStop}
          >
            <DragzoomPolygon
              style={{ zIndex: drawable ? 4 : '' }}
              capture={capture}
              controlPaint={this.controlRender}
              capturePosition={this.capturePosition}
              startMove={this.startMove}
              stopMove={this.stopMove}
              doubleClick={this.doubleClick}
            >
              {this.generateGraph(graphData)}
              {polygonList.map((item, index) => (
                <Polygon key={index + 'drawPolygon'} path={item} />
              ))}
              <Polygon polygonDrag={false} key="drawPolygon" path={drawingPath} shape={shape} />
            </DragzoomPolygon>
            {this.generateDragzoom(dragzoomData)}
            {drawable || setCenterPoint || showAxis ? this.generateAxis() : null}
          </Dragzoom>
        </Spin>
      </div>
    );
  }
}

export default drawingBoard;

/**
 * @flow
 * 拖动变化的核心是拖动的参数，位置的变化全跟拖动参数有关
 */

import React from 'react'
import ReactDOM from 'react-dom'
import Draggable from 'react-draggable'
import DragzoomCanvas from './DragzoomCanvas'
import DragzoomSinglePolygon from './DragzoomSinglePolygon'
import { getinlinePosition, addEvent, removeEvent } from './utils'

function noop() {}
const uninitialSize = { width: 0, height: 0 }

export type typeSize = 'current' | 'lastSize' | 'initSize' | 'actual'
export type Size = { width: number, height: number }
export type Position = { x: number, y: number, }
export type Path = Array<[number,number]>
export type Point = {
  ['id' | 'key']: string, x: number, y: number, offset: {left: number, top: number}
}

type Props = {
  img: string,
  style: HTMLStyleElement,
  onSizeChange: Function,
  onDragStop?: (position: Position) => mixed, //used with points
  onDrag?: (position: Position) => mixed,
  onPolygonDragStop: Function,
  controlPaint: (ctx: CanvasRenderingContext2D, props:{ id: string, path: Path}) => boolean | 0 | 1, // 控制自定义图层的绘画
  dragControlPaint: (ctx: CanvasRenderingContext2D, props:{ id: string, path: Path}) => boolean | 0 | 1, // 控制拖动时自定义图层的绘画
  maxZoom: number,
  children: any,
  polygonDragDisabled: boolean,
  scaleable:boolean,
  draggable:boolean,
  initScale: number,
}

type State = {
  currentSize: Size,
  currentPosition: Position, // 图片的位置
  lastSize: Size,
  dragProps: {position: {x: number, y: number, onStart?: ()=>mixed, onDrag?: ()=>mixed}}, // 传入react-draggable的属性
  childDragProps: {position: {x: number, y: number, onStart?: ()=>mixed, onDrag?: ()=>mixed}},
  canDraggable: boolean, // 能否拖动,
  scaleNum: number, // 缩放比例
  showScaleNum: boolean, // 显示缩放比例
  isPolygonDrag: boolean, // 当前有自定义图形处于拖动状态
}

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

export default class Dragzoom extends React.Component<Props, State> {

  static defaultProps = {
    maxZoom: 2,
    scaleable: true,
    draggable: true,
    polygonDragDisabled: true,
    onSizeChange: noop,
    onPolygonDragStop: noop,
    initScale: 1,
  }
  canvasPolygon: any
  dawingContainer = HTMLElement;
  drag: HTMLElement | null
  childDrag: HTMLDivElement
  imageElement: HTMLImageElement
  containerSize: Size = { ...uninitialSize } // 父容器的大小
  actualImageSize: Size = { ...uninitialSize } //实际图片大小
  initImageSize: Size = { ...uninitialSize } // 初始化的大小
  calculateNum: number = 1 // 实际缩放比例
  initPosition: Position = { x: 0, y: 0 } // 图片初始化的位置
  lastPosition: Position = { x: 0, y: 0 } // 图片上一次位置

  lastScale: {mouseX: number, mouseY: number}  // 鼠标移动后在图片中的位置
  refreshScale: {mouseX: number, mouseY: number} // 缩放后在图片中的位置
  currentPolygonPath: Path = [] // 当前自定义图层路径，计算之后的虚拟路径
  currentPolygon: { id: string, path: Path} = { id: '', path: [] } // 当前自定义图层路径, 真实路径
  constructor(props: Props) {
    super(props)
    this.state = {
      scaleNum: 1,
      showScaleNum: false,
      currentPosition: { x: 0, y: 0},
      currentSize: { ...uninitialSize },
      lastSize : { ...uninitialSize },
      dragProps: { position: { x: 0, y: 0 }, onDrag: this.handleDrag, onStop:this.handleDragStop },
      childDragProps: { position: { x: 0, y: 0 }, onDrag: this.handleChildDrag, onStop:this.handleChildDragStop },
      canDraggable: true,
      isPolygonDrag: false,
    }
  }

  componentWillMount() {
    if (!this.props.draggable) {
      this.setState({
        dragProps:{ ...this.state.dragProps, onDrag: ()=>false }
      })
    }
    this.resetAllData()
  }

  componentDidMount() {
    this.dawingContainer.oncontextmenu = stopRightKey;
    if (this.props.scaleable) { // 缩放
      addEvent(this.drag, 'mouseover', this.addMoveEvent)
      addEvent(window, 'resize', this.onContaninerResize)
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const { img } = this.props
    //切换图片
    if (this.props.img !== nextProps.img) {
      this.resetAllData()
    }
  }

  componentWillUnmount() {
    removeEvent(window, 'resize', this.onContaninerResize)
    this.removeScale()
  }

  addscale = ()=>{
    addEvent(this.drag, 'mouseover', this.addMoveEvent)
    addEvent(window, 'resize', this.onContaninerResize)
  }

  removeScale = ()=>{
    removeEvent(this.drag, 'mouseover', this.addMoveEvent)
    removeEvent(this.drag, 'mousemove', this.bindResize)
    removeEvent(this.drag, 'wheel', this.handleResize)
  }

  addMoveEvent = () => {
    removeEvent(this.drag, 'mouseover', this.addMoveEvent)
    addEvent(this.drag, 'mousemove', this.bindResize, false)
    addEvent(this.drag, 'wheel', this.handleResize)
  }

  bindResize = (e: MouseEvent) => {
    if (this.state.currentSize.width <= 0) {
      return
    }
    // 存储鼠标在元素内的位置
    const mouseX = e.pageX
    const mouseY = e.pageY
    this.lastScale = { mouseX, mouseY }
    this.refreshScale = { mouseX, mouseY }
  }

  /**
   * 重置所有数据，重新初始化
   */
  resetAllData = () => {
    this.actualImageSize = { ...uninitialSize }
    const currentSize = { ...uninitialSize }
    const lastSize = { ...uninitialSize }
    this.setState({ currentSize, lastSize })
  }

  /**
   * 重置图片位置，重新获取大小
   */
  onContaninerResize = () => {
    const isupdate = this.initImage()
    if(isupdate) this.onSizeChange(this.initImageSize, this.initImageSize, this.initPosition)
  }

  /** 处理滚轮事件 */
  handleResize = (e: WheelEvent) => {
    if (e instanceof WheelEvent) {
      e.preventDefault()
    }
    const { width: actualWidth, height: actualHeight } = this.actualImageSize
    const { onSizeChange, maxZoom } = this.props
    const { currentSize, scaleNum, dragProps, isPolygonDrag } = this.state
    const { x, y } = dragProps.position  // 图片相对于容器的位置
    if (actualWidth <= 0 || isPolygonDrag) {
      return
    }
    const scaling = e.deltaY < 0 ? 1.25 : 0.8

    // 当前元素大小
    const lastSize = { ...currentSize }
    // 鼠标在x,y轴中占得比例
    let { mouseX, mouseY } = this.lastScale // 鼠标移动后在图片中的位置
    const { mouseX: lastX, mouseY: lastY } = this.refreshScale  // 缩放后在图片中的位置
    if (mouseX === lastX && mouseY === lastY) { // 鼠标位置已经移动
      const { left, top } = getinlinePosition(this.drag)

      mouseX = Math.max(mouseX - left - x, 0)
      mouseY = Math.max(mouseY - top - y, 0)
    } else {
      mouseX = lastX
      mouseY = lastY
    }

    const scaleX = mouseX / lastSize.width
    const scaleY = mouseY / lastSize.height

    // 超出最大倍数则取消
    const minScale = this.initImageSize.width / actualWidth
    if ((scaleNum >= maxZoom && scaling > 1) || (scaleNum <= (minScale * 0.5) && scaling < 1)) {
      return
    }
    // 变化后的大小
    const newScaleNum = this.calculateScale(scaling*lastSize.width, maxZoom, actualWidth)
    const newSize = { width: actualWidth*newScaleNum, height: actualHeight*newScaleNum }

    // 计算减少或增加的高宽，每次改变大小后所需改变的位置
    const scaleSize = {
      width: newSize.width - lastSize.width,
      height: newSize.height - lastSize.height,
    }
    const position = {
      x: x - scaleSize.width * scaleX,
      y: y - scaleSize.height * scaleY,
    }

    const lastPosition = { ...position }

    // 容器的宽高
    const initWidth = this.containerSize.width
    const initHeight = this.containerSize.height

    // 如果宽高小于父容器的话  就居中
    // 如果宽高大于父容器  但是元素边界在父元素内，则将那边的边界移动到父元素边界
    // ``````
    if (newSize.width <= initWidth) {
      position.x = (initWidth - newSize.width) / 2
    } else if (position.x > 0) {
      position.x = 0
    } else if (position.x < -(newSize.width - initWidth)) {
      position.x = -(newSize.width - initWidth)
    }

    if (newSize.height <= initHeight) {
      position.y = (initHeight - newSize.height) / 2
    } else if (position.y > 0) {
      position.y = 0
    } else if (position.y < -(newSize.height - initHeight)) {
      position.y = -(newSize.height - initHeight)
    }

    const offsetX = lastPosition.x - position.x
    const offsetY = lastPosition.y - position.y

    let canDraggable = false
    if ((offsetX === 0 || offsetY === 0) && scaleNum !== minScale) {
      canDraggable = true
    }
    // 重新计算鼠标在元素内的位置
    this.refreshScale = { mouseX: newSize.width * scaleX + offsetX, mouseY: newSize.height * scaleY + offsetY }

    dragProps.position = position

    if (newSize.height <= 462 && newSize.width <= 842) {
        // dragProps={...dragProps,onStart:()=>false}
    } else if (dragProps.onStart) {
      delete dragProps.onStart
    }
    // ``````
    this.onSizeChange(this.initImageSize, newSize, position)
    this.setState({ currentSize: newSize, lastSize: newSize ,dragProps, canDraggable, scaleNum: newScaleNum, showScaleNum: true })
    setTimeout(() => this.setState({ showScaleNum: false }), 500)
  }

  /**
   * 大小变化，所有对应的点位 位置都要改变
   * @param position 图片的位置
   * currentPosition 初始时为上一次图片的位置
   */
  onSizeChange = (initSize: Size, newSize: Size, position: Position) => {
    this.calculateNum = newSize.width/this.actualImageSize.width
    this.setState({currentSize: newSize, lastSize: newSize, currentPosition: position})
    this.props.onSizeChange(newSize)
  }

  /** 计算图片的缩放值 */
  calculateScale = (width: number, max: number, actualWidth: number, min: number = 0, init: number = 0.33) => {
    const value = Number((width / actualWidth).toFixed(2))
    if (Math.abs(value - max) * 100 < 10 || value > max) { // 最大值
      return max
    }
    if (Math.abs(value - 1) * 100 < 10) { // 图片为100%时候的值
      return 1
    }
    if (min === 0) {
      const { initImageSize } = this
      min = initImageSize.width / actualWidth * 0.5
    }
    return value < min ? min : value
  }

  /** 重置图片 */
  initImage = (actualSize: Size = this.actualImageSize) => {
    const { dragProps, currentSize } = this.state
    const node = ReactDOM.findDOMNode(this.drag)
    if (!node || !(node instanceof HTMLElement)) {
      return false
    }
    const offsetParent: any = this.props.offsetParent || node.offsetParent || node.ownerDocument.body
    if (
      this.containerSize.width === offsetParent.clientWidth &&
      this.containerSize.height === offsetParent.clientHeight &&
      JSON.stringify(currentSize) !== JSON.stringify(uninitialSize)
    ) {
      return false
    }
    this.containerSize = { width: offsetParent.clientWidth || 10, height: offsetParent.clientHeight || 10 }
    // 真实图片的大小
    const { width: actualWidth, height: actualHeight } = actualSize
    let scaleNum, size = {}
    // 如果图片超出父容器
    if (actualWidth > this.containerSize.width || actualHeight > this.containerSize.height) {
      const scaleWidth = actualWidth / this.containerSize.width
      const scaleHeight = actualHeight / this.containerSize.height
      const scaleMax = Math.max(scaleWidth, scaleHeight)
      size.width = actualWidth / scaleMax
      size.height = actualHeight / scaleMax
      scaleNum = this.calculateScale(size.width, 2, actualWidth, this.initImageSize.width / actualWidth)
      // 重置初始大小，将当前大小变成初始大小
    } else {
      size = { ...actualSize }
      scaleNum = 1
    }
    scaleNum *= this.props.initScale;
    size.width *= this.props.initScale;
    size.height *= this.props.initScale;
    this.initImageSize = { ...size }
    // 元素的初始位置
    this.initPosition = {
      x: (this.containerSize.width - size.width) / 2,
      y: (this.containerSize.height - size.height) / 2,
    }
    // this.currentPosition = {...this.initPosition}
    dragProps.position = { ...this.initPosition }
    const newState = {
      dragProps,
      currentSize: { ...size },
      currentPosition: { ...this.initPosition },
      lastSize: { ...size },
      scaleNum,
      canDraggable: false
    }
    if (this.state.lastSize && this.state.lastSize.width !== 0) delete newState.lastSize
    this.setState(newState)
    this.calculateNum = size.width/this.actualImageSize.width
    return true
  }

  /**
   * 重置图片跟点位位置
   * @param actualSize 图片真实大小
   * @return initSize newSize position --在父元素中的初始位置, 其中initSize = newSize
   */
  init = (actualSize: Size = this.actualImageSize) => {
    const isupdate = this.initImage()
    // 获取图片在屏幕中的位置
    // this.containerPosition = getinlinePosition(this.drag)
    if(isupdate) this.onSizeChange(this.initImageSize, this.initImageSize, this.initPosition)
  }

  dataURLtoBlob = (dataurl: string) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  imageOnLoad = (e: Event, img: string) => {
    const index = img.lastIndexOf('.');
    const ext = img.substr(index + 1);
    const index2 = img.lastIndexOf('/');
    const ext2 = img.substr(index2 + 1, 3);
    const { target } = e;

    if (target instanceof HTMLImageElement) {
      const { naturalWidth, naturalHeight } = target
      let actualSize = { width: naturalWidth, height: naturalHeight }
      if (ext2 === 'svg' || ext2 === 'SVG') {
        const reader = new FileReader();
        reader.readAsText(this.dataURLtoBlob(img));
        reader.onload= () => {
          const result = reader.result.toString()
          const parser = new DOMParser();
          const doc = parser.parseFromString(result, "image/svg+xml");

          if (doc.rootElement) {
            const viewBox = doc.rootElement.getAttribute('viewBox');
            if (viewBox) {
              const sizeArr = viewBox.split(' ');
              const sizeArr2 = viewBox.split(',');
              if (sizeArr2.length === 4) {
                actualSize = { width: parseInt(sizeArr2[2] - sizeArr2[0]), height: parseInt(sizeArr2[3] - sizeArr2[1]) }
              } else if (sizeArr.length >= 4) {
                const arr = sizeArr.filter((item) => item !== '');
                if (arr.length === 4) {
                  actualSize = { width: parseInt(arr[2] - arr[0]), height: parseInt(arr[3] - arr[1]) }
                }
              }
            }
          }
          this.actualImageSize = actualSize
          this.init()
        }
      } else {
        this.actualImageSize = actualSize
        this.init()
      }
    }
  }


  /*******************************************/
    /****** 图层移动和点位拖动开始 ******/
  /*******************************************/


  /** 开始容器拖拽, 同时改变上面的点， 此时不能停止更新 */
  handleDrag = (e: Event, ui: Object) => {
    if (this.actualImageSize.width <= 0) {
      return
    }
    const { dragProps } = this.state
    const { x, y } = ui
    dragProps.position = { x, y }
    this.setState({ dragProps, currentPosition: { x, y } })
    this.props.onDrag && this.props.onDrag({x, y})
  }

  /** 父容器拖拽停止 */
  handleDragStop = (e: Event, ui: Object) => {
    if (this.actualImageSize.width <= 0) {
      return
    }
    const { currentSize, dragProps } = this.state
    const { x, y, deltaX, deltaY } = ui
    let left = x, top = y, position
    // this.changePosition({x,y})
    const initWidth = this.containerSize.width
    const initHeight = this.containerSize.height

    // 拖动块的宽高跟parent宽高的差值,
    /** TODO:下面的函数纯粹为了dragstop的时候可以有重置的位置，可以改成非state */
    const width = currentSize.width - initWidth
    const height = currentSize.height - initHeight
    if (currentSize.width > initWidth) { // x超出父元素
      if (x >= 0) { left = 0 }
      if (x < -width) { left = -width }
    } else { left = (initWidth - currentSize.width) / 2 }

    if (currentSize.height > initHeight) { // y超出父元素
      if (y >= 0) { top = 0 }
      if (y < -height) { top = -height }
    } else { top = (initHeight - currentSize.height) / 2 }
    dragProps.position = { x: left, y: top }
    this.setState({ dragProps, currentPosition: { x: left, y: top } })
    this.props.onDragStop && this.props.onDragStop({x, y})
  }

  /*******************************************/
      /****** 图层移动和点位拖动结束 ******/
  /*******************************************/



  /*******************************************/
      /****** 自定义图层操作函数开始 ******/
  /*******************************************/


  /** 自定义图层拖动开始 path为真实路径 */
  onPolygonDragStart = (id: string, path: Path, e: MouseEvent) => {
    const { childDragProps } = this.state
    childDragProps.position = {...this.state.currentPosition}
    this.currentPolygon = {id, path}
    this.canvasPolygon.setShouldUpdate(false)
    const event = new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: e.clientX,
      clientY: e.clientY,
    })
    this.setState({ isPolygonDrag: true, childDragProps }, () => this.childDrag.dispatchEvent(event))
  }

  /** 自定义图层拖拽 */
  handleChildDrag = (e: Event, ui: Object) => {
    if (this.actualImageSize.width <= 0) return
    const { childDragProps } = this.state
    const { x, y } = ui
    childDragProps.position = { x, y }
    this.setState({ childDragProps })
  }

  /** 自定义图层拖动停止 */
  handleChildDragStop = (e: Event, ui: Object) => {
    const path = this.getAllActualPosition(this.currentPolygonPath)
    this.onPolygonDragStop({path, id: this.currentPolygon.id})
  }

  /** 自定义图层拖动结束 path为真实路径 */
  onPolygonDragStop = ({id, path}: { id: string, path: Path}) => {
    // 这里的setState是同步的
    this.canvasPolygon.setShouldUpdate(true)
    this.currentPolygon.path = this.props.onPolygonDragStop({id, path}) || path
    // 传入更新后的path
    this.setState({ isPolygonDrag: false })
    this.currentPolygon = { id: '', path: []}
    this.currentPolygonPath = []
  }

  /** 转换成真实坐标 */
  getAllActualPosition = (position: Path) => {
    const { currentPosition: {x ,y} } = this.state
    const scale = this.calculateNum
    return position.map(([pointX, pointY]) => [(pointX-x)/scale, (pointY-y)/scale])
  }

  /** 真实坐标转换成虚拟坐标 */
  calculateAllPosition = (position: Path, currentPosition: Position = this.state.currentPosition) => {
    const {x, y} = currentPosition
    const scale = this.calculateNum
    return position.map(([pointX, pointY]) => [pointX*scale+x, pointY*scale+y])
  }

  /** 拖动自定义图层时的回调函数，用于保存拖动的路径 */
  savePolygonPath = (path: Path) => {
    this.currentPolygonPath = path
  }


  /*******************************************/
      /****** 自定义图层操作函数结束 ******/
  /*******************************************/


  /** render 自定义拖拽图层 */
  renderDragCanvasPolygon = (child: any) => {
    const { width, height } = this.state.currentSize
    if (width === 0 || height === 0) { return }
    if (child && child.type && child.type.isDragCanvasPolygon) {
      const canvasProps = {
        containerSize: this.containerSize,
        controlPaint: this.props.dragControlPaint,
        currentPosition: this.state.childDragProps.position, // 拖动位置的控制
        calculateAllPosition: this.calculateAllPosition,
        ...this.currentPolygon,
        savePolygonPath: this.savePolygonPath,
      }
      return <DragzoomSinglePolygon {...canvasProps} />
    }
  }

  /** render 自定义图层 */
  renderCanvasPolygon = (child: any) => {
    const { width, height } = this.state.currentSize
    if (width === 0 || height === 0) { return }
    if (child && child.type && child.type.isDragCanvasPolygon) {
      let canvasProps = {
        controlPaint: this.props.controlPaint,
        currentSize: this.state.currentSize,
        actualImageSize: this.actualImageSize,
        containerSize: this.containerSize,
        currentPosition: this.state.currentPosition,
        calculateAllPosition: this.calculateAllPosition,
        onPolygonDragStart: this.onPolygonDragStart,
        getAllActualPosition: this.getAllActualPosition,
        ref: (rn: any) => this.canvasPolygon = rn
      }
      if(!this.state.isPolygonDrag) { // 如果不处于拖动状态, 把更新后的值传入， 覆盖已拖动的图层值
        this.canvasPolygon && this.canvasPolygon.setPolygon(this.currentPolygon)
      }
      return React.cloneElement(child, canvasProps)
    }
  }

  /** render 普通拖动点位 */
  renderCommonItem = (child: any) => {
    const { width, height } = this.state.currentSize
    if (width === 0 || height === 0) { return }
    if (child && child.type && child.type.isDragItems) {
      const props = {
        currentPosition: this.state.currentPosition,
        actualImageSize: this.actualImageSize,
        currentSize: this.state.currentSize,
      }
      return React.cloneElement(child, props)
    }
  }

  renderCanvas = () => {
    const { width, height } = this.state.currentSize
    if (width === 0 || height === 0) return
    const canvasProps = {
      imageElement: this.imageElement,
      currentSize: this.state.currentSize,
      actualImageSize: this.actualImageSize,
      containerSize: this.containerSize,
      currentPosition: this.state.currentPosition,
    }
    return <DragzoomCanvas {...canvasProps} />
  }

  render() {
    const { img, polygonDragDisabled } = this.props
    const {
      dragProps,
      canDraggable,
      currentSize: { width, height },
      scaleNum,
      showScaleNum,
      isPolygonDrag,
    } = this.state
    const newStyle = {
      width: `${width}px`,
      height: `${height}px`,
      cursor: canDraggable ? 'move' : 'auto',
    }
    const showScale = (scaleNum * 100).toFixed(0)
    return (
      <div ref={(ele?: Object) => { ele ? this.dawingContainer = ele : null }} className="dragzoom" id="dragzoom" style={{ position: 'relative', ...this.props.style }} >
        <img ref={(rn: any) => this.imageElement = rn} src={img} onLoad={(e) => this.imageOnLoad(e, img)} style={{display: 'none'}} />
        <div className="drag-wrap" ref={ rn => this.drag = rn} style={{ height: '100%', width: '100%', position: 'relative' }}>
          {this.renderCanvas()}
          {React.Children.map(this.props.children, this.renderCanvasPolygon)}
          {polygonDragDisabled? <Draggable {...dragProps}><div style={newStyle} /></Draggable> :null}
          {isPolygonDrag? React.Children.map(this.props.children, this.renderDragCanvasPolygon) : null}
          <Draggable {...this.state.childDragProps}><div ref={(rn: any) => this.childDrag = rn} style={{...newStyle, display: isPolygonDrag? 'block':'none'}} /></Draggable>
          {React.Children.map(this.props.children, this.renderCommonItem)}
          {showScaleNum ? <span className="scaleNum">{`${showScale}%`}</span> : null}
        </div>
      </div>
    )
  }
}

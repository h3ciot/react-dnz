/**
 * @author lpf
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom';
import Draggable from 'react-draggable';
import { getinlinePosition, addEvent, removeEvent } from '../utils'
import { getSvgSize } from "./utils";
import './index.less';
function noop() {}
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
type DraggableEventHandler = (e: Event, data: DraggableData) => void | false;
type DraggableData = {
    node: HTMLElement,
    // lastX + deltaX === x
    x: number, y: number,
    deltaX: number, deltaY: number,
    lastX: number, lastY: number
};
export type typeSize = 'current' | 'lastSize' | 'initSize' | 'actual'
export type Size = { width: number, height: number }
export type Position = { x: number, y: number, }
export type Path = Array<[number,number]>
export type Point = {
    ['id' | 'key']: string, x: number, y: number, offset: {left: number, top: number}
}
export type placement = 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom'
type Props = {
    onDragStop?: (position: Position) => mixed, //used with points
    onDrag?: (position: Position) => mixed,
    onPolygonDragStop: Function,
    controlPaint: (ctx: CanvasRenderingContext2D, props:{ id: string, path: Path}) => boolean | 0 | 1, // 控制自定义图层的绘画
    dragControlPaint: (ctx: CanvasRenderingContext2D, props:{ id: string, path: Path}) => boolean | 0 | 1, // 控制拖动时自定义图层的绘画
    getSVGSize?: (size: Size) => mixed,

    children: any,
    polygonDragDisabled: boolean,

//    v2
    img: string,
    style: HTMLStyleElement,
    onSizeChange: (imgSize: Size, scale: number) => mixed,
    scalable:boolean,
    draggable:boolean,
    allowAnyClick: boolean,
    maxScale: number,
}

type State = {
//    v2
    imgSize: Size, // 图片初始大小
    currentSize: Size, // 图片显示大小
    position: Position, // 图片当前定位
    containerSize: Size, // 容器大小
    scale: number, // 缩放比例
    showScale: boolean, // 显示缩放比例
    imgLoading: boolean, // 图片加载状态
    dragPosition: Position, // 受控拖动位置
    childDrag: boolean, // 子元素是否拖动
}

export default class Dragzoom extends React.Component<Props, State> {
    imgRef: Object; // 图片对象
    containerRef: Object; // 容器对象
    clearScaleShowTimer: TimeoutID; // 关闭缩放显示定时器
    static defaultProps = {
        maxScale: 2,
        scalable: true,
        draggable: true,
        polygonDragDisabled: true,
        onSizeChange: noop,
        onPolygonDragStop: noop,
        scale: 1,
        onDragStop: noop,
        onDrag: noop,
        controlPaint: noop, // 控制自定义图层的绘画
        dragControlPaint: noop, // 控制拖动时自定义图层的绘画
        allowAnyClick: false,
    };
    constructor(props: Props) {
        super(props);
        this.state = {
            imgSize: { width: 0, height: 0},
            currentSize: { width: 0, height: 0},
            position: { x: 0, y: 0},
            containerSize: { width: 0, height: 0},
            scale: 1,
            showScale: false,
            imgLoading: false,
            dragPosition: { x: 0, y: 0 },
        };
        this.imgRef = React.createRef();
        this.containerRef = React.createRef();
    }

    componentDidMount() {
        if(this.containerRef.current) {
            const { width, height } = this.containerRef.current.getBoundingClientRect();
            this.setState({ containerSize: { width, height }});
        //    TODO 增加resize监听
        }
        addEvent(window, 'resize', this.onResize);
        // this.dawingContainer.oncontextmenu = stopRightKey;
        // if (this.props.scaleable) { // 缩放
        //     addEvent(this.drag, 'mouseover', this.addMoveEvent)
        //     addEvent(window, 'resize', this.onContaninerResize)
        // }
    }

    componentWillReceiveProps(nextProps: Props) {}

    componentWillUnmount() {
        removeEvent(window, 'resize', this.onResize);
        this.removeScale()
    }

    imgLoad = (e: Event) => {
        const { src } = this.imgRef.current;
        if(src !== this.props.img) {
            return;
        }
        this.setState({ imgLoading: true, dragPosition: { x: 0, y: 0} });
        const isSvg = src.endsWith('.svg') || src.endsWith('.SVG') || src.indexOf('data:image/svg+xml;') === 0;
        const { target } = e;
        if (target instanceof HTMLImageElement) {
            const { naturalWidth, naturalHeight } = target;
            const actualSize = { width: naturalWidth, height: naturalHeight };
            if (isSvg && (!naturalHeight || !naturalHeight)) {
                getSvgSize(src, this.setImgSize);
            }
            else {
                setTimeout(() => this.setImgSize(null, src, actualSize ));
            }
        }
    };

    setImgSize = (err: Object | null, url: string, size: Size) => {
        if(url !== this.props.img) {
            return false;
        }
        if(err) {
            console.log(err);
            this.setState({ imgSize: { width: 0, height: 0 }, imgLoading: false });
        } else {
            this.setState({ imgSize: size, imgLoading: false });
        }
        this.resetPosition(size);
    };
    onResize = () => {
        if(this.containerRef.current) {
            const { width, height } = this.containerRef.current.getBoundingClientRect();
            this.setState({ containerSize: { width, height }}, this.resetPosition);
        }
    };
    onWheel = (e: WheelEvent) => {
        if(!this.props.scalable) {
            return false;
        }
        if (e instanceof WheelEvent) {
            e.preventDefault()
        }
        const { scale: oldScale, containerSize, imgSize } = this.state;
        const scale = ~~(oldScale * 100 + 10 * (e.deltaY > 0 ? 1 : -1)) / 100;
        if(scale <= 0 || scale > this.props.maxScale) {
            return false;
        }
        const currentSize = { width: 0, height: 0 };
        currentSize.width = imgSize.width * scale;
        currentSize.height =  imgSize.height * scale;
        const position = { x: 0, y: 0 };
        position.x = (containerSize.width - currentSize.width) / 2;
        position.y = (containerSize.height - currentSize.height) / 2;
        this.setState({ showScale: true, scale, position, currentSize, dragPosition: { x: 0, y: 0} });
        if(this.clearScaleShowTimer) {
            clearTimeout(this.clearScaleShowTimer);
        }
        this.clearScaleShowTimer = setTimeout(() => this.setState({ showScale: false }), 500);
    };
    resetPosition = (imgSize: Size = this.state.imgSize) => {
        const { containerSize: { width, height } = {} } = this.state;
        let scale = 1;
        const position = { x: 0, y: 0 };
        const currentSize = { ...imgSize };
        if(imgSize.width < width && imgSize.height < height ) {
            position.x = (width - imgSize.width) / 2;
            position.y = (height - imgSize.height) / 2;
        } else {
            scale = Math.min(width / imgSize.width, height / imgSize.height);
            currentSize.width = imgSize.width * scale;
            currentSize.height =  imgSize.height * scale;
            position.x = (width - currentSize.width) / 2;
            position.y = (height - currentSize.height) / 2;
        }
        this.setState({ scale, position, currentSize });
    };
    onDragStop = (e: Event, data: DraggableData) => {
        console.log('stop');
        this.setState({ dragPosition: { x: data.x, y: data.y }});
    };
    renderCommonItem = (child: any, index) => {
        const { width, height } = this.state.currentSize;
        if (width === 0 || height === 0) { return null }
        console.log(child);
        if (child && child.type && child.type.isDragItems === "DragzoomItems.V2") {
            const props = {
                key: index,
                scale: this.state.scale,
            };
            return React.cloneElement(child, props);
        }
    };
    handekl = e => {
        e.persist();console.log(e);
    };
    render(){
        const { img, allowAnyClick, draggable, style } = this.props;
        const { scale, currentSize: { width, height } = {}, position: { x, y } = {}, showScale, dragPosition, childDrag } = this.state;
        console.log(this.state);
        const boundY = y+height -10;
        const boundX = x + width -10;
        return (
            <div ref={this.containerRef} className="drag-zoom-containers" style={style} onWheel={this.onWheel} onContextMenu={stopRightKey}>
                <Draggable position={dragPosition} onStart={this.handekl} onStop={this.onDragStop} allowAnyClick={allowAnyClick} disabled={!draggable || childDrag} bounds={{ left: -boundX, right: boundX, top: -boundY, bottom: boundY }}>
                    <div className="drag-warp" style={{ width, height, left: x, top: y }}>
                        <img className="img-container" draggable="false" ref={this.imgRef} src={img} onLoad={this.imgLoad} />
                        {React.Children.map(this.props.children, this.renderCommonItem)}
                    </div>
                </Draggable>
                {showScale ? <span className="scale-num">{`${(scale * 100).toFixed(0)}%`}</span> : null}
            </div>
        )
    }
}

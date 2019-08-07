/**
 * @author lpf
 * @flow
 */

import React from 'react';
import Draggable from 'react-draggable';
import { addEvent, removeEvent } from '../utils'
import { getSvgSize } from "./utils";
import { Size, Position, Placement, DraggableData } from './Type';
import './index.css';
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
type Props = {
    children: any,
    img: string,
    style: HTMLStyleElement,
    onSizeChange: (imgSize: Size, scale: number, loading: boolean) => mixed,
    onDragStop: (e:Event, position: {x: number, y: number }) => null,
    scalable:boolean,
    draggable:boolean,
    allowAnyClick: boolean,
    maxScale: number,
}

type State = {
    imgSize: Size, // 图片初始大小
    currentSize: Size, // 图片显示大小
    position: Position, // 图片当前定位
    containerSize: Size, // 容器大小
    scale: number, // 缩放比例
    showScale: boolean, // 显示缩放比例
    dragPosition: Position, // 受控拖动位置
}
import { CurrentSizeContext } from './ContextUtils';
export default class DragZoom extends React.Component<Props, State> {
    imgRef: Object; // 图片对象
    containerRef: Object; // 容器对象
    clearScaleShowTimer: TimeoutID; // 关闭缩放显示定时器
    static defaultProps = {
        maxScale: 2,
        scalable: true,
        draggable: true,
        onSizeChange: noop,
        allowAnyClick: false,
        onDragStop: noop,
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
            dragPosition: { x: 0, y: 0 },
        };
        this.imgRef = React.createRef();
        this.containerRef = React.createRef();
    }

    componentDidMount() {
        if(this.containerRef.current) {
            const { width, height } = this.containerRef.current.getBoundingClientRect();
            this.setState({ containerSize: { width, height }});
        }
        addEvent(window, 'resize', this.onResize);
    }

    componentWillReceiveProps(nextProps: Props) {
        if(nextProps.img !== this.props.img) {
            this.props.onSizeChange({ width: 0, height: 0}, 1, true);
            this.setState({
                imgSize: { width: 0, height: 0},
                currentSize: { width: 0, height: 0},
                position: { x: 0, y: 0}, scale: 1 });
        }
    }

    componentWillUnmount() {
        removeEvent(window, 'resize', this.onResize);
    }

    fixContent(position: { x: number, y: number, width: number, height: number, offset: { top: number, left: number } }, placement: Placement) {
        if(!this.containerRef.current) {
            return false;
        }
        const { x, y, width, height, offset } = position;
        const rect = this.containerRef.current.getBoundingClientRect();
        const { position: imgPosition, dragPosition, scale } = this.state;
        const { x: positionX, y: positionY } = imgPosition;
        const offsetX = positionX + dragPosition.x, offsetY = positionY + dragPosition.y;
        const leftMargin = x * scale + offsetX - offset.left,
            topMargin = y * scale + offsetY - offset.top,
            rightMargin = rect.width - leftMargin,
            bottomMargin = rect.height - topMargin;
        const newOffset = { x: dragPosition.x, y: dragPosition.y };
        switch (placement) {
            case "left":
                if (leftMargin < width) {
                    newOffset.x += width - leftMargin;
                }
                if (topMargin < height / 2) {
                    newOffset.y += height / 2  - topMargin;
                } else if (bottomMargin < height / 2) {
                    newOffset.y -= height / 2 - bottomMargin;
                }
                break;
            case "leftBottom":
                if (leftMargin < width) {
                    newOffset.x += width - leftMargin
                }
                if (topMargin < height) {
                    newOffset.y += height - topMargin
                }
                break;
            case "leftTop":
                if (leftMargin < width) {
                    newOffset.x += width - leftMargin
                }
                if (bottomMargin < height) {
                    newOffset.y -= height - bottomMargin
                }
                break;
            case "right":
                if (rightMargin < width) {
                    newOffset.x -= width - rightMargin
                }
                if (topMargin < height / 2) {
                    newOffset.y += height / 2  - topMargin;
                } else if (bottomMargin < height / 2) {
                    newOffset.y -= height / 2 - bottomMargin;
                }
                break;
            case "rightBottom":
                if (rightMargin < width) {
                    newOffset.x -= width - rightMargin
                }
                if (topMargin < height) {
                    newOffset.y += height - topMargin
                }
                break;
            case "rightTop":
                if (rightMargin < width) {
                    newOffset.x -= width - rightMargin
                }
                if (bottomMargin < height) {
                    newOffset.y -= height - bottomMargin
                }
                break;
            case "top":
                if (topMargin < height) {
                    newOffset.y += height - topMargin
                }
                if (leftMargin < width / 2) {
                    newOffset.x += width / 2  - leftMargin;
                } else if (rightMargin < width / 2) {
                    newOffset.x -= width / 2 - rightMargin;
                }
                break;
            case "topLeft":
                if (topMargin < height) {
                    newOffset.y += height - topMargin
                }
                if (rightMargin < width) {
                    newOffset.x -= width - rightMargin
                }
                break;
            case "topRight":
                if (topMargin < height) {
                    newOffset.y += height - topMargin
                }
                if (leftMargin < width) {
                    newOffset.x += width - leftMargin
                }
                break;
            case "bottom":
                if (bottomMargin < height) {
                    newOffset.y -= height - bottomMargin
                }
                if (leftMargin < width / 2) {
                    newOffset.x += width / 2  - leftMargin;
                } else if (rightMargin < width / 2) {
                    newOffset.x -= width / 2 - rightMargin;
                }
                break;
            case "bottomLeft":
                if (bottomMargin < height) {
                    newOffset.y -= height - bottomMargin
                }
                if (rightMargin < width) {
                    newOffset.x -= width - rightMargin
                }
                break;
            case "bottomRight":
                if (bottomMargin < height) {
                    newOffset.y -= height - bottomMargin
                }
                if (leftMargin < width) {
                    newOffset.x += width - leftMargin
                }
                break;
            default:
                break;
        }
        this.setState({ dragPosition: newOffset });
    }
    imgLoad = (e: Event) => {
        const { src } = this.imgRef.current;
        if(src !== this.props.img) {
            return;
        }
        this.props.onSizeChange({ width: 0, height: 0}, 1, true);
        this.setState({ dragPosition: { x: 0, y: 0} });
        const isSvg = src.endsWith('.svg') || src.endsWith('.SVG') || src.indexOf('data:image/svg+xml;') === 0;
        const { target } = e;
        if (target instanceof HTMLImageElement) {
            const { naturalWidth, naturalHeight } = target;
            const actualSize = { width: naturalWidth, height: naturalHeight };
            if (isSvg && (!naturalHeight || !naturalHeight)) {
                getSvgSize(src, this.setImgSize);
            }
            else {
                setTimeout(() =>  this.setImgSize(null, src, actualSize ));
            }
        }
    };

    setImgSize = (err: Object | null, url: string, size: Size) => {
        if(url !== this.props.img) {
            return false;
        }
        if(err) {
            console.log(err);
            this.setState({ imgSize: { width: 0, height: 0 } });
        } else {
            this.setState({ imgSize: size });
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
        if(!imgSize.width || !imgSize.height) {
            return false;
        }
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
        this.props.onSizeChange(imgSize, scale, false);
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
        this.props.onSizeChange(imgSize, scale, false);
    };
    onDragStop = (e: Event, data: DraggableData) => {
        this.setState({ dragPosition: { x: data.x, y: data.y }});
        this.props.onDragStop(e, { x: data.x, y: data.y });
    };
    render(){
        const { img, allowAnyClick, draggable, style } = this.props;
        const { scale, currentSize, position: { x, y } = {}, showScale, dragPosition } = this.state;
        const { width, height } = currentSize;
        const boundY = y+height -10;
        const boundX = x + width -10;
        return (
            <CurrentSizeContext.Provider value={{ currentSize, scale}}>
                <div ref={this.containerRef} className="drag-zoom-containers" style={style} onWheel={this.onWheel} onContextMenu={stopRightKey}>
                    <Draggable position={dragPosition} onStop={this.onDragStop} allowAnyClick={allowAnyClick} disabled={!draggable} bounds={{ left: -boundX, right: boundX, top: -boundY, bottom: boundY }}>
                        <div className="drag-warp" style={{ width, height, left: x, top: y }}>
                            <img className="img-container" draggable="false" ref={this.imgRef} src={img} onLoad={this.imgLoad} alt=""/>
                            {currentSize.width && currentSize.height ? this.props.children : null}
                        </div>
                    </Draggable>
                    {showScale ? <span className="scale-num">{`${(scale * 100).toFixed(0)}%`}</span> : null}
                </div>
            </CurrentSizeContext.Provider>
        )
    }
}

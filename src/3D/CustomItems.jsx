/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';

type Props = {
    // 容器尺寸
    containerSize: {
        width: number,
        height: number,
    },
    // 场景大小
    sceneSize: {
        width: number,
        height: number,
    },
    // 偏移量
    offset: {
        x: number,
        y: number,
    },
    zoom: number, // 缩放比例
    children: any,
};
type State = {
    position: {[string]: { x: number, y: number }}, // 实际定位信息
    // 边界条件
    bounds: {
        left: number,
        right: number,
        bottom: number,
        top: number,
    },
};
function noop(){};
export default class CustomItems extends Component<Props, State> {
    static defaultProps = {
        containerSize: {
            width: 0,
            height: 0,
        },
        sceneSize: {
            width: 0,
            height: 0,
        },
        offset: {
            x: 0,
            y: 0,
        },
        zoom: 1, // 缩放比例
    };

    // 标志位
    static isCustomItems = true;
    constructor(props: Props) {
        super(props);
        this.state = {
            position: {},
            bounds: {
                left: 0,
                right: 0,
                bottom: 0,
                top: 0,
            },
        };
    }

    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.zoom !== this.props.zoom) {
            this.onSizeChange(nextProps);
        }
        if( nextProps.offset !== this.props.offset || nextProps.containerSize !== this.props.containerSize || nextProps.sceneSize !== this.props.sceneSize) {
            try {
                this.onPositionChange(nextProps);
            }
            catch (e) {
                console.log(e);
            }
        }
    };

    componentDidMount() {
        this.onSizeChange(this.props);
    };


    // 重新计算点位数据
    onPositionChange = (props: Props) => {
        const { containerSize, sceneSize, offset, zoom } = props;
        const top = containerSize.height / 2 - sceneSize.height / 2 * zoom + offset.y;
        const left = containerSize.width / 2 - sceneSize.width / 2 * zoom - offset.x;
        const bottom = top + sceneSize.height * zoom;
        const right = left + sceneSize.width * zoom;
        const newPosition = {};
        const { position: oldPosition } = this.state;
        // 释放内存
        for(const key in oldPosition) {
            oldPosition[key] = null;
        }
        React.Children.forEach(props.children, child => {
            console.log(child);
            const { key: id, props: childProps } = child;
            const { position, offset = { top: 0, left: 0} } = childProps;
            newPosition[id] = { x: left + position.x * zoom, y: top + position.y * zoom, offset };
        });
        this.setState({ position: newPosition, bounds: { left, right, top, bottom } });
    };

    // 缩放比例改变
    onSizeChange(nextPros: Props) {
        const { containerSize, sceneSize, offset, zoom } = nextPros;
        const newTop = containerSize.height / 2 - sceneSize.height / 2 * zoom + offset.y;
        const newLeft = containerSize.width / 2 - sceneSize.width / 2 * zoom - offset.x;
        const { position: oldPosition, bounds: { left = 0, top = 0 } } = this.state;
        const newPosition = {};
        const scale = zoom / this.props.zoom;
        Object.keys(oldPosition).forEach(key => {
            const position = oldPosition[key];
            let { x: lastX, y: lastY, offset } = position;
            lastX -= left;
            lastY -= top;
            newPosition[key] = { x: lastX * scale + newLeft, y: lastY * scale + newTop, offset };
        });
        this.setState({ position: newPosition });
        console.log(newPosition);
    };

    // 渲染子元素
    renderItem = (child: any) => {
        console.log(child);
        const { key: id, props } = child;
        const { position, bounds } = this.state;
        const { onDrag = noop, onDragStop = noop } = props;
        const oldPosition = position[id] || {};
        const childProps = {
            ...props,
            id,
            position: { x: oldPosition.x, y: oldPosition.y },
            onDrag: this.onDrag(onDrag),
            onDragStop: this.onDragStop(onDragStop),
            bounds,
        };
        return React.cloneElement(child, childProps)
    };

    // 拖拽函数
    onDrag = (cb: Function) => {
        return (id: string, position: { x: number, y: number }, e: Event) => {
            const { position: oldPosition } = this.state;
            oldPosition[id] = { ...oldPosition[id], position };
            this.setState({ position: { ...oldPosition }});
            cb(position, e);
        };
    };

    // 拖拽停止函数
    onDragStop = (cb: Function) => {
        return (e: Event, data: { x: number, y: number }) => {
            cb(data, e);
        };
    };

    render() {
        console.log('props:', this.props);
        console.log('states:', this.state);
        return <div className="customItemsContainers" style={{ position: 'absolute', left: 0, top: 0 }}>
            {React.Children.map(this.props.children, this.renderItem)}
        </div>;
    }
}

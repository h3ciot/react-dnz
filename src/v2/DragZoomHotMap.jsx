/**
 * @flow
 */
import React from 'react'
import type { Size, Path } from './Type';
import connect from './ContextUtils';
type Props = {
    currentSize: Size,
    scale: number,
    points: Path;
    hotColor: { [key: string]: string },
    styleOption: {
        minOpacity?: 0,
        maxOpacity?: 0.8,
        
    }
}

type State = {

}

class DragZoomHotMap extends React.Component<Props, State> {
    static isHotMap = "DragZoomHotMap_V2";
    static defaultProps = {
        currentSize: { width: 0, height: 0 },
        scale: 1,
        points: [],
        hotColor: {
            '0.2': 'rgba(0,0,255,0.2)',
            '0.3': 'rgba(43,111,231,0.3)',
            '0.4': 'rgba(2,192,241,0.4)',
            '0.6': 'rgba(44,222,148,0.6)',
            '0.8': 'rgba(254,237,83,0.8)',
            '0.9': 'rgba(255,118,50,0.9)',
            '1.0': 'rgba(255,64,28,1)',
        }
    };

    canvasRef: Object;
    hotColor: Object;
    constructor(props: Props) {
        super(props);
        this.state = {};
        this.canvasRef = React.createRef();
        this.hotColor = this.getColorPaint(props);
    }

    componentDidMount() {
        this.redrawCanvas(this.props);
    }

    componentWillReceiveProps(nextProps: Props) {
        if (this.props.hotColor !== nextProps.hotColor) {
            this.hotColor = this.getColorPaint(nextProps);
        }
        if(this.props.points !== nextProps.points || this.props.scale !== nextProps.scale) {
            this.redrawCanvas(nextProps);
        }
    }
    
    redrawCanvas = (props: Props) => {
        // console.time('begin');
        const canvas = this.canvasRef.current;
        if(!canvas) {
            throw(new Error("can't get canvas context"));
        }
        const { currentSize: { width, height } } = props;
        canvas.width = width;
        canvas.height = height;
        const context2D = canvas.getContext('2d');
        context2D.clearRect(0, 0, width, height);
        context2D.putImageData(this.drawHot(props), 0, 0);
        // console.timeEnd('begin');
    };
    drawHot = props => {
        const tempCanvas = document.createElement('canvas');
        const { currentSize: { width, height }, points, scale } = props;
        tempCanvas.width = width;
        tempCanvas.height = height;
        const newPoints = this.getAllDrawPosition(points, props);
        const ctx = tempCanvas.getContext('2d');
        const radius = Math.max(Math.ceil(15 * scale), 1);
        newPoints.forEach(function(point) {
            ctx.beginPath();
            const [x, y] = point;
            let gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.arc(x, y, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        });
        const img = ctx.getImageData(0,0,width, height);
        let palette = this.hotColor; //取色面板
        let imgData = img.data;
        let len = imgData.length;
        for (let i = 3; i < len; i += 4) {
            let alpha = imgData[i];
            let offset = alpha * 4;
            if (!offset) {
                continue;
            }
            imgData[i - 3] = palette[offset];
            imgData[i - 2] = palette[offset + 1];
            imgData[i - 1] = palette[offset + 2];
        }
        return img;
    };
    getColorPaint = (props) => {
        const { hotColor } = props;
        const paletteCanvas = document.createElement('canvas');
        const paletteCtx = paletteCanvas.getContext('2d');
        paletteCanvas.width = 256;
        paletteCanvas.height = 1;
        const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
        for (let key in hotColor) {
            if (isNaN(parseFloat(key))) {
                throw new Error('hotColor props key is invalid');
            }
            gradient.addColorStop(key, hotColor[key]);
        }
        paletteCtx.fillStyle = gradient;
        paletteCtx.fillRect(0, 0, 256, 1);
        return paletteCtx.getImageData(0, 0, 256, 1).data;
    };
    /** 转换成绘制坐标，取整 */
    getAllDrawPosition = (position: Path, props: Props = this.props) => {
        const { scale, currentSize } = props;
        const { width, height } = currentSize;
        return position.map(([pointX, pointY]) => [Math.max(0, Math.min(~~(pointX * scale), width)), Math.max(0, Math.min(~~(pointY * scale), height))]);
    };
    render() {
        const { currentSize } = this.props;
        return (
                <canvas
                        ref={this.canvasRef}
                        style={{ position: 'absolute', top: '0px', left: '0px', width: currentSize.width, height: currentSize.height }}>
                </canvas>
        )
    }
}
const WarpComponent = connect(DragZoomHotMap);
export default WarpComponent;

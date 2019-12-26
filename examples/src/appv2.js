import React from 'react'
import { V2 } from 'react-dnz';
const { DragZoom, DragZoomItems, DragZoomItem, DragZoomPolygon, DrawType, DragZoomCanvas, DragZoomHotMap } = V2;
import { Popover, Button } from 'antd';
import './index.css';
import Mock from 'mockjs';
import svg from './svg.svg';
const Polygon = DragZoomPolygon.Polygon;
const Path = DragZoomCanvas.Path;
export default class App extends React.Component{
    drawingRef: Object;
    constructor(props){
        super(props);
        this.startPosition = null
        this.onceDrag = []
        this.drawingRef = React.createRef();
        const list = Mock.mock({ 'list|2': [{ 'data|2': [{'x|1-1000':1, 'y|1-1000':1}]}]}).list;
        console.log(list);
        this.state = {
            img: 'http://www.pconline.com.cn/pcedu/photo/0604/pic/060429cg03.jpg',
            // img: svg,
            polygonList: list.map((item, i) => ( { id: i, path: item.data.map(i => [i.x, i.y])})),
            // polygonList: [],
            currentPolygon: [],
            points: Mock.mock({
              "points|200": [{
                "x|-100-1000":1,
                "y|-100-1000":1
              }]
            }).points,
            // points: [],
            x: 100,
            y: 100,
            draw: true,
            hotPoints: Mock.mock({
              "points|20000": [{
                "x|-100-1000":1,
                "y|-100-1000":1
              }]
            }).points.map(item => [item.x, item.y]),
        }
        console.log(this.state);
        this.state.hotPoints = [];
        for(let i = 1; i < 200; i++) {
          this.state.hotPoints.push([i,i]);
        }
      for(let i = 1; i < 50; i++) {
        this.state.hotPoints.push([200,200]);
      }
        window.resetState = () => {
            this.setState({ img: svg });
        };
    }


    componentDidMount() {
        console.log(this.drawingRef);
    }

    controlPaint = (context, { id, path}) => {
        // if(id === '10') {
        //     return
        // }
        // console.log(id);
        // console.log(path);
        context.strokeStyle = '#000000';
        context.fillStyle = '#ff000050';
        context.lineWidth = 5;
        path.forEach((point, index) => {
            const [x, y] = point;
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        });
        context.fill();
        context.stroke();
        return 1
    };

    dragControlPaint = (context, { id, path}) => {
        context.strokeStyle = '#000000';
        context.fillStyle = '#ff000050';
        context.lineWidth = 5;
        path.forEach((point, index) => {
            const [x, y] = point;
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
        });
        context.fill();
        context.stroke();
        return true;
    }

    capturePosition = (position) => {
        // console.log('mousedown')
        const { currentPolygon } = this.state
        this.setState({currentPolygon: [...this.onceDrag, position]})
        this.startPosition = position
        this.onceDrag.push(position)
    }

    startMove = (position, e) => {
        // console.log('mousemove');
        // console.log(position);
        this.setState({currentPolygon: [...this.onceDrag, positions[1]]})
    }

    stopMove = (position) => {
        // const lastPosition = currentPolygon[1] || []
        if(JSON.stringify(this.startPosition) !== JSON.stringify(position)) {
            this.onceDrag.push(position)
        }
        // console.log('mouseup')
        this.setState({currentPolygon: this.onceDrag})
    }

    doubleClick = (position) => {
        // console.log('doubleclik')
        const { polygonList, currentPolygon } = this.state
        polygonList.push(currentPolygon)
        this.onceDrag = []
        this.setState({
            polygonList,
            currentPolygon: []
        })
    }
    fixContent = (position, placement) => {
        // console.log(this.drawingRef);
        this.drawingRef.current.fixContent(position, placement);
    };
    onSizeChange=(imgSize, scale, loading) =>{
        // console.log('imgSize:', imgSize);
        // console.log('scale:', scale);
        // console.log('loading:', loading);
    };
    onClick = (position) => {
        // console.log('click');
        // console.log(position);
        this.onceDrag.push(position);
        this.setState({ currentPolygon: this.onceDrag })
    };
    onMouseMove = (position) => {
        // console.log('mousemove');
        const currentPolygon = this.state.currentPolygon.slice(0, this.onceDrag.length);
        currentPolygon.push(position);
        this.setState({ currentPolygon})
    };
    onDoubleClick = (position) => {
        // console.log('dblclick');
        this.onceDrag.push(position);
        this.setState({ currentPolygon: this.onceDrag, capture: false })
        this.onceDrag = [];
    };
    render() {
        const { polygonList, currentPolygon, hotPoints } = this.state
        // console.log('current', polygonList);
        return (
                <DragZoom
                    key="1"
                    ref={this.drawingRef}
                    img={this.state.img}
                    onSizeChange={this.onSizeChange}
                    // polygonDragDisabled={true}
                    // controlPaint={this.controlPaint}
                    // dragControlPaint={this.dragControlPaint}
                    allowAnyClick={true}
                >
                    <DragZoomPolygon
                        key="2"
                        capturePosition={this.capturePosition}
                        startMove={this.startMove}
                        stopMove={this.stopMove}
                        doubleClick={this.doubleClick}
                        capture={false}
                        allowAnyClick={false}
                        polygons={polygonList}
                    >
                    {/*    {*/}
                    {/*        // {new Array(10).fill(null).map((item, index) =>*/}
                    {/*        //   <Polygon key={index+2} polygonDrag id={index+2} path={[[100,100],[100,300],[300,100],[300,300]]}/>*/}
                    {/*        // )}*/}

                    {/*        <Polygon id='1' polygonDrag path={[[200,200],[200,400],[400,200],[400,400]]}/> }*/}
                    {/*    {//<Polygon key='10' polygonDrag path={this.state.currentPolygon} />*/}
                    {/*    }*/}
                    </DragZoomPolygon>
                    <DragZoomHotMap points={hotPoints}/>
                    <DragZoomCanvas
                        controlPaint={this.controlPaint}
                        capture={false}
                        onClick={this.onClick}
                        onDoubleClick={this.onDoubleClick}
                        onMouseMove={this.onMouseMove}
                    >
                        {/*{polygonList.map((item, index) =>*/}
                        {/*<Path key={index+1} path={item}/>*/}
                        {/*)}*/}
                            <Path key='aaaa' path={currentPolygon}/>
                    </DragZoomCanvas>
                    {/*<DragZoomItems>*/}
                    {/*    <DragZoomItem key="top" position={{x: this.state.x, y: this.state.y}} offset={{top:0,left:0}} >*/}
                    {/*        <Popover autoAdjustOverflow={false} placement="bottomRight" content={<div style={{ width: 200, height: 300, background: '#0f0'}}/>} trigger="click">*/}
                    {/*            <Button onClick={() => this.fixContent({ x: this.state.x, y: this.state.y, width: 232, height: 334, offset:{top:10,left:10} }, 'bottomRight')}>topLeft</Button>*/}
                    {/*        </Popover>*/}
                    {/*    </DragZoomItem>*/}
                    {/*    {this.state.points.map((point,i) => <DragZoomItem key={i} position={{x:point.x, y:point.y}} offset={{top:10,left:10}} >*/}
                    {/*        <span style={{background:'#000',display:'inline-block',width:'20px',height:'20px'}} />*/}
                    {/*    </DragZoomItem>)}*/}
                    {/*</DragZoomItems>*/}
                </DragZoom>
        )
    }
}

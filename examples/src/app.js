import React from 'react'
import Dragzoom, { DragzoomPolygon, DragzoomItems, DragzoomItem } from 'react-dnz'
import { Popover, Button } from 'antd';
import './index.css';
import Mock from 'mockjs';
import svg from './svg.svg';
import svg1 from './(Share___)_SFont.CN.svg';
const Polygon = DragzoomPolygon.Polygon
export default class App extends React.Component{
  drawingRef: Object;
  constructor(props){
    super(props);
    this.startPosition = null
    this.onceDrag = []
    this.drawingRef = React.createRef();
    const list = Mock.mock({ 'list|2000': [{ 'data|2': [{'x|1-1000':1, 'y|1-1000':1}]}]}).list;
    this.state = {
      img: 'http://www.pconline.com.cn/pcedu/photo/0604/pic/060429cg03.jpg',
      // img: svg1,
      polygonList: list.map(item => item.data.map(i => [i.x, i.y])),
      // polygonList: [],
      currentPolygon: [],
      // points: Mock.mock({
      //   "points|200": [{
      //     "x|100-1000":1,
      //     "y|100-1000":1
      //   }]
      // }).points,
      points: [],
      x: 500,
      y: 500,
    }
  }


  componentDidMount() {
    setTimeout(() => {
      // this.setState({x:150,y:150})
      // this.setState({ img: 'https://i4.3conline.com/images/piclib/201211/21/batch/1/155069/1353489276201ambt3yjnlw_medium.jpg' })
      // this.setState({ img: 'http://www.pconline.com.cn/pcedu/photo/0604/pic/060429cg03.jpg'})
    }, 3000)
  }

  controlPaint = (context, { id, path}) => {
    if(id === '10') {
      return
    }
    // context.strokeStyle = '#000000'
    // context.fillStyle = '#ff0000'
    // context.lineWidth = 5
    // context.rect(path[0][0], path[0][1], path[3][0]-path[0][0], path[3][0]-path[0][0])
    // return 1
  }

  dragControlPaint = (context, { id, path}) => {
    context.strokeStyle = '#000000'
    context.fillStyle = '#ff000050'
    context.lineWidth = 5
    context.rect(path[0][0], path[0][1], path[3][0]-path[0][0], path[3][0]-path[0][0])
    return 1
  }

  capturePosition = (position) => {
    console.log('mousedown')
    const { currentPolygon } = this.state
    this.setState({currentPolygon: [...this.onceDrag, position]})
    this.startPosition = position
    this.onceDrag.push(position)
  }

  startMove = (positions) => {
    // console.log('mousemove')
    this.setState({currentPolygon: [...this.onceDrag, positions[1]]})
  }

  stopMove = (position) => {
    // const lastPosition = currentPolygon[1] || []
    if(JSON.stringify(this.startPosition) !== JSON.stringify(position)) {
      this.onceDrag.push(position)
    }
    console.log('mouseup')
    this.setState({currentPolygon: this.onceDrag})
  }

  doubleClick = (position) => {
    console.log('doubleclik')
    const { polygonList, currentPolygon } = this.state
    polygonList.push(currentPolygon)
    this.onceDrag = []
    this.setState({
      polygonList,
      currentPolygon: []
    })
  }
  fixContent = (position, placement) => {
    console.log(this.drawingRef);
    this.drawingRef.current.fixContent(position, placement);
  }
  render() {
    const { polygonList, currentPolygon } = this.state
    return (
      [
        <Dragzoom
          key="1"
          ref={this.drawingRef}
          img={this.state.img}
          polygonDragDisabled={true}
          controlPaint={this.controlPaint}
          dragControlPaint={this.dragControlPaint}
          allowAnyClickToDrag={true}
        >
          <DragzoomPolygon
            key="2"
            capturePosition={this.capturePosition}
            startMove={this.startMove}
            stopMove={this.stopMove}
            doubleClick={this.doubleClick}
            capture={true}
            allowAnyClick={false}
          >
            {
              polygonList.map((item, index) =>
              <Polygon key={index+1} path={item}/>
            )
          }
            {
              // {new Array(10).fill(null).map((item, index) =>
            //   <Polygon key={index+2} polygonDrag id={index+2} path={[[100,100],[100,300],[300,100],[300,300]]}/>
            // )}

            <Polygon id='1' polygonDrag path={[[200,200],[200,400],[400,200],[400,400]]}/> }
            {//<Polygon key='10' polygonDrag path={this.state.currentPolygon} />
          }
          </DragzoomPolygon>
          <DragzoomItems>
            <DragzoomItem key="top" position={{x: this.state.x, y: this.state.y}} offset={{top:10,left:10}} >
              <Popover autoAdjustOverflow={false} placement="bottomRight" content={<div style={{ width: 200, height: 300, background: '#0f0'}}/>} trigger="click">
                <Button onClick={() => this.fixContent({ x: this.state.x, y: this.state.y, width: 232, height: 334, offset:{top:10,left:10} }, 'bottomRight')}>topLeft</Button>
              </Popover>
            </DragzoomItem>
            {this.state.points.map((point,i) => <DragzoomItem key={i} position={{x:point.x, y:point.y}} offset={{top:10,left:10}} >
            <span style={{background:'#000',display:'inline-block',width:'20px',height:'20px'}} />
          </DragzoomItem>)}
            {/* <DragzoomItem key="4" position={{x:200, y:200}} offset={{top:10,left:10}} >
              <span style={{background:'#000',display:'inline-block',width:'20px',height:'20px'}}></span>
            </DragzoomItem> */}
          </DragzoomItems>
        </Dragzoom>
      ]
    )
  }
}

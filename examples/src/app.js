import React from 'react'
import Dragzoom, { DragzoomPolygon, DragzoomItems, DragzoomItem } from 'react-dragzoom'

const Polygon = DragzoomPolygon.Polygon
export default class App extends React.Component{
  constructor(props){
    super(props);
    this.startPosition = null
    this.onceDrag = []
    this.state = {
      img: 'http://www.pconline.com.cn/pcedu/photo/0604/pic/060429cg03.jpg',
      polygonList: [],
      currentPolygon: [],
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
    console.log('mousemove')
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

  render() {
    const { polygonList, currentPolygon } = this.state
    return (
      [
        <Dragzoom
          key="1"
          img={this.state.img}
          polygonDragDisabled={false}
          controlPaint={this.controlPaint}
          dragControlPaint={this.dragControlPaint}
        >
          <DragzoomPolygon
            key="2"
            capturePosition={this.capturePosition}
            startMove={this.startMove}
            stopMove={this.stopMove}
            doubleClick={this.doubleClick}
            capture={true}
          >
            {
            //   polygonList.map((item, index) =>
            //   <Polygon key={index+1} path={item}/>
            // )
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
            <DragzoomItem key={this.state.x || 10} disabled position={{x: this.state.x || 100, y: this.state.y || 100}} offset={{top:10,left:10}} >
              <span style={{background:'#000',display:'inline-block',width:'20px',height:'20px'}} />
            </DragzoomItem>
            {/* <DragzoomItem key="4" position={{x:200, y:200}} offset={{top:10,left:10}} >
              <span style={{background:'#000',display:'inline-block',width:'20px',height:'20px'}}></span>
            </DragzoomItem> */}
          </DragzoomItems>
        </Dragzoom>
      ]
    )
  }
}
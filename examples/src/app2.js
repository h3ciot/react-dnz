import React from 'react'
import Dragzoom, { DragzoomPolygon, DragzoomItems, DragzoomItem } from 'react-dragzoom'

const Polygon = DragzoomPolygon.Polygon
export default class App extends React.Component{
  startPosition = null
  onceDrag = []
  state = {
    img: 'http://www.pconline.com.cn/pcedu/photo/0604/pic/060429cg03.jpg',
    polygonList: [],
    currentPolygon: [],
  }

  componentDidMount() {
    setTimeout(() => {
      // this.setState({x:150,y:150})
      // this.setState({ img: 'https://i4.3conline.com/images/piclib/201211/21/batch/1/155069/1353489276201ambt3yjnlw_medium.jpg' })
      // this.setState({ img: 'http://www.pconline.com.cn/pcedu/photo/0604/pic/060429cg03.jpg'})
    }, 3000)
  }

  controlPaint = (context, { id, path}) => {
    if(path.length === 2) {
      context.strokeStyle = '#000000'
      context.fillStyle = '#ff000000'
      const [x, y] = path[0]
      const [x1, y1] = path[1]
      const [rx, ry] = [Math.abs(x-x1), Math.abs(y-y1)]
      context.lineWidth = 5
      const r = Math.max(rx, ry)
      context.arc(x,y,r,0,2*Math.PI)
    }
    return 1
  }

  dragControlPaint = (context, { id, path}) => {
    if(path.length === 2) {
      context.strokeStyle = '#000000'
      context.fillStyle = '#ff000050'
      const [x, y] = path[0]
      const [x1, y1] = path[1]
      const [rx, ry] = [Math.abs(x-x1), Math.abs(y-y1)]
      context.lineWidth = 5
      context.arc(x,y,rx,ry,2*Math.PI)
    }
    return 1
  }

  capturePosition = (position) => {
    const { currentPolygon } = this.state
    this.setState({currentPolygon: [position, position]})
    this.startPosition = position
  }

  startMove = (positions) => {
    this.setState({currentPolygon: positions})
  }

  stopMove = (position) => {
    if(JSON.stringify(this.startPosition) !== JSON.stringify(position)) {
      const { polygonList } = this.state
      polygonList.push([this.startPosition, position])
      this.setState({
        polygonList,
        currentPolygon: []
      })
    }
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
            capture={true}
          >
            {polygonList.map((item, index) =>
              <Polygon key={index+1} path={item}/>
            )}
            <Polygon key='10' polygonDrag path={this.state.currentPolygon} />
          </DragzoomPolygon>
        </Dragzoom>
      ]
    )
  }
}
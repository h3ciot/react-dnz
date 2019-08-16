a drag and scale component for react

##  如何使用
首先，下载代码后进入项目根目录安装依赖包

```bash
$ cd <appName>
$ npm install
```

然后启动开发环境  
```bash
$ npm start
```

打包编译
```bash
$ npm run build-es
```

## Dragzoom

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| img | 背景图url | string(svg格式的需要传入经过base64编码后的dataUrl) | '' |
| style | dragzoom第一层div的样式 | HTMLStyleElement | {} |
| maxZoom | 最大缩放层级 | number | 2 |
| scaleable | 是否可以缩放 | boolean | true |
| draggable | 图层是否可以拖动 | boolean | true |
| onSizeChange | 图层大小变化时的回调 | (props, changed, all): void | NOOP |
| onDrag | 图层拖动时的回调 | (Position): void | - |
| onDragStop | 图层拖动结束时的回调 | (Position): Object | - |
| polygonDragDisabled | 禁用自定义图层的拖动 | boolean | true |
| onPolygonDragStop | 自定义图层停止拖动的回调 | (context:CanvasRenderingContext2D ,props:{id:string,path:Path}) => mixed | - |
| controlPaint | 控制自定义图层的绘画 | (context:CanvasRenderingContext2D ,props:{id:string,path:Path}) => mixed | - |
| dragControlPaint | 控制拖拽时自定义图层的绘画 | String | - |
| getSVGSize | 获取svg格式的背景图的实际大小 | (size: { width: number, height: number }) => mixed | - |
|allowAnyClickToDrag | 是否允许任意键拖动 | boolean | false |
| fixContent(实例方法)| 自适应弹出框内容(x,y为左上角定位) | (position: { x: number, y: number, width: number, height: number, offset: { top: number, left: number } }, placement: 'top' &#166; 'left' &#166; 'right' &#166; 'bottom' &#166; 'topLeft' &#166; 'topRight' &#166; 'bottomLeft' &#166; 'bottomRight' &#166; 'leftTop' &#166; 'leftBottom' &#166; 'rightTop' &#166; 'rightBottom') |
## DragzoomPolygon

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| capture | 是否捕获坐标 | boolean | false |
| capturePosition | 捕获坐标函数 | (a:[number,number]) => mixed | (a:[number,number]) => null |
| allowAnyClick | 是否响应右键或中键点击事件 | boolean | true
| capturePosition | 捕获点击事件 | (position: { x: number, y: number }， event) => null | () => null
| startMove | 鼠标移动开始事件 | (position: { x: number, y: number }， event) => null | () => null
| stopMove | 鼠标移动结束事件 | (position: { x: number, y: number }， event) => null | () => null
## DragzoomPolygon.Polygon

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| path | 自定义图层的路径 | Array<[number,number]> | [] |
| polygonDrag | 是否能拖动 | boolean | false |


## DragzoomItems

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| pointsDisabled | 所有点位能否拖动 | boolean | false |
| onDrag | 点位拖动时的回调 | (point: Point) => mixed | (point: Point) => mixed |
| onDragStop | 点位拖动结束时的回调 | (point: Point) => mixed | (point: Point) => mixed |

## DragzoomItem

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| id | 点位id | boolean | false |
| children| 子项 | React.Node | null |
| disabled | 是否禁用拖动 | boolean | false |
| capture | 是否捕获坐标 | boolean | false |
| allowAnyClickToDrag | 是否允许任意键拖动 | boolean | false |
| capturePosition | 捕获坐标函数 | (a:[number,number]) => mixed | (a:[number,number]) => null |


#V2
import { V2 } from 'react-dnz';
## DragZoom

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| img | 背景图url | string | '' |
| style | 容器样式 | HTMLStyleElement | {} |
| maxScale | 最大缩放层级 | number | 2 |
| scalable | 是否可以缩放 | boolean | true |
| draggable | 图层是否可以拖动 | boolean | true |
| onSizeChange | 图层大小变化时的回调,包括图片路径变更 | (e:Event, position: {x: number, y: number }) => null | NOOP |
| onDragStop | 图层拖动结束时的回调 | (e:Event, position: {x: number, y: number }) => null| - |
| allowAnyClick | 是否允许任意键拖动 | boolean | false |
| fixContent(实例方法)| 自适应弹出框内容(x,y为左上角定位) | (position: { x: number, y: number, width: number, height: number, offset: { top: number, left: number } }, placement: 'top' &#166; 'left' &#166; 'right' &#166; 'bottom' &#166; 'topLeft' &#166; 'topRight' &#166; 'bottomLeft' &#166; 'bottomRight' &#166; 'leftTop' &#166; 'leftBottom' &#166; 'rightTop' &#166; 'rightBottom') |

## DragZoomPolygon
(处于性能考虑，此处尽量统一样式，并且剥离绘制捕获内容至单独组件)

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| style | 容器样式 | HTMLStyleElement | {} |
| controlPaint | 图层自定义绘制方法, 返回false则采用默认绘制方法 | (context:CanvasRenderingContext2D ,props:{id:string,path:Path,color:Object,shape:string}) => boolean | () => false |
| pathStyle | 路径填充样式 | { strokeStyle: string,fillStyle: string,lineWidth: string } | {fillStyle: 'rgba(0, 132, 255, 0.2)',strokeStyle: '#4C98FF',lineWidth: 2,} |
| vertexStyle | 端点填充样式 | { strokeStyle: string,fillStyle: string,lineWidth: string } | {fillStyle: 'rgb(255,255,255)',strokeStyle: 'green',lineWidth: 3,} |
| polygons | 自定义图层 | Polygon | []

### DragZoomPolygon.Polygon

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| path | 自定义图层的路径 | Array<[number,number]> | [] |
| id | 唯一标识 | string | '' |
| color | 图层颜色 | Object | {} |
| shape | 形状 | string | '' |
| custom | 是否自定义绘制 | boolean | false |
| vertex | 是否绘制端点 | boolean | true |
| dash | 虚线分段数据，形如[5,10], 代表虚线长度为5，间隔为10 | string | '' |


## DragZoomItems

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| style | 容器样式 | HTMLStyleElement | {} |
| onDrag | 拖动时的回调 | (id: string, position: Position, e: Event) => null | (point: Point) => mixed |
| onDragStop | 拖动结束时的回调 | (id: string, position: Position, e: Event) => null | (point: Point) => mixed |

## DragZoomItem

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| id | 点位id | boolean | false |
| children| 子项 | React.Node | null |
| disabled | 是否禁用拖动 | boolean | true |
| position | 定位坐标 | {x: number, y: number} | {x: 0, y: 0} |
| offset | 偏移量 | { left: number, top: number } | {left: 0, top: 0} |


## DragZoomCanvas(该组件用于绘制变化部分，所有路径都会被自定义绘制)

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| capture | 捕获坐标 | boolean | false |
| onMouseMove| 鼠标移动 | (position: Position, e: Event) => null | f => f |
| onDoubleClick | 双击事件 | (position: Position, e: Event) => null | f => f |
| onClick | 单击事件 | (position: Position, e: Event) => null | f => f |
| controlPaint | 偏移量 | (context:CanvasRenderingContext2D ,props:{id:string,path:Path,color:string,shape:string}) => mixed | f => f |


## DragZoomCanvas.Path
详见 DragZoomPolygon.Polygon
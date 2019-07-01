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
| fixContent(实例方法)| 自适应弹出框内容(x,y为左上角定位) | (position: { x: number, y: number, width: number, height: number, offset: { top: number, left: number } }, placement: 'top' &#166; 'left' &#166; 'right' &#166; 'bottom' &#166; 'topLeft' &#166; 'topRight' &#166; 'bottomLeft' &#166; 'bottomRight' &#166; 'leftTop' &#166; 'leftBottom' &#166; 'rightTop' &#166; 'rightBottom') {
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

## Sketchpad(3d环境组件)
| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
|style|容器样式|Object| null|
|containerClass|容器类名|string|null|
|dataUrl|底图文件路径(gtlf格式,使用专用编辑器导出)|string|null|
|capture|是否捕获坐标|boolean|false|
|capturePosition|捕获坐标回调(将会捕获点击与移动事件)|(position: {x:number, y: number}, e: Event) => null|null
|areaList|区域数据| Array<'Area'> | null |
|markList|标记数据|Array<'Mark'>|null|
|model|模式，2d模式下可进行交互，3d模式下仅用于查看|'2d|3d'|3d|
|loadingStatus|底图文件加载进度回调|(err: Error, loading: boolean, percentage: number) => null|null|

###Area
    key: string // 索引
	type: 'line'|'rect'|'circle'|'polygon' // 区域类型
	points: Array // 区域坐标为[[1,1],[3,3]]类型
	height: number // 区域高度
	color: string // 颜色
	radius： number // 区域类型为circle时存在，半径
	z: number // 区域底部高度
	onClick： (e: { type: string, event: Event }) => null //点击事件回调
	showPoint: boolean // 显示顶点，建议仅用在绘制区域中

###Mark
    key: string, // 索引
    position: { x: number, y: number }, // 定位坐标
    z: number, // z位置
    img: string, // 图片路径
    content: string, // 文字内容
    width: number, // 宽度，包含文字与图片
    height: number, // 高度， 包含文字与图片内容
    placement: 'top' | 'bottom', // 文字位置
    onClick?: (e: { type: string, event: Event }) => null // 点击事件回调
    dragable: boolean, // 能否进行拖拽
    onDrag?: (e: { type: string, position: Position }) => null, // 拖拽事件回调
    onDragStop?: (e: { type: string, position: Position }) => null // 拖拽结束回调

#Polyfill(需要依赖以下es6特性)
Promise, Map<br/>
Array
 - includes
 - keys
 - values
String
 - includes
 - startsWith
 - endsWith
 

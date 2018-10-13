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
| img | 背景图url | string | '' |
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

## DragzoomPolygon

| props     | Description                              | Type       | Default |
|-----------|------------------------------------------|------------|---------|
| capture | 是否捕获坐标 | boolean | false |
| capturePosition | 捕获坐标函数 | (a:[number,number]) => mixed | (a:[number,number]) => null |


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
| capturePosition | 捕获坐标函数 | (a:[number,number]) => mixed | (a:[number,number]) => null |
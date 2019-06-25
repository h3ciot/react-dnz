/**
 * @author:lpf
 * @flow
 *
 * */
import { Shape, Vector2 } from 'three';
import type { Size, Position } from "./TypeDec";
// 获取webgl坐标[-1,1]
// TODO 待优化，可以缓存
export function transformCoordinateToWebgl(evt: {clientX: number, clientY: number}, offsetParent: Size, zoom = 1): Position {
    const  { width, height, scrollLeft = 0, scrollTop = 0, left, top } = offsetParent;
    const positionX = evt.clientX + scrollLeft - left;
    const positionY = evt.clientY + scrollTop - top;
    const x = (positionX / width * 2 - 1) * zoom;
    const y = (-positionY / height * 2 + 1) * zoom;
    return { x, y }
}

export function transformCoordinateSys(container: Size, scene: Size, positions: Array<Position>, zoom = 1): Array<Position> {
    const { width: cWidth = 0, height: cHeight = 0 } = container;
    const { width: sWidth = 0, height: sHeight = 0 } = scene;
    return positions.map(position => {
        const { x = 0, y= 0 } = position;
        const clientX = (cWidth - sWidth) / 2 + x;
        const clientY = (cHeight - sHeight) / 2 + y;
        return { clientX, clientY };
    }).map(item => transformCoordinateToWebgl(item, container, zoom));
}
// webgl坐标转换为相对底图坐标
export function transformWebgl( position: Position, sceneSize: Size = { width: 0, height : 0 }, zoom: number  = 1){
    const { x: oldX, y: oldY } = position, { width = 0, height = 0 } = sceneSize;
    const x = (oldX + width / 2) * zoom, y = (height / 2 - oldY) * zoom;
    return  { x, y };
};

export function generatePath(drawShape: string, drawPath: Array, radius: number) {
  const path = new Shape();
  switch (drawShape) {
    case 'line':
      // 3d
      path.moveTo(drawPath[0].x, drawPath[0].y, 0);
      path.lineTo(drawPath[1].x, drawPath[1].y, 0);
      break;
    case 'rect':
      path.moveTo(drawPath[0].x, drawPath[0].y, 0);
      path.lineTo(drawPath[1].x, drawPath[0].y, 0);
      path.lineTo(drawPath[1].x, drawPath[1].y, 0);
      path.lineTo(drawPath[0].x, drawPath[1].y, 0);
      path.lineTo(drawPath[0].x, drawPath[0].y, 0);
      break;
    case 'polygon':
      path.moveTo(drawPath[0].x, drawPath[0].y, 0);
      for (let i = 1; i < drawPath.length && i < 19; i++) {
        path.lineTo(drawPath[i].x, drawPath[i].y, 0);
      }
      path.lineTo(drawPath[0].x, drawPath[0].y, 0);
      break;
    case 'circle':
      path.moveTo(drawPath[0].x, drawPath[0].y, 0);
      path.absarc(drawPath[0].x, drawPath[0].y, radius, 0, 2 * Math.PI);
      break;
    default:
      break;
  }
  return path;
}
type Mask = {
    key: string, //
    position: { x: number, y: number }, // 定位
    z: number, // z位置
    img: string, // 图片路径
    content: string, // 文字内容
    width: number,
    height: number,
    position: 'left' | 'top' | 'bottom' | 'right',
};
export function generateTextMark(mark: Mask, cb: canvas => null) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const { img, content, width, height } = mark;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0,0,width,height);
    const imgObj = new Image();
    imgObj.src = img;
    imgObj.onload = ( e => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // TODO 文字超长的处理方案
        ctx.fillStyle = '#2e8eff';
        ctx.font = "900 20px serif";
        const text = ctx.measureText(content);
        const { placement } = mark;
        if(placement === 'top') {
            ctx.drawImage(imgObj, 0, 20, width, height - 20);
            ctx.fillText(content, width / 2, 10, width);
        } else {
            ctx.drawImage(imgObj, 0, 0, width, height - 20);
            ctx.fillText(content, width / 2, height - 10, width);
        }
        cb(canvas, mark);
    });
    imgObj.onerror = (err => {
        console.log(err);
    });
}

// 下载文件函数
export function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}
export function saveString( text, filename ) {
    save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}
function save( blob, filename ) {
    const link = document.createElement( 'a' );
    link.style.display = 'none';
    document.body.appendChild( link ); // Firefox workaround, see #6594
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
    document.body.removeChild(link);
    // URL.revokeObjectURL( url ); breaks Firefox...
}

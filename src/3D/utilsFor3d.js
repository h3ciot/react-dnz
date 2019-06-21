/**
 * @author:lpf
 * @flow
 *
 * */
import { Shape, Vector2 } from 'three';

// 获取webgl坐标[-1,1]
// TODO 待优化，可以缓存
export function transformCoordinateSys(evt: {clientX: number, clientY: number}, offsetParent: HTMLElement, event = true): { x: number, y: number } {
    const offsetParentRect = offsetParent.getBoundingClientRect();
    const width = offsetParentRect.width || offsetParentRect.right - offsetParentRect.left;
    const height = offsetParentRect.height || offsetParentRect.bottom - offsetParentRect.top;
    const positionX = event ? evt.clientX + offsetParent.scrollLeft - offsetParentRect.left : evt.clientX;
    const positionY = event ? evt.clientY + offsetParent.scrollTop - offsetParentRect.top : evt.clientY;
    const x = (positionX / width * 2 - 1);
    const y = (-positionY / height * 2 + 1);
    return { x, y, positionX, positionY }
}


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
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
// TODO 后期需要根据文字宽度进行分行显示
    ctx.fillStyle = '#2e8eff';
    ctx.font = "900 20px serif";
    const { img, content, width, height } = mark;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0,0,width,height);
    const imgObj = new Image();
    imgObj.src = img;
    imgObj.onload = ( e => {
        const text = ctx.measureText(content);
        ctx.drawImage(imgObj, 0, 0, width, height - 20);
        ctx.fillText(content, width / 2, height - 10, width);
        cb(canvas, mark);
    });
    imgObj.onerror = (err => {
        console.log(err);
    });
}

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

export function cloneMaterial(source, para) {
    const result = source.clone();
    for (const key in para) {
        source[key] = para[key];
    }
    console.log(result);
    return result;
}

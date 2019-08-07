import React from 'react';

export type Size = { width: number, height: number }
export type Position = { x: number, y: number, }
export type Path = Array<[number,number]>
export type Point = {
    ['id' | 'key']: string, x: number, y: number, offset: {left: number, top: number}
}
export type Placement = 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
export type DraggableData = {
    node: HTMLElement,
    x: number, y: number,
    deltaX: number, deltaY: number,
    lastX: number, lastY: number
};
export type Shape = 'circle' | 'polygon';
export const CIRCLE = 'circle'; // 鼠标画圆模式
export const RECTANGLE = 'rectangle'; // 鼠标画矩形模式
export const POLYGON = 'polygon'; // 鼠标画多边形模式


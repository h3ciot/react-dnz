export type Size = { width: number, height: number }
export type Position = { x: number, y: number, }
export type Path = Array<[number,number]>
export type Point = {
    ['id' | 'key']: string, x: number, y: number, offset: {left: number, top: number}
}

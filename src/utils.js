/**
 * @ flow
 */

import ReactDOM from 'react-dom'
import _ from 'lodash'

type ControlPosition = {x: number, y: number}
type Bounds = {
  left: number, top: number, right: number, bottom: number
}
export type DraggableData = {
  node?: HTMLElement,
  x: number, y: number,
  deltaX: number, deltaY: number,
  lastX: number, lastY: number
}

// 从事件中得到{x,y}的位置   暂时只支持鼠标事件
export function getControlPosition(e: MouseEvent, touchIdentifier: ?number, draggableCore): ControlPosition {
  // touch事件
  /* const touchObj = typeof touchIdentifier === 'number' ? getTouch(e, touchIdentifier) : null
  if (typeof touchIdentifier === 'number' && !touchObj) return null // not the right touch */

  const node = ReactDOM.findDOMNode(draggableCore)
  // User can provide an offsetParent if desired.
  const offsetParent:HTMLElement = (draggableCore.props && draggableCore.props.offsetParent)
    || (node && node.offsetParent) || (node && node.ownerDocument && node.ownerDocument.body)
  // return offsetXYFromParent(touchObj || e, offsetParent)
  return offsetXYFromParent(e, offsetParent)
}

// 鼠标在父元素中的位置
export function offsetXYFromParent(evt: {clientX: number, clientY: number}, offsetParent: HTMLElement): ControlPosition {
  const isBody = offsetParent === offsetParent.ownerDocument.body

  // 用于获得页面中某个元素的左，上，右和下分别相对浏览器视窗的位置
  const offsetParentRect = isBody ? { left: 0, top: 0 } : offsetParent.getBoundingClientRect()

  const x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left
  const y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top

  return { x, y }
}

function getElementLeft(element) {
  let actualLeft = element.offsetLeft
  let current = element.offsetParent
  while (current !== null) {
    actualLeft += current.offsetLeft
    current = current.offsetParent
  }
  return actualLeft
}

function getElementTop(element) {
  let actualTop = element.offsetTop
  let current = element.offsetParent
  while (current !== null) {
    actualTop += current.offsetTop
    current = current.offsetParent
  }
  return actualTop
}

export function getinlinePosition(element) {
  const top = getElementTop(element)
  const left = getElementLeft(element)
  return { top, left }
}

function isNum(num: any): boolean {
  return typeof num === 'number' && !isNaN(num)
}

export function isArrayEqual(arr1, arr2) {
  const arr1Length = arr1.length
  const arr2Length = arr2.length
  if (arr1Length !== arr2Length) {
    return false
  }
  for (let i = 0; i < arr1Length; i++) {
    let isequal = false
    for (let j = 0; j < arr2Length; j++) {
      if (_.isEqualWith(arr1[i], arr2[j])) {
        isequal = true
        break
      }
    }
    if (!isequal) {
      return false
    }
  }
  return true
}

export function addEvent(el: Object, event: string, handler: Function, useCapTure: boolean = false): void {
  if (!el) { return }
  if (el.attachEvent) {
    el.attachEvent(`on${event}`, handler)
  } else if (el.addEventListener) {
    el.addEventListener(event, handler, useCapTure)
  } else if (el[`on${event}`]) {
    el[`on${event}`] = handler
    // $FlowIgnore: Doesn't think elements are indexable
  }
}

export function removeEvent(el: Object, event: string, handler: Function, useCapTure: boolean = false): void {
  if (!el) { return }
  if (el.detachEvent) {
    el.detachEvent(`on${event}`, handler)
  } else if (el.removeEventListener) {
    el.removeEventListener(event, handler, useCapTure)
  } else if (el[`on${event}`]) {
    el[`on${event}`] = null
  }
}

export const throttle = (fn:Function, timeout:number = 0 ,...rest:any[]):Function =>{
  let last:number, previous = 0
  return () =>{
    const now = new Date()
    if( (now - previous) > timeout){
      clearTimeout(last)
      fn(...rest)
      previous = now
      last = setTimeout(()=>{
        fn(...rest)
      },timeout)
    }
  }
}

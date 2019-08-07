/**
 * @flow
 */

import React from 'react'
import Draggable from 'react-draggable'
import type { Position, Size } from './Type';
import connect from './ContextUtils';
type Props = {
  position: Position,
  children: any,
  id: string,
  disabled: boolean,
  onDrag: Function,
  onDragStop: Function,
  currentSize: Size,
  offset: { left: number, top: number },
}
function stopEvent(e) {
  e.stopPropagation();
}
const DragZoomItem = (props: Props) => {
  const {
    id,
    position: { x = 0, y = 0 },
    disabled = true,
    onDrag,
    onDragStop,
    currentSize,
    offset: { left = 0, top = 0 },
  } = props;
  const { width, height } = currentSize;
  const boundX = -x-left;
  const boundY = -y-top;
  return (
      <Draggable
        disabled={disabled}
        position={ { x: 0, y: 0 }}
        bounds={{ left: boundX, right: width +boundX, top: boundY, bottom: height +boundY }}
        onStop={(e, position: Position) => onDragStop(id, position, e)}
        onStart={stopEvent}
        onDrag={(e, position: Position) => onDrag(id, position, e)}>
          <div className="drag-item" draggable="false" style={{ position: 'absolute', top: y, left: x }} data-id={id}>
            {props.children}
          </div>
      </Draggable>
  )
};
const WarpComponent = connect(DragZoomItem);
WarpComponent.isDragzoomItem = "DragzoomItem.V2";
export default WarpComponent;

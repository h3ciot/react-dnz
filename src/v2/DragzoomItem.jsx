/**
 * @flow
 */

import React from 'react'
import Draggable from 'react-draggable'
import type { Position } from './Type';

type Props = {
  position: Object,
  children: any,
  id: string,
  disabled: boolean,
  onDrag: Function,
  onDragStop: Function,
  allowAnyClick: boolean,
}
function stopEvent(e) {
  e.stopPropagation();
}
const DragzoomItem = (props: Props) => {
  const {
    id,
    position: { x, y },
    disabled = false,
    onDrag,
    onDragStop,
    allowAnyClick,
  } = props;
  return (
    <Draggable
      allowAnyClick = {allowAnyClick}
      draggable={disabled}
      position={ { x: 0, y: 0 }}
      onStop={(e, position: Position) => onDragStop(id, position, e)}
      onStart={stopEvent}
      onDrag={(e, position: Position) => onDrag(id, position, e)}
    >
      <div className="drag-item" draggable="false" style={{ position: 'absolute', top: y, left: x }} data-id={id}>
        {props.children}
      </div>
    </Draggable>
  )
};
DragzoomItem.isDragzoomItem = "DragzoomItem.V2";
export default DragzoomItem

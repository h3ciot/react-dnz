/**
 * @flow
 */

import React from 'react'
import Draggable from 'react-draggable'
import type { Position } from './Dragzoom'

type Props = {
  position: Object,
  children: any,
  id: string,
  pointsDisabled: boolean,
  disabled: boolean,
  onDrag: Function,
  onDragStop: Function,
  allowAnyClick: boolean,
}

const DragzoomItem = (props: Props) => {
  const {
    id,
    position: { x, y },
    pointsDisabled,
    disabled,
    onDragStart,
    onDragStop,
    allowAnyClick,
  } = props;
  const isEdit = !pointsDisabled && !disabled;
  return (
    <Draggable allowAnyClick = {allowAnyClick}
               // position={{ x, y }}
      // onStop={(e, position: Position) => onDragStop()}
      onStart={ e=> e.stopPropagation()}
      // onDrag={isEdit ? (e, position: Position) => props.onDrag(id, position) : () => false}
    >
      <div className="drag-item" draggable="false" style={{ position: 'absolute', top: y, left: x }} data-id={id}>
        {props.children}
      </div>
    </Draggable>
  )
};
DragzoomItem.isDragzoomItem = "DragzoomItem.V2";
export default DragzoomItem

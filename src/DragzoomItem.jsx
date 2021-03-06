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
  dragItemStyle: Object,
}

const DragzoomItem = (props: Props) => {
  const {
    id,
    position: { x, y },
    pointsDisabled,
    disabled,
    dragItemStyle,
    allowAnyClickToDrag,
  } = props
  const isEdit = !pointsDisabled && !disabled
  return (
    <Draggable
        allowAnyClick = {allowAnyClickToDrag}
      position={{ x, y }}
      onStop={(e, position: Position) => props.onDragStop(id)}
      onDrag={isEdit ? (e, position: Position) => props.onDrag(id, position) : () => false}
    >
      <div className="dragPoint" style={{ ...dragItemStyle, position: 'absolute', top: y, left: x }} data-id={id}>
        {props.children}
      </div>
    </Draggable>
  )
}

export default DragzoomItem

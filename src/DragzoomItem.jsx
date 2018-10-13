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
}

const DragzoomItem = (props: Props) => {
  const {
    id,
    position: { x, y },
    pointsDisabled,
    disabled,
  } = props
  const isEdit = !pointsDisabled && !disabled
  return (
    <Draggable
      position={{ x, y }}
      onStop={(e, position: Position) => props.onDragStop(id)}
      onDrag={isEdit ? (e, position: Position) => props.onDrag(id, position) : () => false}
    >
      <div className="dragPoint" style={{ position: 'absolute', top: y, left: x }} data-id={id}>
        {props.children}
      </div>
    </Draggable>
  )
}

export default DragzoomItem

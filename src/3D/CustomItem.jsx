/**
 * @author:lpf
 * @flow
 *
 **/
import React from 'react';
import Draggable from 'react-draggable';
type Position = { x: number, y: number };
type Props = {
    position: Position,
    children: any,
    id: string,
    dragable: boolean,
    onDrag: Function,
    onDragStop: Function,
    style: Object,
    allowAnyClickToDrag: boolean,
};
const CustomItem = (props: Props) => {
    console.log(props);
    const {
        id,
        position: { x, y },
        dragable,
        onDrag,
        onDragStop,
        allowAnyClickToDrag,
        style = {},
    } = props;
    return (
        <Draggable
            disabled={dragable}
            allowAnyClick = {allowAnyClickToDrag}
            position={{ x, y }}
            onStop={(e, position: Position) => onDragStop(id)}
            onDrag={(e, position: Position) => onDrag(id, position)}
        >
            <div className="dragPoint" style={{ ...style, position: 'absolute', top: y, left: x }} data-id={id}>
                {props.children}
            </div>
        </Draggable>
    )
};

export default CustomItem;

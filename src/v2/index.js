/**
 * @author:lpf
 * @flow
 *
 * */
import DragZoom from './DragZoom';
import DragZoomItems from './DragZoomItems';
import DragZoomItem from './DragZoomItem';
import DragZoomPolygon from './DragZoomPolygon';
import DragZoomCanvas from './DragZoomCanvas';
import DragZoomHotMap from './DragZoomHotMap';
import { CIRCLE, POLYGON, RECTANGLE } from "./Type";

const V2 = {
  DragZoom,
  DragZoomItems,
  DragZoomItem,
  DragZoomPolygon,
  DragZoomCanvas,
  DragZoomHotMap,
  DrawType: {
    CIRCLE, POLYGON, RECTANGLE,
  },
};
export default V2;

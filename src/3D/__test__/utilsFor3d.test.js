/**
 * @author:lpf
 * @flow
 *
 * */
import { transformCoordinateToWebgl } from '../utilsFor3d';

test('should return webgl position, between -1 to 1', () => {
  const evt = { clientX: 0, clientY: 0 };
  const offset = {
    width: 1000, height: 1000, scrollLeft: 0, scrollTop: 0, left: 0, top: 0,
  };
  const position = transformCoordinateToWebgl(evt, offset);
  expect(position.x).toBe(-1);
  expect(position.y).toBe(1);
});

test('should position {x: 0, y: 0}', () => {
  const evt = { clientX: 500, clientY: 500 };
  const offset = {
    width: 1000, height: 1000, scrollLeft: 0, scrollTop: 0, left: 0, top: 0,
  };
  const position = transformCoordinateToWebgl(evt, offset);
  expect(position.x).toBe(0);
  expect(position.y).toBe(0);
});

test('should position {x: -0.25, y: -0.25}', () => {
  const evt = { clientX: 250, clientY: 750 };
  const offset = {
    width: 1000, height: 1000, scrollLeft: 0, scrollTop: 0, left: 0, top: 0,
  };
  const position = transformCoordinateToWebgl(evt, offset, 0.5);
  expect(position.x).toBe(-0.25);
  expect(position.y).toBe(-0.25);
});

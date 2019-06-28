/**
 * @author:lpf
 * @flow
 *
 * */
import { transformCoordinateToWebgl, transformCoordinateSys, transformWebgl } from '../utilsFor3d';

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

test('should return -0.5, 0.5', () => {
  const point = transformCoordinateSys({ width: 1000, height: 1000 }, { width: 500, height: 500}, [{x: 0, y: 0}, {x: 500, y: 500}]);
  expect(point.length).toBe(2);
  expect(point[0].x).toBe(-0.5);
  expect(point[0].y).toBe(0.5);
  expect(point[1].x).toBe(0.5);
  expect(point[1].y).toBe(-0.5);
});

test('should transformWebgl to canvas position', () => {
  const sceneSize = { width: 1000, height: 1000 };
  const position = [{ x: 0, y: 0 }, { x: -500, y: -500 }, { x: 700, y: 700 }];
  const position1 = transformWebgl(position[0], sceneSize, 1);
  expect(position1.x).toBe(500);
  expect(position1.y).toBe(500);
  const position2 = transformWebgl(position[0], sceneSize, 0.5);
  expect(position2.x).toBe(250);
  expect(position2.y).toBe(250);

  const position3 = transformWebgl(position[1], sceneSize, 1);
  expect(position3.x).toBe(0);
  expect(position3.y).toBe(1000);
  const position4 = transformWebgl(position[1], sceneSize, 0.5);
  expect(position4.x).toBe(0);
  expect(position4.y).toBe(500);

  const position5 = transformWebgl(position[2], sceneSize, 1);
  expect(position5.x).toBe(1200);
  expect(position5.y).toBe(-200);
  const position6 = transformWebgl(position[2], sceneSize, 0.7);
  expect(position6.x).toBe(840);
  expect(position6.y).toBe(-140);

});

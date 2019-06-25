/*
 * @author zz85 / https://github.com/zz85
 * @author mrdoob / http://mrdoob.com
 * Running this will allow you to drag three.js objects around the screen.
 */

import {
  Camera,
  EventDispatcher,
  Matrix4,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from 'three';

// TODO 增加拖拽边界条件
const DragControls = function (_objects, _camera, _domElement, _bound) {
  if (_objects instanceof Camera) {
    console.warn('THREE.DragControls: Constructor now expects ( objects, camera, domElement )');
    const temp = _objects; _objects = _camera; _camera = temp;
  }

  const _plane = new Plane();
  const _raycaster = new Raycaster();

  const _mouse = new Vector2();
  const _offset = new Vector3();
  const _intersection = new Vector3();
  const _worldPosition = new Vector3();
  const _inverseMatrix = new Matrix4();

  let _selected = null; let
    _hovered = null;

  //

  const scope = this;

  function activate() {
    _domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    _domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    _domElement.addEventListener('mouseup', onDocumentMouseCancel, false);
    _domElement.addEventListener('mouseleave', onDocumentMouseCancel, false);
    _domElement.addEventListener('touchmove', onDocumentTouchMove, false);
    _domElement.addEventListener('touchstart', onDocumentTouchStart, false);
    _domElement.addEventListener('touchend', onDocumentTouchEnd, false);
  }

  function deactivate() {
    _domElement.removeEventListener('mousemove', onDocumentMouseMove, false);
    _domElement.removeEventListener('mousedown', onDocumentMouseDown, false);
    _domElement.removeEventListener('mouseup', onDocumentMouseCancel, false);
    _domElement.removeEventListener('mouseleave', onDocumentMouseCancel, false);
    _domElement.removeEventListener('touchmove', onDocumentTouchMove, false);
    _domElement.removeEventListener('touchstart', onDocumentTouchStart, false);
    _domElement.removeEventListener('touchend', onDocumentTouchEnd, false);
  }

  function dispose() {
    deactivate();
  }

  function onDocumentMouseMove(event) {
    event.preventDefault();

    const rect = _domElement.getBoundingClientRect();

    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);

    if (_selected && scope.enabled) {
      if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
        const {
          left = 0, right = 0, top = 0, bottom = 0,
        } = _bound;
        const newPosition = _intersection.sub(_offset).applyMatrix4(_inverseMatrix);
        // 边界条件判断
        if (newPosition.x < left
            || newPosition.x > right
            || newPosition.y < top
            || newPosition.y > bottom) return;
        _selected.position.copy(newPosition);
      }

      scope.dispatchEvent({ type: 'drag', object: _selected });

      return;
    }

    _raycaster.setFromCamera(_mouse, _camera);

    const intersects = _raycaster.intersectObjects(_objects);

    if (intersects.length > 0) {
      const object = intersects[0].object;

      if (!object.userData.dragable) return;
      _plane.setFromNormalAndCoplanarPoint(_camera.getWorldDirection(_plane.normal),
        _worldPosition.setFromMatrixPosition(object.matrixWorld));

      if (_hovered !== object) {
        scope.dispatchEvent({ type: 'hoveron', object });

        _domElement.style.cursor = 'pointer';
        _hovered = object;
      }
    } else if (_hovered !== null) {
      scope.dispatchEvent({ type: 'hoveroff', object: _hovered });

      _domElement.style.cursor = 'auto';
      _hovered = null;
    }
  }

  function onDocumentMouseDown(event) {
    event.preventDefault();

    _raycaster.setFromCamera(_mouse, _camera);

    const intersects = _raycaster.intersectObjects(_objects);

    if (intersects.length > 0) {
      _selected = intersects[0].object;

      if (!_selected.userData.dragable) {
        _selected = null;
        return;
      }
      if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
        _inverseMatrix.getInverse(_selected.parent.matrixWorld);
        // eslint-disable-next-line max-len
        _offset.copy(_intersection).sub(_worldPosition.setFromMatrixPosition(_selected.matrixWorld));
      }
      // _domElement.style.cursor = 'move';

      scope.dispatchEvent({ type: 'dragstart', object: _selected });
    }
  }

  function onDocumentMouseCancel(event) {
    event.preventDefault();

    if (_selected) {
      scope.dispatchEvent({ type: 'dragend', object: _selected });

      _selected = null;
    }

    _domElement.style.cursor = _hovered ? 'pointer' : 'auto';
  }

  function onDocumentTouchMove(event) {
    event.preventDefault();
    event = event.changedTouches[0];

    const rect = _domElement.getBoundingClientRect();

    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);

    if (_selected && scope.enabled) {
      if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
        _selected.position.copy(_intersection.sub(_offset).applyMatrix4(_inverseMatrix));
      }

      scope.dispatchEvent({ type: 'drag', object: _selected });
    }
  }

  function onDocumentTouchStart(event) {
    event.preventDefault();
    event = event.changedTouches[0];

    const rect = _domElement.getBoundingClientRect();

    _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_mouse, _camera);

    const intersects = _raycaster.intersectObjects(_objects);

    if (intersects.length > 0) {
      _selected = intersects[0].object;

      // eslint-disable-next-line max-len
      _plane.setFromNormalAndCoplanarPoint(_camera.getWorldDirection(_plane.normal), _worldPosition.setFromMatrixPosition(_selected.matrixWorld));

      if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
        _inverseMatrix.getInverse(_selected.parent.matrixWorld);
        // eslint-disable-next-line max-len
        _offset.copy(_intersection).sub(_worldPosition.setFromMatrixPosition(_selected.matrixWorld));
      }

      _domElement.style.cursor = 'move';

      scope.dispatchEvent({ type: 'dragstart', object: _selected });
    }
  }

  function onDocumentTouchEnd(event) {
    event.preventDefault();

    if (_selected) {
      scope.dispatchEvent({ type: 'dragend', object: _selected });

      _selected = null;
    }

    _domElement.style.cursor = 'auto';
  }

  activate();

  // API

  this.enabled = true;

  this.activate = activate;
  this.deactivate = deactivate;
  this.dispose = dispose;

  // Backward compatibility

  this.setObjects = function () {
    console.error('THREE.DragControls: setObjects() has been removed.');
  };

  this.on = function (type, listener) {
    console.warn('THREE.DragControls: on() has been deprecated. Use addEventListener() instead.');
    scope.addEventListener(type, listener);
  };

  this.off = function (type, listener) {
    console.warn('THREE.DragControls: off() has been deprecated. Use removeEventListener() instead.');
    scope.removeEventListener(type, listener);
  };

  this.notify = function (type) {
    console.error('THREE.DragControls: notify() has been deprecated. Use dispatchEvent() instead.');
    scope.dispatchEvent({ type });
  };
};

DragControls.prototype = Object.create(EventDispatcher.prototype);
DragControls.prototype.constructor = DragControls;

export { DragControls };

/**
 * @author:lpf
 * @flow
 *
 * */

import fetch from 'isomorphic-fetch';

export function getSvgSize(imgUrl, cb) {
  if (!imgUrl) {
    setTimeout(() => cb(null, imgUrl, { width: 0, height: 0 }), 0);
    return;
  }
  fetch(imgUrl)
    .then((r) => {
      r.text().then((text) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const rootElement = doc.rootElement;
        let size = { width: 0, height: 0 };
        if (rootElement) {
          const width = rootElement.getAttribute('width');
          const height = rootElement.getAttribute('height');
          const viewBox = rootElement.getAttribute('viewBox');
          if (width && height) {
            size = { width: parseInt(width), height: parseInt(height) };
          } else if (viewBox) {
            const sizeArr = viewBox.split(' ');
            const sizeArr2 = viewBox.split(',');
            if (sizeArr2.length === 4) {
              size = {
                width: parseInt(sizeArr2[2] - sizeArr2[0]),
                height: parseInt(sizeArr2[3] - sizeArr2[1]),
              };
            } else if (sizeArr.length >= 4) {
              const arr = sizeArr.filter(item => item !== '');
              if (arr.length === 4) {
                size = { width: parseInt(arr[2] - arr[0]), height: parseInt(arr[3] - arr[1]) };
              }
            }
          }
        }
        cb(null, imgUrl, size);
      });
    })
    .catch((error) => {
      cb(error, imgUrl);
    });
}

export function offsetXYFromParent(evt: {clientX: number, clientY: number}, offsetParent: HTMLElement): { x: number, y: number } {
  const isBody = offsetParent === offsetParent.ownerDocument.body;
  const offsetParentRect = isBody ? {left: 0, top: 0} : offsetParent.getBoundingClientRect();

  const x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left;
  const y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top;

  return {x: Math.max(0,x), y: Math.max(0,y)};
};
